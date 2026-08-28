import { GoogleGenAI } from '@google/genai';
import { ScannedFinancialData } from '../src/types';

// NVIDIA NIM API Key (Supports user-provided key or environment variable)
const DEFAULT_NVIDIA_API_KEY = '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';

function getNvidiaApiKey(): string | null {
  return process.env.NVIDIA_API_KEY || DEFAULT_NVIDIA_API_KEY || null;
}

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

// Validated active Gemini models
const GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-flash-latest',
  'gemini-3.1-pro-preview'
];

// NVIDIA NIM Models
const NVIDIA_MODELS = [
  'meta/llama-3.3-70b-instruct',
  'deepseek-ai/deepseek-r1',
  'nvidia/llama-3.1-nemotron-70b-instruct',
  'meta/llama-3.1-8b-instruct'
];

// Track model cooldowns & blacklists
const modelCooldowns: Record<string, number> = {};
const disabledModels = new Set<string>();

// Cache for financial insights to conserve quota
let cachedInsightData: {
  key: string;
  insight: string;
  timestamp: number;
} | null = null;

/**
 * Call NVIDIA NIM API (OpenAI compatible endpoint)
 */
async function callNvidiaNim(messages: Array<{ role: string; content: string }>, temperature = 0.5): Promise<string | null> {
  const apiKey = getNvidiaApiKey();
  if (!apiKey) return null;

  for (const model of NVIDIA_MODELS) {
    if (disabledModels.has(model)) continue;
    const cooldownUntil = modelCooldowns[model] || 0;
    if (Date.now() < cooldownUntil) continue;

    try {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: 1500,
          top_p: 1,
          stream: false
        })
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        if (response.status === 429) {
          modelCooldowns[model] = Date.now() + 60000;
        } else if (response.status === 404 || response.status === 403) {
          disabledModels.add(model);
        }
        continue;
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (content && typeof content === 'string') {
        return content.trim();
      }
    } catch (err) {
      // Continue to next model
    }
  }

  return null;
}

/**
 * Unified Generator: Tries NVIDIA NIM first, then Gemini with Fallbacks
 */
async function generateUnifiedAI(params: {
  systemPrompt?: string;
  userPrompt: string;
  history?: Array<{ role: 'user' | 'model'; text: string }>;
  temperature?: number;
}): Promise<{ text: string; provider: string } | null> {
  const temperature = params.temperature ?? 0.5;

  // 1. Try NVIDIA NIM
  try {
    const messages: Array<{ role: string; content: string }> = [];
    if (params.systemPrompt) {
      messages.push({ role: 'system', content: params.systemPrompt });
    }
    if (params.history && params.history.length > 0) {
      for (const h of params.history.slice(-4)) {
        messages.push({
          role: h.role === 'model' ? 'assistant' : 'user',
          content: h.text
        });
      }
    }
    messages.push({ role: 'user', content: params.userPrompt });

    const nvidiaReply = await callNvidiaNim(messages, temperature);
    if (nvidiaReply) {
      return { text: nvidiaReply, provider: 'NVIDIA AI Engine' };
    }
  } catch (err) {
    // Continue to Gemini fallback
  }

  // 2. Try Gemini
  const ai = getAiClient();
  if (ai) {
    const now = Date.now();
    for (const model of GEMINI_MODELS) {
      if (disabledModels.has(model)) continue;
      const cooldownUntil = modelCooldowns[model] || 0;
      if (now < cooldownUntil) continue;

      try {
        const contents: any[] = [];
        if (params.history && params.history.length > 0) {
          for (const h of params.history.slice(-4)) {
            contents.push(`${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text}`);
          }
        }
        contents.push(`User: ${params.userPrompt}`);

        const response = await ai.models.generateContent({
          model,
          contents,
          config: {
            temperature,
            systemInstruction: params.systemPrompt
          }
        });

        if (response && response.text) {
          return { text: response.text, provider: `Gemini (${model})` };
        }
      } catch (err: any) {
        const errMsg = err?.message || String(err);
        if (errMsg.includes('429')) modelCooldowns[model] = Date.now() + 60000;
        else if (errMsg.includes('403') || errMsg.includes('404')) disabledModels.add(model);
      }
    }
  }

  return null;
}

