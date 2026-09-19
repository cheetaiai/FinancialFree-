import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import { db } from './db';
import {
  generateFinancialInsights,
  draftReminderMessage,
  chatFinancialAssistant,
  scanReceiptOrImage,
  analyzeGraphTrends,
  suggestTransactionCategoryAndPurpose
} from './gemini';

const app = express();
const apiRouter = express.Router();

// CORS and Preflight
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

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

// Health & Root check
apiRouter.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'FinancialFree', message: 'FinancialFree API is active and running' });
});

apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'FinancialFree' });
});

// Download FinancialFree.apk file directly
apiRouter.get(['/download-apk', '/FinancialFree.apk', '/financialfree.apk', '/app.apk'], (req: Request, res: Response) => {
  const apkPath = path.resolve(process.cwd(), 'public', 'FinancialFree.apk');
  if (fs.existsSync(apkPath)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="FinancialFree.apk"');
    res.sendFile(apkPath);
  } else {
    res.status(404).json({ error: 'FinancialFree.apk package not found on server.' });
  }
});

// Download full Android Studio Project ZIP
apiRouter.get('/download-android-project', (req: Request, res: Response) => {
  const zipPath = path.resolve(process.cwd(), 'public', 'downloads', 'financialfree-android-project.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="financialfree-android-project.zip"');
    res.sendFile(zipPath);
  } else {
    res.status(404).json({ error: 'Android Studio project package not found.' });
  }
});

// ================= HCAPTCHA VERIFICATION HELPER =================
const HCAPTCHA_SECRET = process.env.HCAPTCHA_SECRET || '';
const HCAPTCHA_SITEKEY = process.env.HCAPTCHA_SITEKEY || '3bb6adea-325c-43d8-83b2-53548e2c8f9a';

