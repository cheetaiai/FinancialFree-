import express, { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';
import {
  generateFinancialInsights,
  draftReminderMessage,
  chatFinancialAssistant,
  scanReceiptOrImage,
  analyzeGraphTrends
} from './gemini.ts';

const app = express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Session missing or expired. Please log in.' });
  }

  const token = authHeader.split(' ')[1];
  const user = db.verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Session has expired. Please log in again.' });
  }

  (req as any).user = user;
  (req as any).token = token;
  next();
}

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'FinancialFree' });
});

// ================= AUTH ROUTES =================
app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const authResult = db.login(email.trim(), password);
    if (!authResult) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    res.json(authResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Login error' });
  }
});

app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

app.post('/api/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = (req as any).token;
  db.logout(token);
  res.json({ success: true, message: 'Logged out successfully' });
});

app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const userId = (req as any).user.id;
    const result = db.changePassword(userId, currentPassword, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Password change failed' });
  }
});

// ================= PEOPLE ROUTES =================
app.get('/api/people', requireAuth, (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query;
    const people = db.getPeople(search as string, category as string, status as string);
    res.json(people);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch people' });
  }
});

app.get('/api/people/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const data = db.getPersonById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Person not found' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch person details' });
  }
});

app.post('/api/people', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const person = db.createPerson(req.body, userId);
    res.status(201).json(person);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create person' });
  }
});

app.put('/api/people/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const updated = db.updatePerson(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update person' });
  }
});

app.delete('/api/people/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const result = db.deletePerson(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete person' });
  }
});

app.post('/api/people/clear-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.clearAllPeople();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear all people records' });
  }
});

// ================= TRANSACTIONS ROUTES =================
app.get('/api/transactions', requireAuth, (req: Request, res: Response) => {
  try {
    const filters = {
      person_id: req.query.person_id as string,
      type: req.query.type as string,
      month: req.query.month ? Number(req.query.month) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      financial_year: req.query.financial_year as string,
      payment_method: req.query.payment_method as string,
      search: req.query.search as string
    };
    const txs = db.getTransactions(filters);
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tx = db.createTransaction(req.body, userId);
    res.status(201).json(tx);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create transaction' });
  }
});

app.put('/api/transactions/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const updated = db.updateTransaction(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const result = db.deleteTransaction(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete transaction' });
  }
});

// ================= ANALYTICS & REPORTS ROUTES =================
app.get('/api/analytics/dashboard', requireAuth, (req: Request, res: Response) => {
  try {
    const summary = db.getDashboardSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard metrics' });
  }
});

app.get('/api/analytics/monthly', requireAuth, (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const month = req.query.month ? Number(req.query.month) : now.getMonth() + 1;
    const analytics = db.getMonthlyAnalytics(year, month);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch monthly analytics' });
  }
});

app.get('/api/analytics/yearly', requireAuth, (req: Request, res: Response) => {
  try {
    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const analytics = db.getYearlyAnalytics(year);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch yearly analytics' });
  }
});

app.get('/api/analytics/financial-year', requireAuth, (req: Request, res: Response) => {
  try {
    const fy = (req.query.fy as string) || 'FY 2026-27';
    const analytics = db.getFinancialYearAnalytics(fy);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch financial year analytics' });
  }
});

app.get('/api/analytics/periods', requireAuth, (req: Request, res: Response) => {
  try {
    const periods = db.getAvailableYearsAndFys();
    res.json(periods);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch periods' });
  }
});

// ================= REMINDERS ROUTES =================
app.get('/api/reminders', requireAuth, (req: Request, res: Response) => {
  try {
    const reminders = db.getReminders();
    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reminders' });
  }
});

app.post('/api/reminders', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminder = db.createReminder(req.body, userId);
    res.status(201).json(reminder);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create reminder' });
  }
});

app.patch('/api/reminders/:id/status', requireAuth, (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = db.updateReminderStatus(req.params.id, status);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update reminder' });
  }
});

app.delete('/api/reminders/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const success = db.deleteReminder(req.params.id);
    res.json({ success });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete reminder' });
  }
});

// ================= BACKUP & EXPORT ROUTES =================
app.get('/api/database/status', requireAuth, (req: Request, res: Response) => {
  res.json({
    status: 'connected',
    provider: 'Cloud Firestore & Realtime Database',
    projectId: 'financialfree-c171e',
    databaseId: '(default)',
    databaseURL: 'https://financialfree-c171e-default-rtdb.asia-southeast1.firebasedatabase.app',
    ...db.getStatus()
  });
});