/**
 * Scan Receipt / UPI screenshot with Gemini Vision or OCR fallback
 */
export async function scanReceiptOrImage(
  base64Image: string,
  mimeType: string = 'image/jpeg'
): Promise<ScannedFinancialData> {
  let cleanBase64 = base64Image;
  let detectedMime = mimeType;
  if (base64Image.includes(';base64,')) {
    const parts = base64Image.split(';base64,');
    detectedMime = parts[0].replace('data:', '') || mimeType;
    cleanBase64 = parts[1];
  }

  const prompt = `Analyze this financial document, payment receipt, UPI transfer screenshot (Google Pay, PhonePe, Paytm, BHIM, CRED), bank receipt, invoice, handwritten ledger note, or cash receipt.
Extract the transaction details accurately in pure JSON format with these exact keys:
{
  "amount": number or null (e.g. 2500),
  "transaction_type": "given" or "returned" (if paid to someone else -> "given"; if received from someone -> "returned"),
  "person_name": string or null (the name of the counterparty, recipient, or sender),
  "transaction_date": "YYYY-MM-DD" or null,
  "payment_method": "UPI" or "Bank Transfer" or "Cash" or "Other",
  "purpose": string or null (reason for payment, e.g., rent, loan, dinner, supplies),
  "notes": string or null (additional transaction remarks, UTR / UPI transaction ID / Ref number if present),
  "confidence_summary": string (1 brief sentence describing what was identified)
}

Return ONLY valid JSON. Do not include markdown code block syntax.`;

  const ai = getAiClient();
  if (ai) {
    for (const model of GEMINI_MODELS) {
      if (disabledModels.has(model)) continue;
      try {
        const res = await ai.models.generateContent({
          model,
          contents: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            },
            prompt
          ],
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json'
          }
        });

        if (res && res.text) {
          const cleanJson = res.text.replace(/```json/gi, '').replace(/```/g, '').trim();
          const parsed = JSON.parse(cleanJson);
          return {
            amount: typeof parsed.amount === 'number' ? parsed.amount : (parsed.amount ? parseFloat(parsed.amount) : undefined),
            transaction_type: parsed.transaction_type === 'returned' ? 'returned' : 'given',
            person_name: parsed.person_name || undefined,
            transaction_date: parsed.transaction_date || new Date().toISOString().split('T')[0],
            payment_method: ['UPI', 'Bank Transfer', 'Cash', 'Other'].includes(parsed.payment_method) ? parsed.payment_method : 'UPI',
            purpose: parsed.purpose || undefined,
            notes: parsed.notes || undefined,
            confidence_summary: parsed.confidence_summary || 'Transaction scanned and extracted successfully from receipt screenshot.'
          };
        }
      } catch (err) {
        // continue
      }
    }
  }

  // Graceful fallback
  return {
    amount: undefined,
    transaction_type: 'given',
    transaction_date: new Date().toISOString().split('T')[0],
    payment_method: 'UPI',
    purpose: 'Attached Payment Proof',
    notes: 'Receipt proof attached to transaction ledger',
    confidence_summary: 'Receipt image attached successfully. Please confirm amount and counterparty details.'
  };
}

/**
 * High-Precision AI Graph Analysis Engine for Monthly, Yearly, and Dashboard Graphs
 */
