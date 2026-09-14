import {
  Person,
  Transaction,
  Reminder,
  DashboardSummary,
  MonthlyAnalytics,
  YearlyAnalytics,
  FinancialYearAnalytics,
  BackupData,
  User,
  AiTransactionSuggestion,
  SyncStatus,
  IntegrityServerReport,
  DiscrepancyDetails
} from '../types';

const TOKEN_KEY = 'financialfree_auth_token';
const CACHE_PEOPLE_KEY = 'financialfree_cached_people';
const CACHE_TXS_KEY = 'financialfree_cached_txs';
const VAULT_PEOPLE_KEY = 'financialfree_vault_people';
const VAULT_TXS_KEY = 'financialfree_vault_txs';
const VAULT_REMINDERS_KEY = 'financialfree_vault_reminders';
const LAST_SYNC_KEY = 'financialfree_last_sync_timestamp';
export const FF_PEOPLE_DIRECTORY_KEY = 'ff_people_directory';

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

// Immediate Self-Healing: Purge legacy fake transaction (t1, 5000, unknown person) from browser storage
try {
  [VAULT_TXS_KEY, CACHE_TXS_KEY].forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw && (raw.includes('"t1"') || raw.includes('"amount":5000') || raw.includes('"amount": 5000'))) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(t => t && t.id !== 't1' && t.person_id !== 'p1' && t.person_id !== '1');
          localStorage.setItem(key, JSON.stringify(filtered));
        }
      } catch {}
    }
  });
} catch {}