async function verifyHCaptcha(token?: string, remoteIp?: string): Promise<{ success: boolean; error?: string }> {
  if (!token || typeof token !== 'string' || !token.trim()) {
    return {
      success: false,
      error: 'Security verification required: Please solve the hCaptcha challenge before proceeding.'
    };
  }

  // Handle known dev/test bypass tokens or unconfigured secret
  if (!HCAPTCHA_SECRET || token === '10000000-aaaa-bbbb-cccc-000000000001' || token === 'test-hcaptcha-token') {
    return { success: true };
  }

  try {
    const params = new URLSearchParams();
    params.append('secret', HCAPTCHA_SECRET);
    params.append('response', token.trim());
    params.append('sitekey', HCAPTCHA_SITEKEY);
    if (remoteIp) {
      params.append('remoteip', remoteIp);
    }

    const response = await fetch('https://api.hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    const data: any = await response.json();
    if (data && data.success) {
      return { success: true };
    }

    const errCodes = Array.isArray(data['error-codes']) ? data['error-codes'].join(', ') : '';
    return {
      success: false,
      error: errCodes ? `hCaptcha verification rejected: ${errCodes}` : 'hCaptcha security verification failed. Please try again.'
    };
  } catch (err: any) {
    console.error('hCaptcha verification server error:', err);
    return {
      success: false,
      error: 'Unable to reach hCaptcha verification servers. Please check your internet connection.'
    };
  }
}

// ================= AUTH ROUTES =================
apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password, hcaptchaToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Mandatory hCaptcha verification for all users and admins
    const captchaCheck = await verifyHCaptcha(hcaptchaToken, req.ip || (req.headers['x-forwarded-for'] as string));
    if (!captchaCheck.success) {
      return res.status(400).json({ error: captchaCheck.error || 'Please complete the hCaptcha security challenge.' });
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

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, phone, hcaptchaToken } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Mandatory hCaptcha verification
    const captchaCheck = await verifyHCaptcha(hcaptchaToken, req.ip || (req.headers['x-forwarded-for'] as string));
    if (!captchaCheck.success) {
      return res.status(400).json({ error: captchaCheck.error || 'Please complete the hCaptcha security challenge.' });
    }

    const authResult = db.register({ email, password, name, phone });
    res.status(201).json(authResult);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email, hcaptchaToken } = req.body;
    if (!email || !email.trim()) {
      return res.status(400).json({ error: 'Email address is required' });
    }

    // Mandatory hCaptcha verification
    const captchaCheck = await verifyHCaptcha(hcaptchaToken, req.ip || (req.headers['x-forwarded-for'] as string));
    if (!captchaCheck.success) {
      return res.status(400).json({ error: captchaCheck.error || 'Please complete the hCaptcha security challenge.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const code = db.createVerificationCode(cleanEmail, 'reset_password');
    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${cleanEmail}.`,
      code // Provided in preview so users can immediately test password recovery
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to process forgot password request' });
  }
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, 6-digit verification code, and new password are required' });
    }

    const result = db.resetPasswordWithCode(email, code, newPassword);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reset password' });
  }
});

apiRouter.get('/auth/profile', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

apiRouter.put('/auth/profile', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const updated = db.updateProfile(userId, req.body);
    res.json({ success: true, user: updated });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update profile' });
  }
});

apiRouter.post('/auth/send-verification-code', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const code = db.createVerificationCode(user.email, 'verify_email');
    res.json({
      success: true,
      message: `A 6-digit verification code has been dispatched to ${user.email}.`,
      code
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to send verification code' });
  }
});

apiRouter.post('/auth/verify-email', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ error: 'Verification code is required' });
    }

    const result = db.verifyEmailWithCode(userId, code);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to verify email' });
  }
});

apiRouter.post('/auth/firebase-login', (req: Request, res: Response) => {
  try {
    const { uid, email, displayName } = req.body;
    if (!uid) {
      return res.status(400).json({ error: 'Firebase UID is required' });
    }

    const authResult = db.loginWithFirebase({ uid, email, displayName });
    res.json(authResult);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Firebase login error' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
});

apiRouter.post('/auth/logout', requireAuth, (req: Request, res: Response) => {
  const token = (req as any).token;
  db.logout(token);
  res.json({ success: true, message: 'Logged out successfully' });
});

apiRouter.post('/auth/change-password', requireAuth, (req: Request, res: Response) => {
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
apiRouter.get('/people', requireAuth, (req: Request, res: Response) => {
  try {
    const { search, category, status } = req.query;
    const user = (req as any).user;
    const people = db.getPeople(search as string, category as string, status as string, user?.id, user?.role);
    res.json(people);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch people' });
  }
});

apiRouter.get('/people/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const data = db.getPersonById(req.params.id);
    if (!data) return res.status(404).json({ error: 'Person not found' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch person details' });
  }
});

apiRouter.post('/people', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const person = await db.createPerson(req.body, userId);
    res.status(201).json(person);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create person' });
  }
});

apiRouter.put('/people/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await db.updatePerson(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update person' });
  }
});

apiRouter.delete('/people/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.deletePerson(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete person' });
  }
});

apiRouter.post('/people/clear-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.clearAllPeople();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear all people records' });
  }
});

// ================= TRANSACTIONS ROUTES =================
apiRouter.get('/transactions', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const filters = {
      person_id: req.query.person_id as string,
      type: req.query.type as string,
      month: req.query.month ? Number(req.query.month) : undefined,
      year: req.query.year ? Number(req.query.year) : undefined,
      financial_year: req.query.financial_year as string,
      payment_method: req.query.payment_method as string,
      search: req.query.search as string
    };
    const txs = db.getTransactions(filters, user?.id, user?.role);
    res.json(txs);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

apiRouter.post('/transactions', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tx = await db.createTransaction(req.body, userId);
    res.status(201).json(tx);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create transaction' });
  }
});

apiRouter.put('/transactions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await db.updateTransaction(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update transaction' });
  }
});

apiRouter.delete('/transactions/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.deleteTransaction(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete transaction' });
  }
});

apiRouter.post('/transactions/clear-all', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.clearAllTransactions();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clear all transactions' });
  }
});

apiRouter.post('/admin/clean-orphaned', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.purgeOrphanedRecords();
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to clean orphaned records' });
  }
});

// ================= ANALYTICS & SUMMARY ROUTES =================
apiRouter.get('/analytics/dashboard', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const summary = db.getDashboardSummary(user?.id, user?.role);
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch dashboard summary' });
  }
});

apiRouter.get('/analytics/monthly', requireAuth, (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const month = req.query.month ? Number(req.query.month) : (new Date().getMonth() + 1);
    const analytics = db.getMonthlyAnalytics(year, month);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch monthly analytics' });
  }
});

apiRouter.get('/analytics/yearly', requireAuth, (req: Request, res: Response) => {
  try {
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();
    const analytics = db.getYearlyAnalytics(year);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch yearly analytics' });
  }
});

apiRouter.get('/analytics/financial-year', requireAuth, (req: Request, res: Response) => {
  try {
    const fy = req.query.fy as string | undefined;
    const analytics = db.getFinancialYearAnalytics(fy);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch financial year analytics' });
  }
});

apiRouter.get('/analytics/financial-years', requireAuth, (req: Request, res: Response) => {
  try {
    const fy = req.query.fy as string | undefined;
    const analytics = db.getFinancialYearAnalytics(fy);
    res.json(analytics);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch financial year analytics' });
  }
});

apiRouter.get('/analytics/periods', requireAuth, (req: Request, res: Response) => {
  try {
    const periods = db.getAvailableYearsAndFys();
    res.json(periods);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch periods' });
  }
});

// ================= DATABASE & SYNC ROUTES =================
apiRouter.get('/database/status', requireAuth, (req: Request, res: Response) => {
  try {
    const status = db.getStatus();
    res.json({
      status: 'online',
      provider: 'Cloud Firestore & Local Mirror',
      projectId: 'financialfree-c171e',
      databaseId: '(default)',
      isCloudSynced: status.isCloudSynced,
      peopleCount: status.peopleCount,
      txCount: status.txCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch database status' });
  }
});

apiRouter.post('/database/sync', requireAuth, async (req: Request, res: Response) => {
  try {
    await db.pushAllToFirestore();
    const status = db.getStatus();
    res.json({
      success: true,
      message: 'Database successfully synchronized with Cloud Firestore.',
      isCloudSynced: status.isCloudSynced,
      peopleCount: status.peopleCount,
      txCount: status.txCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to sync database' });
  }
});

apiRouter.get('/database/integrity-check', requireAuth, (req: Request, res: Response) => {
  try {
    const report = db.getIntegrityReport();
    res.json(report);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to perform integrity check' });
  }
});

apiRouter.post('/database/reconcile', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.reconcileWithClient(req.body);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reconcile database state' });
  }
});

// ================= REMINDERS ROUTES =================
apiRouter.get('/reminders', requireAuth, (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const reminders = db.getReminders(user?.id, user?.role);
    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reminders' });
  }
});

apiRouter.post('/reminders', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminder = await db.createReminder(req.body, userId);
    res.status(201).json(reminder);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create reminder' });
  }
});

apiRouter.patch('/reminders/:id/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = await db.updateReminder(req.params.id, { status });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update reminder status' });
  }
});

apiRouter.put('/reminders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const updated = await db.updateReminder(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update reminder' });
  }
});

apiRouter.delete('/reminders/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.deleteReminder(req.params.id);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to delete reminder' });
  }
});

// ================= BACKUP & RESTORE ROUTES =================
apiRouter.get('/backup/export', requireAuth, (req: Request, res: Response) => {
  try {
    const data = db.exportAllData();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to export backup data' });
  }
});

apiRouter.post('/backup/import', requireAuth, (req: Request, res: Response) => {
  try {
    const result = db.importAllData(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to import backup data' });
  }
});

apiRouter.post('/backup/reset', requireAuth, (req: Request, res: Response) => {
  try {
    const result = db.resetToSampleData();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to reset data' });
  }
});

// Cloud Firestore Backup & Restore APIs
apiRouter.get('/backup/cloud-status', requireAuth, async (req: Request, res: Response) => {
  try {
    const status = await db.getCloudBackupStatus();
    res.json(status);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to get cloud backup status' });
  }
});

apiRouter.post('/backup/cloud-push', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.pushCloudBackup();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to push cloud backup' });
  }
});

apiRouter.post('/backup/cloud-restore', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await db.restoreFromCloudBackup();
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to restore from cloud backup' });
  }
});

// ================= AI COPILOT & OCR ROUTES =================
apiRouter.post('/ai/suggest-transaction-meta', requireAuth, async (req: Request, res: Response) => {
  try {
    const { type, amount, description, notes, personName, personCategory } = req.body;
    const result = await suggestTransactionCategoryAndPurpose({
      type: type || 'given',
      amount: amount ? Number(amount) : undefined,
      description,
      notes,
      personName,
      personCategory
    });
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to suggest transaction metadata' });
  }
});

apiRouter.get('/ai/insights', requireAuth, async (req: Request, res: Response) => {
  try {
    const rawData = db.getRawDataForAI();
    const insights = await generateFinancialInsights({
      summary: rawData.summary,
      people: rawData.people,
      transactions: rawData.transactions
    });
    res.json({ insights });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to generate financial insights' });
  }
});

apiRouter.post('/ai/scan-image', requireAuth, async (req: Request, res: Response) => {
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

apiRouter.post('/ai/scan-receipt', requireAuth, async (req: Request, res: Response) => {
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

apiRouter.post('/ai/draft-reminder', requireAuth, async (req: Request, res: Response) => {
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

apiRouter.post('/ai/analyze-graph', requireAuth, async (req: Request, res: Response) => {
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

apiRouter.post('/ai/chat', requireAuth, async (req: Request, res: Response) => {
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

// Mount router on /api and root fallback (ensures compatibility with both container and Vercel serverless routing)
app.use('/api', apiRouter);
app.use(apiRouter);

// 404 handler ONLY for API requests
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.url.startsWith('/api') || req.url.startsWith('/auth') || req.url.startsWith('/people') || req.url.startsWith('/transactions') || req.url.startsWith('/summary') || req.url.startsWith('/reminders')) {
    return res.status(404).json({ error: `API route ${req.method} ${req.originalUrl || req.url} not found` });
  }
  next();
});

// Global Express Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error occurred' });
});

export { apiRouter };
export default app;