export async function analyzeGraphTrends(params: {
  type: 'monthly' | 'yearly' | 'dashboard' | 'trends';
  graphData: any;
  currencySymbol?: string;
}): Promise<{ analysis: string; provider: string }> {
  const curr = params.currencySymbol || '₹';

  const systemPrompt = `You are a Senior Financial Risk Auditor and Money Flow Analyst for the FinancialFree personal lending ledger application.
Your job is to perform an exhaustive, in-depth, expert visual and transactional data analysis of the Money Given vs. Money Returned (Taken) graph and timeline data provided.

CRITICAL MANDATORY INSTRUCTIONS:
1. Deliver a comprehensive, highly detailed analysis formatted in clean Markdown.
2. YOU MUST EXPLICITLY INCLUDE:
   - **👥 People Activity & Counterparty Breakdown**:
     * Exact count and names of people to whom money was GIVEN (lent out) during this period with individual amounts.
     * Exact count and names of people who RETURNED money (repayments taken back) during this period with individual amounts.
     * Net status of each person involved.
   - **📊 Visual Graph Trajectory & Flow Dynamics**:
     * Detailed analysis of the chart bars/trends (outflow vs. repayment inflow).
     * Peak weeks/intervals/months and exact cash flow delta.
   - **⚖️ Repayment Velocity & Portfolio Health**:
     * Recovery percentage (${curr} returned vs ${curr} given).
     * Capital lock-in risk assessment and liquidity velocity.
   - **📋 Detailed Tabular Audit Breakdown**:
     * Include a formatted Markdown table summarizing: Counterparty Name | Money Given | Money Returned | Net Change | Status
   - **💡 Actionable Recovery Strategy**:
     * Concrete, highly practical steps to follow up on outstanding balances, optimize repayment timings (e.g. salary dates, month-end cycles), and protect cash flow.
3. Be exact with figures, percentages, and amounts. Always prefix amounts with the currency symbol ${curr}.
4. Provide a rich, thorough analysis without truncating important details.`;

  const userPrompt = `Please generate an exhaustive, detailed AI Graph & Money Flow Analysis for this ${params.type.toUpperCase()} dataset:
\`\`\`json
${JSON.stringify(params.graphData, null, 2)}
\`\`\`
Ensure complete details on how many people took money, how many people returned money, individual borrower names and amounts, graph curve interpretations, and recovery actions.`;

  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt,
    temperature: 0.3
  });

  if (aiResult && aiResult.text) {
    return { analysis: aiResult.text, provider: aiResult.provider };
  }

  // Deterministic fallback analysis if network offline
  const fallbackText = generateDeterministicGraphAnalysis(params.type, params.graphData, curr);
  return { analysis: fallbackText, provider: 'Local Financial Analytics Engine' };
}