// ================= PERMANENT INDELIBLE LOCAL VAULT =================
// The browser vault prevents any data loss from server restarts or temporary connectivity issues
export const localVault = {
  getPeople(): Person[] {
    const vault = getLocalCache<Person[]>(VAULT_PEOPLE_KEY);
    const cached = getLocalCache<Person[]>(CACHE_PEOPLE_KEY);
    let list: Person[] = vault || cached || [];

    // Filter out any mock/sample entries (e.g. Rohan Verma)
    list = list.filter(p => {
      const n = (p.full_name || '').toLowerCase();
      return !n.includes('rohan') && !n.includes('verma') && !n.includes('varma') && p.id !== '1';
    });

    // Also ingest from legacy or standalone ff_people_directory if present
    const directory = getLocalCache<any[]>(FF_PEOPLE_DIRECTORY_KEY);
    if (Array.isArray(directory) && directory.length > 0) {
      let changed = false;
      for (const item of directory) {
        const name = item.name || item.full_name;
        if (!name) continue;
        const lower = name.toLowerCase();
        if (lower.includes('rohan') || lower.includes('verma') || lower.includes('varma') || item.id === '1') continue;
        const exists = list.some(p => p.id === item.id || p.full_name.toLowerCase() === lower);
        if (!exists) {
          const amt = Number(item.amount || item.total_given || 0);
          list.push({
            id: item.id || `p_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            user_id: item.user_id || 'usr_master_admin_01',
            full_name: name,
            phone: item.phone || '',
            address: item.city || item.address || '',
            category: item.category || 'General',
            status: item.status || 'Pending',
            total_given: amt,
            total_returned: item.total_returned || 0,
            remaining_balance: item.remaining_balance !== undefined ? item.remaining_balance : amt,
            transaction_count: item.transaction_count || (amt > 0 ? 1 : 0),
            created_at: item.created_at || new Date().toISOString(),
            updated_at: item.updated_at || new Date().toISOString(),
          });
          changed = true;
        }
      }
      if (changed && list.length > 0) {
        setLocalCache(VAULT_PEOPLE_KEY, list);
        setLocalCache(CACHE_PEOPLE_KEY, list);
      }
    }

    return list;
  },
  savePeople(people: Person[]) {
    const clean = people.filter(p => {
      const n = (p.full_name || '').toLowerCase();
      return !n.includes('rohan') && !n.includes('verma') && !n.includes('varma') && p.id !== '1';
    });
    setLocalCache(VAULT_PEOPLE_KEY, clean);
    setLocalCache(CACHE_PEOPLE_KEY, clean);

    // Keep ff_people_directory in perfect sync
    try {
      const dirFormat = clean.map(p => ({
        id: p.id,
        name: p.full_name,
        category: p.category || 'General',
        status: p.status || 'Pending',
        amount: p.total_given || p.remaining_balance || 0,
        phone: p.phone || '',
        city: p.address || ''
      }));
      localStorage.setItem(FF_PEOPLE_DIRECTORY_KEY, JSON.stringify(dirFormat));
    } catch {
      // ignore
    }
  },
  savePerson(person: Person) {
    const n = (person.full_name || '').toLowerCase();
    if (n.includes('rohan') || n.includes('verma') || n.includes('varma') || person.id === '1') return;
    const list = this.getPeople();
    const idx = list.findIndex(p => p.id === person.id);
    if (idx !== -1) {
      list[idx] = person;
    } else {
      list.unshift(person);
    }
    this.savePeople(list);
  },
  removePerson(id: string) {
    const list = this.getPeople().filter(p => p.id !== id);
    this.savePeople(list);
    const txs = this.getTransactions().filter(t => t.person_id !== id);
    this.saveTransactions(txs);
  },
  getTransactions(): Transaction[] {
    const raw = getLocalCache<Transaction[]>(VAULT_TXS_KEY) || getLocalCache<Transaction[]>(CACHE_TXS_KEY) || [];
    const people = this.getPeople();
    const validPersonIds = new Set(people.map(p => p.id));
    const clean = raw.filter(t => {
      if (!t || t.id === 't1' || t.person_id === 'p1' || t.person_id === '1') return false;
      if (!validPersonIds.has(t.person_id)) return false;
      return true;
    });
    if (clean.length !== raw.length) {
      setLocalCache(VAULT_TXS_KEY, clean);
      setLocalCache(CACHE_TXS_KEY, clean);
    }
    return clean;
  },
  saveTransactions(txs: Transaction[]) {
    const people = this.getPeople();
    const validPersonIds = new Set(people.map(p => p.id));
    const clean = (txs || []).filter(t => {
      if (!t || t.id === 't1' || t.person_id === 'p1' || t.person_id === '1') return false;
      if (!validPersonIds.has(t.person_id)) return false;
      return true;
    });
    setLocalCache(VAULT_TXS_KEY, clean);
    setLocalCache(CACHE_TXS_KEY, clean);
  },
  saveTransaction(tx: Transaction) {
    const list = this.getTransactions();
    const idx = list.findIndex(t => t.id === tx.id);
    if (idx !== -1) {
      list[idx] = tx;
    } else {
      list.unshift(tx);
    }
    this.saveTransactions(list);

    // Immediately recalculate person in localVault so balance and status update without refresh
    if (tx.person_id) {
      const personList = this.getPeople();
      const pIdx = personList.findIndex(p => p.id === tx.person_id);
      if (pIdx !== -1) {
        const personTxs = list.filter(t => t.person_id === tx.person_id);
        const given = personTxs.filter(t => t.transaction_type === 'given').reduce((s, t) => s + Number(t.amount || 0), 0);
        const ret = personTxs.filter(t => t.transaction_type === 'returned').reduce((s, t) => s + Number(t.amount || 0), 0);
        const bal = Math.max(0, given - ret);
        personList[pIdx] = {
          ...personList[pIdx],
          total_given: given,
          total_returned: ret,
          remaining_balance: bal,
          transaction_count: personTxs.length,
          status: bal === 0 ? 'Settled' : 'Pending',
          updated_at: new Date().toISOString()
        };
        this.savePeople(personList);
      }
    }
  },
  removeTransaction(id: string) {
    const list = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(list);
  },
  getReminders(): Reminder[] {
    return getLocalCache<Reminder[]>(VAULT_REMINDERS_KEY) || [];
  },
  saveReminders(reminders: Reminder[]) {
    setLocalCache(VAULT_REMINDERS_KEY, reminders);
  },
  saveReminder(reminder: Reminder) {
    const list = this.getReminders();
    const idx = list.findIndex(r => r.id === reminder.id);
    if (idx !== -1) {
      list[idx] = reminder;
    } else {
      list.unshift(reminder);
    }
    this.saveReminders(list);
  },
  removeReminder(id: string) {
    const list = this.getReminders().filter(r => r.id !== id);
    this.saveReminders(list);
  },
  getLastSync(): string | null {
    return localStorage.getItem(LAST_SYNC_KEY);
  },
  setLastSync(timestamp: string) {
    localStorage.setItem(LAST_SYNC_KEY, timestamp);
  },
  clearAll() {
    localStorage.removeItem(VAULT_PEOPLE_KEY);
    localStorage.removeItem(CACHE_PEOPLE_KEY);
    localStorage.removeItem(VAULT_TXS_KEY);
    localStorage.removeItem(CACHE_TXS_KEY);
    localStorage.removeItem(VAULT_REMINDERS_KEY);
  }
};

// ================= REAL-TIME SYNC EVENT SYSTEM =================
export type SyncEvent =
  | { type: 'start'; operation: string }
  | { type: 'success'; operation: string; timestamp: Date; countInfo?: { peopleCount: number; txCount: number } }
  | { type: 'error'; operation: string; error: string }
  | { type: 'discrepancy'; details: DiscrepancyDetails };

type SyncListener = (event: SyncEvent) => void;
const syncListeners = new Set<SyncListener>();

export function subscribeSyncEvents(listener: SyncListener): () => void {
  syncListeners.add(listener);
  return () => syncListeners.delete(listener);
}

export function notifySync(event: SyncEvent) {
  syncListeners.forEach(fn => {
    try {
      fn(event);
    } catch (e) {
      console.error('Sync listener error:', e);
    }
  });
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
        const vaultPeople = localVault.getPeople();
        // Crucial data-protection guard: Never overwrite local vault if server returns empty while vault has entries
        if (data.length === 0 && vaultPeople.length > 0) {
          console.warn('Server returned 0 people while local vault has', vaultPeople.length, 'people. Retaining local vault records.');
          return vaultPeople;
        }
        localVault.savePeople(data);
      }
      return data;
    } catch (err) {
      if (!params || (!params.search && !params.category && !params.status)) {
        const cached = localVault.getPeople();
        if (cached && cached.length > 0) return cached;
      }
      throw err;
    }
  },

  getPersonById: async (id: string) => {
    try {
      const data = await request<{ person: Person; transactions: Transaction[]; reminders: Reminder[] }>(`/api/people/${id}`);
      return data;
    } catch (err) {
      // Local vault fallback
      const person = localVault.getPeople().find(p => p.id === id);
      if (person) {
        const txs = localVault.getTransactions().filter(t => t.person_id === id);
        const reminders = localVault.getReminders().filter(r => r.person_id === id);
        return { person, transactions: txs, reminders };
      }
      throw err;
    }
  },

  createPerson: async (data: Partial<Person>) => {
    notifySync({ type: 'start', operation: `Saving ${data.full_name || 'person'}...` });
    try {
      const person = await request<Person>('/api/people', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localVault.savePerson(person);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: `Added ${person.full_name}`,
        timestamp: new Date()
      });
      return person;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Add person', error: err.message });
      throw err;
    }
  },

  updatePerson: async (id: string, data: Partial<Person>) => {
    notifySync({ type: 'start', operation: `Updating ${data.full_name || 'person'}...` });
    try {
      const updated = await request<Person>(`/api/people/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      localVault.savePerson(updated);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: `Updated ${updated.full_name}`,
        timestamp: new Date()
      });
      return updated;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Update person', error: err.message });
      throw err;
    }
  },

  deletePerson: async (id: string) => {
    notifySync({ type: 'start', operation: 'Deleting person & records...' });
    try {
      const result = await request<{ success: boolean; deletedTransactions: number }>(`/api/people/${id}`, {
        method: 'DELETE'
      });
      localVault.removePerson(id);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: 'Person removed',
        timestamp: new Date()
      });
      return result;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Delete person', error: err.message });
      throw err;
    }
  },

  clearAllPeople: async () => {
    notifySync({ type: 'start', operation: 'Clearing all database records...' });
    try {
      const result = await request<{ success: boolean; deletedPeople: number; deletedTransactions: number }>('/api/people/clear-all', {
        method: 'POST'
      });
      localVault.clearAll();
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: 'All records cleared',
        timestamp: new Date()
      });
      return result;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Clear database', error: err.message });
      throw err;
    }
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
        const vaultTxs = localVault.getTransactions();
        // Crucial data-protection guard: Never overwrite local vault if server returns empty while vault has entries
        if (data.length === 0 && vaultTxs.length > 0) {
          console.warn('Server returned 0 transactions while local vault has', vaultTxs.length, 'transactions. Retaining local vault records.');
          return vaultTxs;
        }
        localVault.saveTransactions(data);
      }
      return data;
    } catch (err) {
      if (!filters || Object.keys(filters).length === 0) {
        const cached = localVault.getTransactions();
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
    notifySync({
      type: 'start',
      operation: data.transaction_type === 'given' ? 'Recording money given...' : 'Recording return payment...'
    });
    try {
      const tx = await request<Transaction>('/api/transactions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localVault.saveTransaction(tx);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: data.transaction_type === 'given' ? 'Money given committed' : 'Payment return committed',
        timestamp: new Date()
      });
      return tx;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Save transaction', error: err.message });
      throw err;
    }
  },

  updateTransaction: async (id: string, data: Partial<Transaction>) => {
    notifySync({ type: 'start', operation: 'Updating transaction record...' });
    try {
      const updated = await request<Transaction>(`/api/transactions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      localVault.saveTransaction(updated);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: 'Transaction updated',
        timestamp: new Date()
      });
      return updated;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Update transaction', error: err.message });
      throw err;
    }
  },

  deleteTransaction: async (id: string) => {
    notifySync({ type: 'start', operation: 'Deleting transaction...' });
    try {
      const result = await request<{ success: boolean; message: string }>(`/api/transactions/${id}`, {
        method: 'DELETE'
      });
      localVault.removeTransaction(id);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: 'Transaction deleted',
        timestamp: new Date()
      });
      return result;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Delete transaction', error: err.message });
      throw err;
    }
  },

  clearAllTransactions: async () => {
    const res = await request<{ success: boolean; deletedTransactions: number }>('/api/transactions/clear-all', {
      method: 'POST'
    });
    localVault.saveTransactions([]);
    return res;
  },

  cleanOrphanedRecords: async () => {
    const res = await request<{ success: boolean; purgedTransactions: number; purgedReminders: number }>('/api/admin/clean-orphaned', {
      method: 'POST'
    });
    // Force re-clean of local cache
    localVault.getTransactions();
    return res;
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

  createReminder: async (data: { person_id: string; reminder_date: string; note?: string }) => {
    notifySync({ type: 'start', operation: 'Scheduling reminder...' });
    try {
      const reminder = await request<Reminder>('/api/reminders', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      localVault.saveReminder(reminder);
      notifySync({ type: 'success', operation: 'Reminder saved', timestamp: new Date() });
      return reminder;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Create reminder', error: err.message });
      throw err;
    }
  },

  updateReminderStatus: async (id: string, status: 'completed' | 'dismissed' | 'pending') => {
    notifySync({ type: 'start', operation: 'Updating reminder...' });
    try {
      const updated = await request<Reminder>(`/api/reminders/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      localVault.saveReminder(updated);
      notifySync({ type: 'success', operation: 'Reminder updated', timestamp: new Date() });
      return updated;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Update reminder', error: err.message });
      throw err;
    }
  },

  deleteReminder: async (id: string) => {
    notifySync({ type: 'start', operation: 'Removing reminder...' });
    try {
      const res = await request<{ success: boolean }>(`/api/reminders/${id}`, {
        method: 'DELETE'
      });
      localVault.removeReminder(id);
      notifySync({ type: 'success', operation: 'Reminder removed', timestamp: new Date() });
      return res;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Delete reminder', error: err.message });
      throw err;
    }
  },

  // Backup & Export
  exportBackup: () =>
    request<BackupData>('/api/backup/export'),

  getCloudBackupStatus: () =>
    request<{
      hasBackup: boolean;
      timestamp?: string;
      peopleCount: number;
      txCount: number;
      reminderCount: number;
      totalGiven?: number;
      totalReturned?: number;
      provider: string;
    }>('/api/backup/cloud-status'),

  pushCloudBackup: async () => {
    notifySync({ type: 'start', operation: 'Creating automated cloud backup in Firestore...' });
    try {
      const res = await request<{
        success: boolean;
        timestamp: string;
        peopleCount: number;
        txCount: number;
        reminderCount: number;
        totalGiven: number;
        totalReturned: number;
      }>('/api/backup/cloud-push', { method: 'POST' });
      localVault.setLastSync(res.timestamp);
      notifySync({
        type: 'success',
        operation: `Cloud backup created (${res.peopleCount} members, ${res.txCount} transactions)`,
        timestamp: new Date(res.timestamp)
      });
      return res;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Cloud backup', error: err.message });
      throw err;
    }
  },

  restoreFromCloudBackup: async () => {
    notifySync({ type: 'start', operation: 'Restoring records from Firestore cloud backup...' });
    try {
      const res = await request<{
        success: boolean;
        restoredPeopleCount: number;
        restoredTxCount: number;
        restoredReminderCount: number;
        timestamp: string;
        message: string;
        people: Person[];
        transactions: Transaction[];
        reminders: Reminder[];
      }>('/api/backup/cloud-restore', { method: 'POST' });

      if (res.people) localVault.savePeople(res.people);
      if (res.transactions) localVault.saveTransactions(res.transactions);
      if (res.reminders) localVault.saveReminders(res.reminders);
      localVault.setLastSync(new Date().toISOString());

      notifySync({
        type: 'success',
        operation: `Restored ${res.restoredPeopleCount} members & ${res.restoredTxCount} transactions from cloud`,
        timestamp: new Date()
      });
      return res;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Restore from cloud', error: err.message });
      throw err;
    }
  },

  importBackup: async (backup: BackupData) => {
    notifySync({ type: 'start', operation: 'Importing backup & synchronizing cloud...' });
    try {
      const res = await request<{ success: boolean; peopleCount: number; txCount: number }>('/api/backup/import', {
        method: 'POST',
        body: JSON.stringify(backup)
      });
      if (backup.people) localVault.savePeople(backup.people);
      if (backup.transactions) localVault.saveTransactions(backup.transactions);
      if (backup.reminders) localVault.saveReminders(backup.reminders);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: `Imported ${res.peopleCount} people and ${res.txCount} transactions`,
        timestamp: new Date()
      });
      return res;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Import backup', error: err.message });
      throw err;
    }
  },

  // Database & Cloud Sync
  getDatabaseStatus: () =>
    request<{ status: string; provider: string; projectId: string; databaseId: string; isCloudSynced: boolean; peopleCount: number; txCount: number }>('/api/database/status'),

  syncDatabase: async () => {
    notifySync({ type: 'start', operation: 'Pushing database to Cloud Firestore...' });
    try {
      const res = await request<{ success: boolean; message: string; isCloudSynced: boolean; peopleCount: number; txCount: number }>('/api/database/sync', {
        method: 'POST'
      });
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: 'Cloud Firestore synchronized',
        timestamp: new Date()
      });
      return res;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Sync database', error: err.message });
      throw err;
    }
  },

  // Automated Data Integrity & Cloud Reconciliation
  getIntegrityCheck: () =>
    request<IntegrityServerReport>('/api/database/integrity-check'),

  reconcileDatabase: async (payload: {
    action: 'merge' | 'push_local' | 'pull_remote';
    localPeople?: Person[];
    localTransactions?: Transaction[];
    localReminders?: Reminder[];
  }) => {
    notifySync({ type: 'start', operation: 'Reconciling local vault with Cloud database...' });
    try {
      const res = await request<{
        success: boolean;
        actionTaken: string;
        peopleCount: number;
        txCount: number;
        people: Person[];
        transactions: Transaction[];
        reminders: Reminder[];
      }>('/api/database/reconcile', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      if (res.people) localVault.savePeople(res.people);
      if (res.transactions) localVault.saveTransactions(res.transactions);
      if (res.reminders) localVault.saveReminders(res.reminders);
      localVault.setLastSync(new Date().toISOString());
      notifySync({
        type: 'success',
        operation: `Reconciled: ${res.peopleCount} members, ${res.txCount} transactions secured`,
        timestamp: new Date()
      });
      return res;
    } catch (err: any) {
      notifySync({ type: 'error', operation: 'Reconcile database', error: err.message });
      throw err;
    }
  },

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
