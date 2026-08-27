import express, { Request, Response, NextFunction } from 'express';
import { db } from './db';
import {
  generateFinancialInsights,
  draftReminderMessage,
  chatFinancialAssistant,
  scanReceiptOrImage,
  analyzeGraphTrends
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

// Health check
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), app: 'FinancialFree' });
});

// ================= AUTH ROUTES =================
apiRouter.post('/auth/login', (req: Request, res: Response) => {
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
    const people = db.getPeople(search as string, category as string, status as string);
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

apiRouter.post('/people', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const person = db.createPerson(req.body, userId);
    res.status(201).json(person);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create person' });
  }
});

apiRouter.put('/people/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const updated = db.updatePerson(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update person' });
  }
});

apiRouter.delete('/people/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const result = db.deletePerson(req.params.id);
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

apiRouter.post('/transactions', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const tx = db.createTransaction(req.body, userId);
    res.status(201).json(tx);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create transaction' });
  }
});

apiRouter.put('/transactions/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const updated = db.updateTransaction(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update transaction' });
  }
});

apiRouter.delete('/transactions/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const result = db.deleteTransaction(req.params.id);
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

// ================= ANALYTICS & SUMMARY ROUTES =================
apiRouter.get('/analytics/dashboard', requireAuth, (req: Request, res: Response) => {
  try {
    const summary = db.getDashboardSummary();
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

// ================= REMINDERS ROUTES =================
apiRouter.get('/reminders', requireAuth, (req: Request, res: Response) => {
  try {
    const reminders = db.getReminders();
    res.json(reminders);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reminders' });
  }
});

apiRouter.post('/reminders', requireAuth, (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminder = db.createReminder(req.body, userId);
    res.status(201).json(reminder);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to create reminder' });
  }
});

apiRouter.patch('/reminders/:id/status', requireAuth, (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const updated = db.updateReminder(req.params.id, { status });
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update reminder status' });
  }
});

apiRouter.put('/reminders/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const updated = db.updateReminder(req.params.id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Failed to update reminder' });
  }
});

apiRouter.delete('/reminders/:id', requireAuth, (req: Request, res: Response) => {
  try {
    const result = db.deleteReminder(req.params.id);
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

// ================= AI COPILOT & OCR ROUTES =================
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

// Mount router on /api
app.use('/api', apiRouter);

// 404 handler ONLY for /api requests
app.use('/api', (req: Request, res: Response) => {
  res.status(404).json({ error: `API route ${req.method} ${req.originalUrl || req.url} not found` });
});

// Global Express Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error occurred' });
});

export { apiRouter };
export default app;