function generateDeterministicGraphAnalysis(type: string, data: any, curr: string): string {
  if (type === 'monthly') {
    const given = Number(data.total_given) || 0;
    const returned = Number(data.total_returned) || 0;
    const net = Number(data.net_flow) || (given - returned);
    const recovery = given > 0 ? Math.round((returned / given) * 100) : (returned > 0 ? 100 : 0);
    const peopleList: Array<{ name: string; given: number; returned: number }> = data.people_involved || [];

    const peopleGiven = peopleList.filter(p => (Number(p.given) || 0) > 0);
    const peopleReturned = peopleList.filter(p => (Number(p.returned) || 0) > 0);

    const monthLabel = data.month_name ? `${data.month_name} ${data.year || ''}` : 'Current Month';

    let tableRows = '';
    if (peopleList.length > 0) {
      tableRows = peopleList.map(p => {
        const pGiven = Number(p.given) || 0;
        const pRet = Number(p.returned) || 0;
        const pNet = pGiven - pRet;
        const pStatus = pNet <= 0 ? '✅ Fully Returned' : pRet > 0 ? '🔄 Partial Payment' : '⏳ Outflow Lent';
        return `| **${p.name}** | ${curr}${pGiven.toLocaleString('en-IN')} | ${curr}${pRet.toLocaleString('en-IN')} | ${curr}${Math.abs(pNet).toLocaleString('en-IN')} (${pNet > 0 ? 'Pending' : 'Settled'}) | ${pStatus} |`;
      }).join('\n');
    }

    return `### 👥 People & Counterparty Participation (${monthLabel})
- **People Given Money**: **${peopleGiven.length} person(s)** received loans (${curr}${given.toLocaleString('en-IN')} total).
  ${peopleGiven.length > 0 ? peopleGiven.map(p => `  * **${p.name}**: ${curr}${(Number(p.given) || 0).toLocaleString('en-IN')}`).join('\n') : '  * None'}
- **People Returning Money**: **${peopleReturned.length} person(s)** made repayments (${curr}${returned.toLocaleString('en-IN')} recovered).
  ${peopleReturned.length > 0 ? peopleReturned.map(p => `  * **${p.name}**: ${curr}${(Number(p.returned) || 0).toLocaleString('en-IN')}`).join('\n') : '  * None'}
- **Overall Unique Active Borrowers**: **${peopleList.length} total person(s)** engaged in transactions this month.

### 📊 Monthly Flow & Graph Dynamics
- **Total Money Lent (Outflow)**: **${curr}${given.toLocaleString('en-IN')}**
- **Total Money Returned (Inflow)**: **${curr}${returned.toLocaleString('en-IN')}**
- **Recovery Efficiency**: **${recovery}%** repayment rate for this cycle.
- **Net Balance Shift**: **${curr}${Math.abs(net).toLocaleString('en-IN')}** ${net > 0 ? '(Net increase in capital locked in loans)' : '(Net positive cash surplus recovered)'}.

${tableRows ? `### 📋 Counterparty Audit Table
| Counterparty | Money Given | Money Returned | Net Position | Cycle Status |
| :--- | :--- | :--- | :--- | :--- |
${tableRows}
` : ''}

### ⚖️ Repayment Velocity & Risk Assessment
- **Cash Flow Index**: ${recovery >= 80 ? '🟢 **High Velocity**: Inflows are keeping strong pace with newly issued loans.' : recovery >= 40 ? '🟡 **Moderate Velocity**: Balanced repayment cadence, but several open balances require active monitoring.' : '🔴 **High Capital Lock-In**: Outflows significantly exceed returned funds. Restrict fresh lending until pending payments settle.'}
- **Peak Flow Interval**: Transaction activity shows concentration around early-to-mid month disbursement cycles.

### 💡 Tactical Action Plan
1. **Targeted Follow-Ups**: Send polite WhatsApp/SMS reminder nudges to borrowers with pending amounts above ${curr}1,000.
2. **Align with Salary Windows**: Schedule settlement follow-ups between the 1st and 5th of next month.
3. **Log Proof Receipts**: Ensure all UPI screenshots and payment confirmation numbers are attached to each record.`;
  }

  if (type === 'yearly' || type === 'financial') {
    const given = Number(data.total_given) || 0;
    const returned = Number(data.total_returned) || 0;
    const net = Number(data.net_balance) || (given - returned);
    const recovery = Number(data.recovery_rate) || (given > 0 ? (returned / given) * 100 : 0);
    const breakdown: Array<{ month_name: string; given: number; returned: number; net: number }> = data.monthly_breakdown || [];

    const activeMonths = breakdown.filter(m => m.given > 0 || m.returned > 0);
    const peakGivenMonth = [...breakdown].sort((a, b) => b.given - a.given)[0];
    const peakReturnedMonth = [...breakdown].sort((a, b) => b.returned - a.returned)[0];

    const breakdownRows = breakdown.map(m => {
      const mGiven = Number(m.given) || 0;
      const mRet = Number(m.returned) || 0;
      const mNet = Number(m.net) || (mGiven - mRet);
      const mRate = mGiven > 0 ? `${Math.round((mRet / mGiven) * 100)}%` : mRet > 0 ? '100%+' : '0%';
      return `| **${m.month_name}** | ${curr}${mGiven.toLocaleString('en-IN')} | ${curr}${mRet.toLocaleString('en-IN')} | ${curr}${Math.abs(mNet).toLocaleString('en-IN')} | ${mRate} |`;
    }).join('\n');

    return `### 📊 Annual Graph & Multi-Month Trajectory (${data.period_label || 'Annual Cycle'})
- **Total Principal Lent**: **${curr}${given.toLocaleString('en-IN')}** across ${activeMonths.length} active month(s).
- **Total Capital Recovered**: **${curr}${returned.toLocaleString('en-IN')}** returned.
- **Annual Recovery Efficiency**: **${recovery.toFixed(1)}%** overall recovery efficiency.
- **Cumulative Net Outstanding**: **${curr}${Math.max(0, net).toLocaleString('en-IN')}** currently pending.

### 📅 Month-by-Month Flow Matrix
| Month | Money Given | Money Returned | Net Delta | Recovery Rate |
| :--- | :--- | :--- | :--- | :--- |
${breakdownRows}

### ⚖️ Cycle Dynamics & Peak Periods
- **Highest Lending Month**: **${peakGivenMonth?.month_name || 'N/A'}** with ${curr}${(peakGivenMonth?.given || 0).toLocaleString('en-IN')} disbursed.
- **Highest Recovery Month**: **${peakReturnedMonth?.month_name || 'N/A'}** with ${curr}${(peakReturnedMonth?.returned || 0).toLocaleString('en-IN')} collected.
- **Portfolio Health Status**: ${recovery >= 75 ? '🟢 Strong financial health with high capital turnover.' : recovery >= 45 ? '🟡 Moderate stability; focus on collecting older debts.' : '🔴 Capital exposure is high; establish formal repayment milestones.'}

### 💡 Long-Term Lending Strategy
1. **Borrower Exposure Limits**: Cap individual loans so no single borrower exceeds 25% of your total lent capital.
2. **Scheduled Installments**: For loans over ${curr}10,000, structure bi-weekly or monthly partial payments instead of lump-sum returns.
3. **Annual Audit Statement**: Export the audited PDF/CSV ledger report at the end of each financial quarter.`;
  }

  // Dashboard / Multi-Month overview
  const sum = data.summary || {};
  const given = Number(sum.total_given) || 0;
  const returned = Number(sum.total_returned) || 0;
  const pending = Number(sum.total_pending) || 0;
  const recovery = Number(sum.recovery_rate) || (given > 0 ? (returned / given) * 100 : 0);
  const peopleCount = Number(data.active_people_count) || 0;
  const trajectory: Array<{ label: string; given: number; returned: number }> = data.six_month_trajectory || [];

  return `### 📊 6-Month Macro Graph & Cash Velocity
- **Total Capital Disbursed (Given)**: **${curr}${given.toLocaleString('en-IN')}**
- **Total Capital Recovered (Returned)**: **${curr}${returned.toLocaleString('en-IN')}**
- **Current Total Pending Dues**: **${curr}${pending.toLocaleString('en-IN')}**
- **Overall Recovery Ratio**: **${recovery.toFixed(1)}%** across **${peopleCount} registered counterparties**.

### 📈 6-Month Trajectory Highlights
${trajectory.map(t => `- **${t.label}**: Given ${curr}${t.given.toLocaleString('en-IN')} vs Returned ${curr}${t.returned.toLocaleString('en-IN')} (Net: ${curr}${(t.given - t.returned).toLocaleString('en-IN')})`).join('\n')}

### ⚖️ Risk Hotspots & Recommendations
- **Risk Score**: ${recovery >= 70 ? '🟢 Low Risk' : recovery >= 40 ? '🟡 Medium Risk' : '🔴 High Risk'} (Based on unrecovered balance ratio).
- **Action**: Check the Pending Borrowers list on your Dashboard to prioritize high-value overdue accounts.`;
}

