import { Person, Transaction, Reminder, DashboardSummary, MonthlyAnalytics, YearlyAnalytics, FinancialYearAnalytics, BackupData, User, AiTransactionSuggestion } from '../types';

const TOKEN_KEY = 'financialfree_auth_token';
const CACHE_PEOPLE_KEY = 'financialfree_cached_people';
const CACHE_TXS_KEY = 'financialfree_cached_txs';

function getLocalCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setLocalCache<T>(key: string, data: T) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `HTTP error ${response.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  firebaseLogin: (data: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null; idToken?: string }) =>
    request<{ token: string; user: User }>('/api/auth/firebase-login', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getCurrentUser: () =>
    request<{ user: User }>('/api/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/api/auth/logout', { method: 'POST' }),

  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword })
    }),

  // People
  getPeople: async (params?: { search?: string; category?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.category) q.set('category', params.category);
    if (params?.status) q.set('status', params.status);

    try {
      const data = await request<Person[]>(`/api/people?${q.toString()}`);
      if (!params || (!params.search && !params.category && !params.status)) {
        setLocalCache(CACHE_PEOPLE_KEY, data);
      }
      return data;
    } catch (err) {
      if (!params || (!params.search && !params.category && !params.status)) {
        const cached = getLocalCache<Person[]>(CACHE_PEOPLE_KEY);
        if (cached && cached.length > 0) return cached;
      }
      throw err;
    }
  },

  getPersonById: (id: string) =>
    request<{ person: Person; transactions: Transaction[]; reminders: Reminder[] }>(`/api/people/${id}`),

  createPerson: async (data: Partial<Person>) => {
    const person = await request<Person>('/api/people', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const current = getLocalCache<Person[]>(CACHE_PEOPLE_KEY) || [];
    setLocalCache(CACHE_PEOPLE_KEY, [person, ...current.filter(p => p.id !== person.id)]);
    return person;
  },

  updatePerson: async (id: string, data: Partial<Person>) => {
    const updated = await request<Person>(`/api/people/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    const current = getLocalCache<Person[]>(CACHE_PEOPLE_KEY) || [];
    setLocalCache(CACHE_PEOPLE_KEY, current.map(p => p.id === id ? updated : p));
    return updated;
  },

  deletePerson: async (id: string) => {
    const result = await request<{ success: boolean; deletedTransactions: number }>(`/api/people/${id}`, {
      method: 'DELETE'
    });
    const current = getLocalCache<Person[]>(CACHE_PEOPLE_KEY) || [];
    setLocalCache(CACHE_PEOPLE_KEY, current.filter(p => p.id !== id));
    return result;
  },

  clearAllPeople: async () => {
    const result = await request<{ success: boolean; deletedPeople: number; deletedTransactions: number }>('/api/people/clear-all', {
      method: 'POST'
    });
    setLocalCache(CACHE_PEOPLE_KEY, []);
    setLocalCache(CACHE_TXS_KEY, []);
    return result;
  },

  // Transactions
  getTransactions: async (filters?: {
    person_id?: string;
    type?: string;
    month?: number;
    year?: number;
    financial_year?: string;
    payment_method?: string;
    search?: string;
  }) => {
    const q = new URLSearchParams();
    if (filters?.person_id) q.set('person_id', filters.person_id);
    if (filters?.type) q.set('type', filters.type);
    if (filters?.month) q.set('month', filters.month.toString());
    if (filters?.year) q.set('year', filters.year.toString());
    if (filters?.financial_year) q.set('financial_year', filters.financial_year);
    if (filters?.payment_method) q.set('payment_method', filters.payment_method);
    if (filters?.search) q.set('search', filters.search);

    try {
      const data = await request<Transaction[]>(`/api/transactions?${q.toString()}`);
      if (!filters || Object.keys(filters).length === 0) {
        setLocalCache(CACHE_TXS_KEY, data);
      }
      return data;
    } catch (err) {
      if (!filters || Object.keys(filters).length === 0) {
        const cached = getLocalCache<Transaction[]>(CACHE_TXS_KEY);
        if (cached && cached.length > 0) return cached;
      }
      throw err;
    }
  },

  createTransaction: async (data: {
    person_id: string;
    transaction_type: 'given' | 'returned';
    amount: number;
    transaction_date: string;
    payment_method: string;
    category?: string;
    purpose?: string;
    notes?: string;
    receipt_image?: string;
  }) => {
    const tx = await request<Transaction>('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const current = getLocalCache<Transaction[]>(CACHE_TXS_KEY) || [];
    setLocalCache(CACHE_TXS_KEY, [tx, ...current.filter(t => t.id !== tx.id)]);
    return tx;
  },

  updateTransaction: async (id: string, data: Partial<Transaction>) => {
    const updated = await request<Transaction>(`/api/transactions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
    const current = getLocalCache<Transaction[]>(CACHE_TXS_KEY) || [];
    setLocalCache(CACHE_TXS_KEY, current.map(t => t.id === id ? updated : t));
    return updated;
  },

  deleteTransaction: async (id: string) => {
    const result = await request<{ success: boolean; message: string }>(`/api/transactions/${id}`, {
      method: 'DELETE'
    });
    const current = getLocalCache<Transaction[]>(CACHE_TXS_KEY) || [];
    setLocalCache(CACHE_TXS_KEY, current.filter(t => t.id !== id));
    return result;
  },

  // Analytics
  getDashboardSummary: () =>
    request<DashboardSummary>('/api/analytics/dashboard'),

  getMonthlyAnalytics: (year?: number, month?: number) => {
    const q = new URLSearchParams();
    if (year) q.set('year', year.toString());
    if (month) q.set('month', month.toString());
    return request<MonthlyAnalytics>(`/api/analytics/monthly?${q.toString()}`);
  },

  getYearlyAnalytics: (year?: number) => {
    const q = new URLSearchParams();
    if (year) q.set('year', year.toString());
    return request<YearlyAnalytics>(`/api/analytics/yearly?${q.toString()}`);
  },

  getFinancialYearAnalytics: (fy?: string) => {
    const q = new URLSearchParams();
    if (fy) q.set('fy', fy);
    return request<FinancialYearAnalytics>(`/api/analytics/financial-year?${q.toString()}`);
  },

  getPeriods: () =>
    request<{ years: number[]; financial_years: string[] }>('/api/analytics/periods'),

  // Reminders
  getReminders: () =>
    request<Reminder[]>('/api/reminders'),

  createReminder: (data: { person_id: string; reminder_date: string; note?: string }) =>
    request<Reminder>('/api/reminders', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateReminderStatus: (id: string, status: 'completed' | 'dismissed' | 'pending') =>
    request<Reminder>(`/api/reminders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    }),

  deleteReminder: (id: string) =>
    request<{ success: boolean }>(`/api/reminders/${id}`, {
      method: 'DELETE'
    }),

  // Backup & Export
  exportBackup: () =>
    request<BackupData>('/api/backup/export'),

  importBackup: (backup: BackupData) =>
    request<{ success: boolean; peopleCount: number; txCount: number }>('/api/backup/import', {
      method: 'POST',
      body: JSON.stringify(backup)
    }),

  // Database & Cloud Sync
  getDatabaseStatus: () =>
    request<{ status: string; provider: string; projectId: string; databaseId: string; isCloudSynced: boolean; peopleCount: number; txCount: number }>('/api/database/status'),

  syncDatabase: () =>
    request<{ success: boolean; message: string; isCloudSynced: boolean; peopleCount: number; txCount: number }>('/api/database/sync', {
      method: 'POST'
    }),

  // AI Assistant & Document Vision
  getAiInsights: () =>
    request<{ insights: string }>('/api/ai/insights'),

  draftReminder: (personId: string, tone: 'polite' | 'friendly' | 'formal') =>
    request<{ message: string; suggestedDate: string }>('/api/ai/draft-reminder', {
      method: 'POST',
      body: JSON.stringify({ person_id: personId, tone })
    }),

  scanReceiptOrImage: (image: string, mimeType?: string) =>
    request<{
      amount?: number;
      transaction_type?: 'given' | 'returned';
      person_name?: string;
      transaction_date?: string;
      payment_method?: 'UPI' | 'Bank Transfer' | 'Cash' | 'Other';
      purpose?: string;
      notes?: string;
      confidence_summary?: string;
    }>('/api/ai/scan-image', {
      method: 'POST',
      body: JSON.stringify({ image, mimeType })
    }),

  sendAiChat: (
    message: string,
    history?: Array<{ role: 'user' | 'model'; text: string }>,
    image?: string,
    mimeType?: string
  ) =>
    request<{ reply: string; action_taken?: string }>('/api/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, image, mimeType })
    }),

  analyzeGraph: (type: 'monthly' | 'yearly' | 'dashboard' | 'trends', graphData: any, currencySymbol?: string) =>
    request<{ analysis: string; provider: string }>('/api/ai/analyze-graph', {
      method: 'POST',
      body: JSON.stringify({ type, graphData, currencySymbol })
    }),

  suggestTransactionMeta: (data: {
    type: 'given' | 'returned';
    amount?: number;
    description?: string;
    notes?: string;
    personName?: string;
    personCategory?: string;
  }) =>
    request<AiTransactionSuggestion>('/api/ai/suggest-transaction-meta', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};