app.post('/api/database/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    await db.syncWithFirestore();
    res.json({ success: true, message: 'Cloud database synchronized successfully', ...db.getStatus() });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Sync failed' });
  }
});

app.get('/api/backup/export', requireAuth, (req: Request, res: Response) => {
  try {
    const backup = db.exportBackup();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="FinancialFree_Backup_${new Date().toISOString().split('T')[0]}.json"`
    );
    res.json(backup);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Backup export failed' });
  }
});

app.post('/api/backup/import', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.importBackup(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Backup import failed' });
  }
});

app.get('/api/export/csv', requireAuth, (req: Request, res: Response) => {
  try {
    const type = (req.query.type as string) || 'transactions';
    if (type === 'people') {
      const people = db.getPeople();
      let csv =
        'Person ID,Full Name,Phone,Email,Category,Total Given (INR),Total Returned (INR),Remaining Balance (INR),Status,Last Transaction\n';
      for (const p of people) {
        csv += `"${p.id}","${p.full_name}","${p.phone}","${p.email || ''}","${p.category || ''}",${p.total_given || 0},${p.total_returned || 0},${p.remaining_balance || 0},"${p.status}","${p.last_transaction_date || ''}"\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="FinancialFree_People_${new Date().toISOString().split('T')[0]}.csv"`
      );
      return res.send(csv);
    } else {
      const txs = db.getTransactions({});
      let csv =
        'Transaction ID,Date,Person Name,Type,Amount (INR),Payment Method,Month,Year,Financial Year,Purpose,Notes\n';
      for (const t of txs) {
        csv += `"${t.id}","${t.transaction_date}","${t.person_name || ''}","${t.transaction_type}",${t.amount},"${t.payment_method}",${t.month},${t.year},"${t.financial_year || ''}","${(t.purpose || '').replace(/"/g, '""')}","${(t.notes || '').replace(/"/g, '""')}"\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="FinancialFree_Transactions_${new Date().toISOString().split('T')[0]}.csv"`
      );
      return res.send(csv);
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'CSV export failed' });
  }
});

// ================= AI ROUTES =================
app.get('/api/ai/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const rawData = db.getRawDataForAI();
    const insights = await generateFinancialInsights(rawData);
    res.json({ insights });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate AI insights' });
  }
});

app.post('/api/ai/scan-image', requireAuth, async (req: Request, res: Response) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required (base64 string).' });
    }

    const data = await scanReceiptOrImage(image, mimeType || 'image/jpeg');
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to scan financial image' });
  }
});

app.post('/api/ai/scan-receipt', requireAuth, async (req: Request, res: Response) => {
  try {
    const { image, mimeType } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'Image data is required (base64 string).' });
    }

    const data = await scanReceiptOrImage(image, mimeType || 'image/jpeg');
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to scan receipt image' });
  }
});

app.post('/api/ai/draft-reminder', requireAuth, async (req: Request, res: Response) => {
  try {
    const { person_id, tone } = req.body;
    const personData = db.getPersonById(person_id);
    if (!personData) return res.status(404).json({ error: 'Person not found' });

    const draft = await draftReminderMessage({
      name: personData.person.full_name,
      pendingAmount: personData.person.remaining_balance || 0,
      purpose: personData.transactions[0]?.purpose,
      tone: tone || 'friendly'
    });

    res.json(draft);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to draft reminder' });
  }
});

app.post('/api/ai/analyze-graph', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type, graphData, currencySymbol } = req.body;
    if (!graphData) {
      return res.status(400).json({ error: 'graphData is required' });
    }

    const result = await analyzeGraphTrends({
      type: type || 'dashboard',
      graphData,
      currencySymbol: currencySymbol || '₹'
    });

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to analyze graph data' });
  }
});

app.post('/api/ai/chat', requireAuth, async (req: Request, res: Response) => {
  try {
    const { message, history, image, mimeType } = req.body;
    if (!message && !image) return res.status(400).json({ error: 'Message or image is required' });

    const rawData = db.getRawDataForAI();
    const result = await chatFinancialAssistant(
      history || [],
      message || 'Please analyze this uploaded document or receipt and extract relevant money details.',
      {
        people: rawData.people,
        summary: rawData.summary,
        transactions: rawData.transactions
      },
      image ? { data: image, mimeType: mimeType || 'image/jpeg' } : undefined
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'AI Assistant failed' });
  }
});

export default app;