/**
 * Generate General Financial Insights
 */
export async function generateFinancialInsights(data: {
  people: any[];
  transactions: any[];
  summary: any;
}): Promise<string> {
  const recoveryRate = data.summary.total_given > 0
    ? Math.round((data.summary.total_returned / data.summary.total_given) * 100)
    : 0;

  const totalPending = data.summary.total_pending || 0;
  const topDebtors = [...(data.people || [])]
    .filter(p => p.remaining_balance > 0)
    .sort((a, b) => b.remaining_balance - a.remaining_balance)
    .slice(0, 5);

  const cacheKey = `${data.summary.total_given}_${data.summary.total_returned}_${data.summary.total_pending}_${data.people.length}_${data.transactions.length}`;
  const now = Date.now();
  if (cachedInsightData && cachedInsightData.key === cacheKey && (now - cachedInsightData.timestamp < 300000)) {
    return cachedInsightData.insight;
  }

  const systemPrompt = 'You are an intelligent personal finance auditor for FinancialFree. Format output cleanly in Markdown with high-impact financial analysis.';
  const userPrompt = `LEDGER SUMMARY:
- Total Given: ₹${data.summary.total_given?.toLocaleString('en-IN')}
- Total Returned: ₹${data.summary.total_returned?.toLocaleString('en-IN')}
- Total Outstanding Balance: ₹${totalPending?.toLocaleString('en-IN')}
- Overall Recovery Ratio: ${recoveryRate}%
- Active Borrowers Count: ${data.summary.people_count}

BORROWER BREAKDOWN:
${data.people.length === 0 ? 'No borrowers recorded yet.' : data.people.map((p: any) => `- ${p.full_name}: Given ₹${p.total_given?.toLocaleString('en-IN')}, Returned ₹${p.total_returned?.toLocaleString('en-IN')}, Pending ₹${p.remaining_balance?.toLocaleString('en-IN')} [Status: ${p.status}]`).join('\n')}

RECENT TRANSACTIONS:
${data.transactions.length === 0 ? 'No transactions recorded yet.' : data.transactions.slice(0, 10).map((t: any) => `- ${t.transaction_date}: ${t.person_name} | ${t.transaction_type === 'given' ? 'Given' : 'Returned'} | ₹${t.amount?.toLocaleString('en-IN')} | Method: ${t.payment_method}`).join('\n')}

Generate a comprehensive, structured financial health report in clean Markdown covering portfolio health, borrower risk profile, and actionable repayment strategies.`;

  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt,
    temperature: 0.5
  });

  if (aiResult && aiResult.text) {
    cachedInsightData = {
      key: cacheKey,
      insight: aiResult.text,
      timestamp: now
    };
    return aiResult.text;
  }

  // Deterministic fallback
  const deterministicInsight = `### 💡 Portfolio Health & Recovery Analysis

* **Lending Summary**: Total money given stands at **₹${(data.summary.total_given || 0).toLocaleString('en-IN')}**, with **₹${(data.summary.total_returned || 0).toLocaleString('en-IN')}** successfully recovered (**${recoveryRate}% recovery rate**).
* **Outstanding Exposure**: A total of **₹${totalPending.toLocaleString('en-IN')}** is currently pending across ${data.summary.people_count || 0} borrower contact(s).

${topDebtors.length > 0 ? `### ⚠️ Top Balances Requiring Attention\n\n` +
topDebtors.map(d => `* **${d.full_name}**: ₹${d.remaining_balance.toLocaleString('en-IN')} pending (${d.status})`).join('\n')
: '### ✅ Balance Status\n\nAll current balances are fully reconciled or no active loans are outstanding.'}

### 📋 Recommended Action Plan
1. **Send Friendly Follow-ups**: Leverage automated WhatsApp reminders for balances pending over 30 days.
2. **Align with Salary Cycles**: Schedule repayment check-ins during the 1st to 5th of every month.
3. **Verify Payment Receipts**: Maintain digital proof and UPI transaction IDs for every partial repayment.`;

  cachedInsightData = {
    key: cacheKey,
    insight: deterministicInsight,
    timestamp: now
  };

  return deterministicInsight;
}

/**
 * Draft Reminder Message
 */
export async function draftReminderMessage(borrower: {
  name: string;
  pendingAmount: number;
  lastDate?: string;
  purpose?: string;
  tone: 'polite' | 'friendly' | 'formal';
}): Promise<{ message: string; suggestedDate: string }> {
  const formattedAmount = `₹${borrower.pendingAmount.toLocaleString('en-IN')}`;
  const suggestedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const systemPrompt = 'You craft considerate, tactful financial reminder messages for WhatsApp.';
  const userPrompt = `Draft a single WhatsApp message to remind a borrower about returning money they borrowed.
Borrower Name: ${borrower.name}
Outstanding Balance: ${formattedAmount}
Purpose/Context: ${borrower.purpose || 'Personal loan/advance'}
Tone: ${borrower.tone} (Options: polite, friendly, formal)

Requirements:
- Short, natural, respectful message suitable for WhatsApp.
- Never sound aggressive or demanding.
- Mention the amount clearly (${formattedAmount}).
- Output ONLY the message text directly without meta-commentary or quotes.`;

  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt,
    temperature: 0.6
  });

  if (aiResult && aiResult.text) {
    return {
      message: aiResult.text.trim().replace(/^["']|["']$/g, ''),
      suggestedDate
    };
  }

  let msg = '';
  if (borrower.tone === 'friendly') {
    msg = `Hey ${borrower.name}! 👋 Hope you're doing great. Just checking in gently regarding the ${formattedAmount} balance from our earlier transaction. Let me know whenever convenient to settle via UPI. Thanks!`;
  } else if (borrower.tone === 'formal') {
    msg = `Dear ${borrower.name}, this is a gentle reminder regarding the outstanding balance of ${formattedAmount}. Kindly let me know your estimated timeline for the settlement. Appreciate your support.`;
  } else {
    msg = `Hi ${borrower.name}, hope everything is going well. Just sending a gentle reminder about the pending balance of ${formattedAmount}. Please transfer whenever convenient. Thank you!`;
  }

  return { message: msg, suggestedDate };
}

/**
 * Interactive Financial Assistant Chatbot with Real-time Ledger Context
 */
export async function chatFinancialAssistant(
  history: Array<{ role: 'user' | 'model'; text: string }>,
  message: string,
  contextData: { people: any[]; summary: any; transactions?: any[] },
  imageAttachment?: { data: string; mimeType: string }
): Promise<{ reply: string; provider?: string }> {
  const given = contextData.summary.total_given || 0;
  const returned = contextData.summary.total_returned || 0;
  const pending = contextData.summary.total_pending || 0;
  const recovery = given > 0 ? Math.round((returned / given) * 100) : 0;

  const systemPrompt = `You are FinancialFree AI Agent, an intelligent personal lending copilot and money management assistant powered by NVIDIA & Gemini AI.
You have real-time access to the user's live ledger:

LEDGER SUMMARY:
- Total Given: ₹${given.toLocaleString('en-IN')}
- Total Returned: ₹${returned.toLocaleString('en-IN')}
- Total Pending: ₹${pending.toLocaleString('en-IN')}
- Recovery Rate: ${recovery}%
- People in Ledger (${contextData.people.length}):
${contextData.people.length === 0 ? 'No people added yet.' : contextData.people.map((p: any) => `  * ${p.full_name} (ID: ${p.id}): Given ₹${p.total_given || 0}, Returned ₹${p.total_returned || 0}, Remaining ₹${p.remaining_balance || 0} [${p.status || 'No Balance'}] Phone: ${p.phone || 'N/A'}`).join('\n')}

RECENT TRANSACTIONS:
${(contextData.transactions || []).slice(0, 10).map((t: any) => `  * ${t.transaction_date}: ${t.person_name} | Type: ${t.transaction_type} | ₹${t.amount} | Method: ${t.payment_method} | Purpose: ${t.purpose || '-'}`).join('\n') || 'None recorded.'}

CAPABILITIES:
1. Answer questions about balances, who owes money, graph trends, and repayment history.
2. Provide graph and cashflow analysis (money given vs returned dynamics).
3. Suggest smart repayment schedules and WhatsApp reminder drafts.
4. Format all responses in clean, beautiful Markdown with clear bold terms and bullet points.`;

  // If image is attached, try Gemini Vision
  if (imageAttachment && imageAttachment.data) {
    const ai = getAiClient();
    if (ai) {
      try {
        let cleanBase64 = imageAttachment.data;
        let detectedMime = imageAttachment.mimeType || 'image/jpeg';
        if (cleanBase64.includes(';base64,')) {
          const parts = cleanBase64.split(';base64,');
          detectedMime = parts[0].replace('data:', '') || detectedMime;
          cleanBase64 = parts[1];
        }

        const res = await ai.models.generateContent({
          model: 'gemini-3.7-flash',
          contents: [
            {
              inlineData: {
                mimeType: detectedMime,
                data: cleanBase64
              }
            },
            `${systemPrompt}\n\nUser: ${message || 'Analyze this attached document/receipt image.'}`
          ]
        });

        if (res && res.text) {
          return { reply: res.text, provider: 'Gemini Vision AI' };
        }
      } catch (err) {
        // Fallback
      }
    }
  }

  const aiResult = await generateUnifiedAI({
    systemPrompt,
    userPrompt: message,
    history,
    temperature: 0.6
  });

  if (aiResult && aiResult.text) {
    return { reply: aiResult.text, provider: aiResult.provider };
  }

  // Conversational fallback
  const lowerMsg = message.toLowerCase();
  if (lowerMsg.includes('pending') || lowerMsg.includes('owe') || lowerMsg.includes('balance') || lowerMsg.includes('who')) {
    const debtors = contextData.people.filter((p: any) => p.remaining_balance > 0);
    if (debtors.length === 0) {
      return {
        reply: `🎉 **All Clear!** There are currently no pending balances. All loans have been settled or no outstanding balances exist.`
      };
    }
    const list = debtors
      .map((d: any) => `• **${d.full_name}**: ₹${d.remaining_balance.toLocaleString('en-IN')} pending (*${d.status}*)`)
      .join('\n');

    return {
      reply: `Here is the current list of people with outstanding balances (**Total Pending: ₹${pending.toLocaleString('en-IN')}**):\n\n${list}\n\nWould you like me to draft a reminder message for any of them?`
    };
  }

  if (lowerMsg.includes('graph') || lowerMsg.includes('trend') || lowerMsg.includes('analysis') || lowerMsg.includes('chart')) {
    return {
      reply: `### 📊 Money Given vs Taken (Returned) Graph Analysis\n\n` +
        `• **Total Outflow (Money Given)**: ₹${given.toLocaleString('en-IN')}\n` +
        `• **Total Inflow (Money Returned)**: ₹${returned.toLocaleString('en-IN')}\n` +
        `• **Net Outstanding Overhang**: ₹${pending.toLocaleString('en-IN')}\n` +
        `• **Current Recovery Velocity**: **${recovery}%**\n\n` +
        `**Key Trend Finding**: ${recovery >= 75 ? 'Your recovery curve is strong and healthy.' : 'There is an outstanding gap between money given and recovered. Recommend following up on the top pending balances.'}\n\n` +
        `You can also view dedicated graph breakdowns on the **Dashboard**, **Monthly Summary**, and **Yearly Summary** pages with live AI Graph Analysis!`
    };
  }

  return {
    reply: `I am your **FinancialFree AI Copilot** (Powered by NVIDIA & Gemini AI).\n\n` +
      `• **Total Given**: ₹${given.toLocaleString('en-IN')}\n` +
      `• **Total Returned**: ₹${returned.toLocaleString('en-IN')}\n` +
      `• **Net Pending**: ₹${pending.toLocaleString('en-IN')}\n` +
      `• **Recovery Ratio**: **${recovery}%**\n\n` +
      `Ask me about graphs, debtors, recovery projections, or upload a payment receipt!`
  };
}
