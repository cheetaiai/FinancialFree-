import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { Person, Transaction, Reminder, User, DashboardSummary, MonthlyAnalytics, YearlyAnalytics, FinancialYearAnalytics, BackupData } from '../src/types';
import { firestoreRest } from './firestore.ts';

interface DatabaseSchema {
  users: Array<{
    id: string;
    email: string;
    password_hash: string;
    salt: string;
    created_at: string;
    updated_at: string;
  }>;
  people: Person[];
  transactions: Transaction[];
  reminders: Reminder[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Helper to hash password
export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const currentSalt = salt || crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, currentSalt, 1000, 64, 'sha512').toString('hex');
  return { hash, salt: currentSalt };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const checkHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return checkHash === hash;
}

// Helper to calculate Indian Financial Year
export function calculateFinancialYear(dateStr: string): { fy: string; month: number; year: number } {
  const date = new Date(dateStr);
  const month = date.getMonth() + 1; // 1-12
  const year = date.getFullYear();

  let fyStartYear: number;
  if (month >= 4) {
    fyStartYear = year;
  } else {
    fyStartYear = year - 1;
  }
  const fyEndYearShort = String(fyStartYear + 1).slice(-2);
  const fy = `FY ${fyStartYear}-${fyEndYearShort}`;

  return { fy, month, year };
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    people: [],
    transactions: [],
    reminders: []
  };

  private sessions: Map<string, { userId: string; email: string; expiresAt: number }> = new Map();
  private isCloudSynced: boolean = false;

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(fileContent);
      } else {
        this.seedInitialData();
        this.saveToFile();
      }

      // Ensure user Financial@free.com exists with password FinancialFree@321
      this.ensureAdminCredentials();
    } catch (err) {
      console.error('Error initializing local database file, loading default seed in memory:', err);
      this.seedInitialData();
    }

    // Trigger cloud synchronization in background
    this.syncWithFirestore().catch(e => {
      console.warn('Initial Firestore cloud sync encountered an issue, running with local cache:', e.message);
    });
  }

  public async syncWithFirestore(): Promise<void> {
    try {
      console.log('🔄 Synchronizing with Firestore Cloud Database via REST...');

      // 1. Fetch Collections
      const cloudUsers = await firestoreRest.getCollection('users');
      const cloudPeople = (await firestoreRest.getCollection('people')) as Person[];
      const cloudTransactions = (await firestoreRest.getCollection('transactions')) as Transaction[];
      const cloudReminders = (await firestoreRest.getCollection('reminders')) as Reminder[];

      if (cloudUsers.length > 0 || cloudPeople.length > 0 || cloudTransactions.length > 0) {
        console.log(`✅ Loaded from Cloud: ${cloudPeople.length} people, ${cloudTransactions.length} transactions, ${cloudReminders.length} reminders`);
        if (cloudUsers.length > 0) this.data.users = cloudUsers;
        if (cloudPeople.length > 0) this.data.people = cloudPeople;
        if (cloudTransactions.length > 0) this.data.transactions = cloudTransactions;
        if (cloudReminders.length > 0) this.data.reminders = cloudReminders;
        this.saveToFile();
      } else {
        console.log('☁️ Cloud database is currently empty. Seeding initial data to Firestore...');
        await this.pushAllToFirestore();
      }

      this.isCloudSynced = true;
    } catch (error: any) {
      console.warn('Firestore sync notice:', error.message || error);
    }
  }

  private async pushAllToFirestore(): Promise<void> {
    try {
      // Push users
      for (const u of this.data.users) {
        await firestoreRest.setDoc('users', u.id, u);
      }
      // Push people
      for (const p of this.data.people) {
        await firestoreRest.setDoc('people', p.id, p);
      }
      // Push transactions
      for (const t of this.data.transactions) {
        await firestoreRest.setDoc('transactions', t.id, t);
      }
      // Push reminders
      for (const r of this.data.reminders) {
        await firestoreRest.setDoc('reminders', r.id, r);
      }
      console.log('✨ Seed records successfully persisted to Firestore!');
    } catch (err: any) {
      console.warn('Initial seed push to Firestore notice:', err.message || err);
    }
  }

  private saveToFile() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving database to file:', err);
    }
  }

  private ensureAdminCredentials() {
    const auth = hashPassword('FinancialFree@321');
    const existingUser = this.data.users.find(u => 
      u.email.toLowerCase() === 'financial@free.com' || 
      u.email.toLowerCase() === 'financialfree@com' ||
      u.id === 'usr_admin_financialfree'
    );

    if (existingUser) {
      existingUser.email = 'Financial@free.com';
      existingUser.password_hash = auth.hash;
      existingUser.salt = auth.salt;
      existingUser.updated_at = new Date().toISOString();
    } else {
      this.data.users.push({
        id: 'usr_admin_financialfree',
        email: 'Financial@free.com',
        password_hash: auth.hash,
        salt: auth.salt,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    this.saveToFile();
    firestoreRest.setDoc('users', 'usr_admin_financialfree', this.data.users[0]).catch(() => {});
  }

  private seedInitialData() {
    const defaultAuth = hashPassword('FinancialFree@321');
    const adminUser = {
      id: 'usr_admin_financialfree',
      email: 'Financial@free.com',
      password_hash: defaultAuth.hash,
      salt: defaultAuth.salt,
      created_at: new Date('2026-01-01T00:00:00Z').toISOString(),
      updated_at: new Date('2026-01-01T00:00:00Z').toISOString()
    };

    this.data = {
      users: [adminUser],
      people: [],
      transactions: [],
      reminders: []
    };
  }

  // --- Auth Methods ---
  public login(email: string, password: string): { token: string; user: User } | null {
    const user = this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return null;

    const isValid = verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) return null;

    const token = 'ff_tok_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
    this.sessions.set(token, { userId: user.id, email: user.email, expiresAt });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    };
  }

  public verifyToken(token: string): User | null {
    const session = this.sessions.get(token);
    if (!session) return null;
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      return null;
    }
    const user = this.data.users.find(u => u.id === session.userId);
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      updated_at: user.updated_at
    };
  }

  public logout(token: string) {
    this.sessions.delete(token);
  }

  public changePassword(userId: string, currentPass: string, newPass: string): { success: boolean; message: string } {
    const user = this.data.users.find(u => u.id === userId);
    if (!user) return { success: false, message: 'User not found' };

    if (!verifyPassword(currentPass, user.password_hash, user.salt)) {
      return { success: false, message: 'Current password is incorrect' };
    }

    if (newPass.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters' };
    }

    const { hash, salt } = hashPassword(newPass);
    user.password_hash = hash;
    user.salt = salt;
    user.updated_at = new Date().toISOString();
    this.saveToFile();

    // Persist to Cloud Firestore
    firestoreRest.setDoc('users', userId, user).catch(() => {});

    return { success: true, message: 'Password updated successfully' };
  }

  // --- Balance & Calculations ---
  public getPersonBalance(personId: string, excludeTxId?: string): { totalGiven: number; totalReturned: number; remaining: number } {
    const personTxs = this.data.transactions.filter(t => t.person_id === personId && t.id !== excludeTxId);
    let totalGiven = 0;
    let totalReturned = 0;

    for (const t of personTxs) {
      if (t.transaction_type === 'given') {
        totalGiven += Number(t.amount) || 0;
      } else if (t.transaction_type === 'returned') {
        totalReturned += Number(t.amount) || 0;
      }
    }

    // Floating-point precision safety
    totalGiven = Math.round(totalGiven * 100) / 100;
    totalReturned = Math.round(totalReturned * 100) / 100;
    const remaining = Math.max(0, Math.round((totalGiven - totalReturned) * 100) / 100);

    return { totalGiven, totalReturned, remaining };
  }

  public enrichPerson(person: Person): Person {
    const balance = this.getPersonBalance(person.id);
    const personTxs = this.data.transactions
      .filter(t => t.person_id === person.id)
      .sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime());

    let status: 'Pending' | 'Partially Paid' | 'Paid' | 'No Balance' = 'No Balance';
    if (balance.remaining > 0) {
      status = balance.totalReturned > 0 ? 'Partially Paid' : 'Pending';
    } else if (balance.totalGiven > 0 && balance.remaining === 0) {
      status = 'Paid';
    }

    return {
      ...person,
      total_given: balance.totalGiven,
      total_returned: balance.totalReturned,
      remaining_balance: balance.remaining,
      status,
      transaction_count: personTxs.length,
      last_transaction_date: personTxs[0]?.transaction_date || person.created_at.split('T')[0]
    };
  }

  // --- People Operations ---
  public getPeople(search?: string, category?: string, statusFilter?: string): Person[] {
    let result = this.data.people.map(p => this.enrichPerson(p));

    if (search) {
      const q = search.toLowerCase().trim();
      result = result.filter(p =>
        p.full_name.toLowerCase().includes(q) ||
        p.phone.toLowerCase().includes(q) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'All') {
      result = result.filter(p => p.category === category);
    }

    if (statusFilter && statusFilter !== 'All') {
      result = result.filter(p => p.status === statusFilter);
    }

    // Sort by remaining balance descending, then by name
    return result.sort((a, b) => (b.remaining_balance || 0) - (a.remaining_balance || 0) || a.full_name.localeCompare(b.full_name));
  }

  public getPersonById(id: string): { person: Person; transactions: Transaction[]; reminders: Reminder[] } | null {
    const raw = this.data.people.find(p => p.id === id);
    if (!raw) return null;

    const person = this.enrichPerson(raw);

    // Get transactions sorted chronologically to calculate running balance accurately
    const rawTxs = this.data.transactions
      .filter(t => t.person_id === id)
      .sort((a, b) => new Date(a.transaction_date).getTime() - new Date(b.transaction_date).getTime() || new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let running = 0;
    const enrichedTxs: Transaction[] = rawTxs.map(t => {
      if (t.transaction_type === 'given') {
        running += Number(t.amount);
      } else {
        running -= Number(t.amount);
      }
      running = Math.max(0, Math.round(running * 100) / 100);
      return {
        ...t,
        person_name: person.full_name,
        running_balance: running
      };
    });

    // Return transactions in reverse chronological order for table/timeline display
    const transactions = enrichedTxs.reverse();
    const reminders = this.data.reminders.filter(r => r.person_id === id);

    return { person, transactions, reminders };
  }

  public createPerson(data: Partial<Person>, userId: string): Person {
    if (!data.full_name || !data.full_name.trim()) {
      throw new Error('Full name is required');
    }

    const newPerson: Person = {
      id: 'per_' + crypto.randomBytes(8).toString('hex'),
      user_id: userId,
      full_name: data.full_name.trim(),
      phone: data.phone?.trim() || '',
      email: data.email?.trim() || '',
      address: data.address?.trim() || '',
      notes: data.notes?.trim() || '',
      category: data.category || 'General',
      avatar_color: data.avatar_color || '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.people.push(newPerson);
    this.saveToFile();

    // Persist to Cloud Firestore
    firestoreRest.setDoc('people', newPerson.id, newPerson).catch((err) => {
      console.warn('Firestore setDoc notice for new person:', err.message || err);
    });

    return this.enrichPerson(newPerson);
  }

  public updatePerson(id: string, data: Partial<Person>): Person {
    const index = this.data.people.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Person not found');

    const existing = this.data.people[index];
    const updated: Person = {
      ...existing,
      full_name: data.full_name?.trim() || existing.full_name,
      phone: data.phone !== undefined ? data.phone.trim() : existing.phone,
      email: data.email !== undefined ? data.email.trim() : existing.email,
      address: data.address !== undefined ? data.address.trim() : existing.address,
      notes: data.notes !== undefined ? data.notes.trim() : existing.notes,
      category: data.category || existing.category,
      avatar_color: data.avatar_color || existing.avatar_color,
      updated_at: new Date().toISOString()
    };

    this.data.people[index] = updated;
    this.saveToFile();

    // Persist to Cloud Firestore
    firestoreRest.setDoc('people', id, updated).catch((err) => {
      console.warn('Firestore setDoc notice for update person:', err.message || err);
    });

    return this.enrichPerson(this.data.people[index]);
  }

  public deletePerson(id: string): { success: boolean; deletedTransactions: number } {
    const personIndex = this.data.people.findIndex(p => p.id === id);
    if (personIndex === -1) throw new Error('Person not found');

    const txsToDelete = this.data.transactions.filter(t => t.person_id === id);
    const remindersToDelete = this.data.reminders.filter(r => r.person_id === id);

    this.data.people.splice(personIndex, 1);
    this.data.transactions = this.data.transactions.filter(t => t.person_id !== id);
    this.data.reminders = this.data.reminders.filter(r => r.person_id !== id);

    this.saveToFile();

    // Delete from Cloud Firestore
    firestoreRest.deleteDoc('people', id).catch(() => {});
    for (const t of txsToDelete) {
      firestoreRest.deleteDoc('transactions', t.id).catch(() => {});
    }
    for (const r of remindersToDelete) {
      firestoreRest.deleteDoc('reminders', r.id).catch(() => {});
    }

    return { success: true, deletedTransactions: txsToDelete.length };
  }

  public async clearAllPeople(): Promise<{ success: boolean; deletedPeople: number; deletedTransactions: number }> {
    const countPeople = this.data.people.length;
    const countTxs = this.data.transactions.length;

    const peopleIds = this.data.people.map(p => p.id);
    const txIds = this.data.transactions.map(t => t.id);
    const reminderIds = this.data.reminders.map(r => r.id);

    this.data.people = [];
    this.data.transactions = [];
    this.data.reminders = [];

    this.saveToFile();

    // Remove from Firestore Cloud Database
    for (const pId of peopleIds) {
      await firestoreRest.deleteDoc('people', pId).catch(() => {});
    }
    for (const tId of txIds) {
      await firestoreRest.deleteDoc('transactions', tId).catch(() => {});
    }
    for (const rId of reminderIds) {
      await firestoreRest.deleteDoc('reminders', rId).catch(() => {});
    }

    return {
      success: true,
      deletedPeople: countPeople,
      deletedTransactions: countTxs
    };
  }

  // --- Transactions Operations ---
  public getTransactions(filters: {
    person_id?: string;
    type?: string;
    month?: number;
    year?: number;
    financial_year?: string;
    payment_method?: string;
    search?: string;
  }): Transaction[] {
    const peopleMap = new Map<string, string>(this.data.people.map(p => [p.id, p.full_name]));

    let list = this.data.transactions.map(t => ({
      ...t,
      person_name: peopleMap.get(t.person_id) || 'Unknown Person'
    }));

    if (filters.person_id) {
      list = list.filter(t => t.person_id === filters.person_id);
    }
    if (filters.type && filters.type !== 'all') {
      list = list.filter(t => t.transaction_type === filters.type);
    }
    if (filters.month) {
      list = list.filter(t => t.month === Number(filters.month));
    }
    if (filters.year) {
      list = list.filter(t => t.year === Number(filters.year));
    }
    if (filters.financial_year) {
      list = list.filter(t => t.financial_year === filters.financial_year);
    }
    if (filters.payment_method && filters.payment_method !== 'all') {
      list = list.filter(t => t.payment_method === filters.payment_method);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(t =>
        t.person_name?.toLowerCase().includes(q) ||
        (t.purpose && t.purpose.toLowerCase().includes(q)) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        t.amount.toString().includes(q) ||
        t.payment_method.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime() || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createTransaction(data: {
    person_id: string;
    transaction_type: 'given' | 'returned';
    amount: number;
    transaction_date: string;
    payment_method: any;
    purpose?: string;
    notes?: string;
  }, userId: string): Transaction {
    if (!data.person_id) throw new Error('Please select a person.');
    const person = this.data.people.find(p => p.id === data.person_id);
    if (!person) throw new Error('Selected person does not exist.');

    const amount = Number(data.amount);
    if (isNaN(amount) || amount <= 0) {
      throw new Error('Please enter a valid amount greater than 0.');
    }

    if (!data.transaction_date) {
      throw new Error('Please select a transaction date.');
    }

    // Validation: Return amount cannot exceed current outstanding balance
    if (data.transaction_type === 'returned') {
      const balance = this.getPersonBalance(data.person_id);
      if (amount > balance.remaining) {
        throw new Error(
          `This return amount (₹${amount.toLocaleString('en-IN')}) is greater than the outstanding balance of ₹${balance.remaining.toLocaleString('en-IN')}.`
        );
      }
    }

    const { fy, month, year } = calculateFinancialYear(data.transaction_date);

    const newTx: Transaction = {
      id: 'tx_' + crypto.randomBytes(8).toString('hex'),
      user_id: userId,
      person_id: data.person_id,
      person_name: person.full_name,
      transaction_type: data.transaction_type,
      amount: Math.round(amount * 100) / 100,
      transaction_date: data.transaction_date,
      month,
      year,
      financial_year: fy,
      payment_method: data.payment_method || 'UPI',
      purpose: data.purpose?.trim() || '',
      notes: data.notes?.trim() || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.transactions.push(newTx);
    this.saveToFile();

    // Persist to Cloud Firestore
    firestoreRest.setDoc('transactions', newTx.id, newTx).catch(() => {});

    return newTx;
  }

  public updateTransaction(id: string, data: Partial<Transaction>): Transaction {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found.');

    const existing = this.data.transactions[index];
    const personId = data.person_id || existing.person_id;
    const type = data.transaction_type || existing.transaction_type;
    const amount = data.amount !== undefined ? Number(data.amount) : existing.amount;
    const dateStr = data.transaction_date || existing.transaction_date;

    if (isNaN(amount) || amount <= 0) {
      throw new Error('Please enter a valid amount greater than 0.');
    }

    if (type === 'returned') {
      const balance = this.getPersonBalance(personId, id); // exclude this transaction
      if (amount > balance.remaining) {
        throw new Error(
          `This updated return amount (₹${amount.toLocaleString('en-IN')}) exceeds the outstanding balance of ₹${balance.remaining.toLocaleString('en-IN')}.`
        );
      }
    }

    const { fy, month, year } = calculateFinancialYear(dateStr);
    const person = this.data.people.find(p => p.id === personId);

    const updated: Transaction = {
      ...existing,
      person_id: personId,
      person_name: person?.full_name || existing.person_name,
      transaction_type: type,
      amount: Math.round(amount * 100) / 100,
      transaction_date: dateStr,
      month,
      year,
      financial_year: fy,
      payment_method: data.payment_method || existing.payment_method,
      purpose: data.purpose !== undefined ? data.purpose.trim() : existing.purpose,
      notes: data.notes !== undefined ? data.notes.trim() : existing.notes,
      updated_at: new Date().toISOString()
    };

    this.data.transactions[index] = updated;
    this.saveToFile();

    // Persist to Cloud Firestore
    firestoreRest.setDoc('transactions', id, updated).catch(() => {});

    return this.data.transactions[index];
  }

  public deleteTransaction(id: string): { success: boolean; message: string } {
    const index = this.data.transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error('Transaction not found.');

    this.data.transactions.splice(index, 1);
    this.saveToFile();

    // Delete from Cloud Firestore
    firestoreRest.deleteDoc('transactions', id).catch(() => {});

    return { success: true, message: 'Transaction deleted successfully.' };
  }

  // --- Reminders Operations ---
  public getReminders(): Reminder[] {
    const peopleMap = new Map<string, string>(this.data.people.map(p => [p.id, p.full_name]));
    return this.data.reminders.map(r => ({
      ...r,
      person_name: peopleMap.get(r.person_id) || 'Unknown Person'
    })).sort((a, b) => new Date(a.reminder_date).getTime() - new Date(b.reminder_date).getTime());
  }

  public createReminder(data: { person_id: string; reminder_date: string; note?: string }, userId: string): Reminder {
    const person = this.data.people.find(p => p.id === data.person_id);
    if (!person) throw new Error('Person not found.');

    const balance = this.getPersonBalance(data.person_id);
    if (balance.remaining <= 0) {
      throw new Error('This person has no pending balance.');
    }

    const newReminder: Reminder = {
      id: 'rem_' + crypto.randomBytes(8).toString('hex'),
      user_id: userId,
      person_id: data.person_id,
      person_name: person.full_name,
      pending_amount: balance.remaining,
      reminder_date: data.reminder_date,
      note: data.note?.trim() || '',
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.data.reminders.push(newReminder);
    this.saveToFile();

    // Persist to Cloud Firestore
    firestoreRest.setDoc('reminders', newReminder.id, newReminder).catch(() => {});

    return newReminder;
  }

  public updateReminderStatus(id: string, status: 'pending' | 'completed' | 'dismissed'): Reminder {
    const rem = this.data.reminders.find(r => r.id === id);
    if (!rem) throw new Error('Reminder not found.');
    rem.status = status;
    rem.updated_at = new Date().toISOString();
    this.saveToFile();

    // Persist to Cloud Firestore
    firestoreRest.setDoc('reminders', id, rem).catch(() => {});

    return rem;
  }

  public deleteReminder(id: string): boolean {
    const index = this.data.reminders.findIndex(r => r.id === id);
    if (index === -1) return false;
    this.data.reminders.splice(index, 1);
    this.saveToFile();

    // Delete from Cloud Firestore
    firestoreRest.deleteDoc('reminders', id).catch(() => {});

    return true;
  }

  // --- Analytics & Summaries ---
  public getDashboardSummary(): DashboardSummary {
    let totalGiven = 0;
    let totalReturned = 0;

    for (const t of this.data.transactions) {
      if (t.transaction_type === 'given') totalGiven += Number(t.amount);
      else if (t.transaction_type === 'returned') totalReturned += Number(t.amount);
    }

    const totalPending = Math.max(0, Math.round((totalGiven - totalReturned) * 100) / 100);
    const enrichedPeople = this.data.people.map(p => this.enrichPerson(p));
    const activeBorrowers = enrichedPeople.filter(p => (p.remaining_balance || 0) > 0);

    // Current Date reference
    const now = new Date();
    const curMonth = now.getMonth() + 1;
    const curYear = now.getFullYear();
    const { fy: currentFy } = calculateFinancialYear(now.toISOString().split('T')[0]);

    // This month metrics
    const thisMonthTxs = this.data.transactions.filter(t => t.month === curMonth && t.year === curYear);
    let thisMonthGiven = 0;
    let thisMonthReturned = 0;
    for (const t of thisMonthTxs) {
      if (t.transaction_type === 'given') thisMonthGiven += Number(t.amount);
      else if (t.transaction_type === 'returned') thisMonthReturned += Number(t.amount);
    }

    // This year metrics
    const thisYearTxs = this.data.transactions.filter(t => t.year === curYear);
    let thisYearGiven = 0;
    let thisYearReturned = 0;
    for (const t of thisYearTxs) {
      if (t.transaction_type === 'given') thisYearGiven += Number(t.amount);
      else if (t.transaction_type === 'returned') thisYearReturned += Number(t.amount);
    }

    // Current FY metrics
    const currentFyTxs = this.data.transactions.filter(t => t.financial_year === currentFy);
    let fyGiven = 0;
    let fyReturned = 0;
    for (const t of currentFyTxs) {
      if (t.transaction_type === 'given') fyGiven += Number(t.amount);
      else if (t.transaction_type === 'returned') fyReturned += Number(t.amount);
    }

    // Monthly Trend for last 6 months
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(curYear, curMonth - 1 - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const txs = this.data.transactions.filter(t => t.month === m && t.year === y);
      let g = 0;
      let r = 0;
      for (const t of txs) {
        if (t.transaction_type === 'given') g += Number(t.amount);
        else if (t.transaction_type === 'returned') r += Number(t.amount);
      }
      monthlyTrend.push({
        month: m,
        month_name: MONTH_NAMES[m - 1],
        year: y,
        given: g,
        returned: r,
        net: g - r
      });
    }

    const recentTransactions = this.getTransactions({}).slice(0, 7);
    const topDebtors = activeBorrowers.sort((a, b) => (b.remaining_balance || 0) - (a.remaining_balance || 0)).slice(0, 5);

    return {
      total_given: totalGiven,
      total_returned: totalReturned,
      total_pending: totalPending,
      people_count: this.data.people.length,
      active_borrowers_count: activeBorrowers.length,
      this_month: {
        month: curMonth,
        year: curYear,
        given: thisMonthGiven,
        returned: thisMonthReturned,
        pending: Math.max(0, thisMonthGiven - thisMonthReturned),
        transaction_count: thisMonthTxs.length
      },
      this_year: {
        year: curYear,
        given: thisYearGiven,
        returned: thisYearReturned,
        pending: Math.max(0, thisYearGiven - thisYearReturned),
        transaction_count: thisYearTxs.length
      },
      current_financial_year: {
        label: currentFy,
        given: fyGiven,
        returned: fyReturned,
        pending: Math.max(0, fyGiven - fyReturned)
      },
      recent_transactions: recentTransactions,
      top_debtors: topDebtors,
      monthly_trend: monthlyTrend
    };
  }

  public getMonthlyAnalytics(year: number, month: number): MonthlyAnalytics {
    const txs = this.getTransactions({ year, month });
    let totalGiven = 0;
    let totalReturned = 0;

    const peopleInvolvedMap = new Map<string, { id: string; name: string; given: number; returned: number }>();
    const byMethod: Record<string, { given: number; returned: number }> = {
      'Cash': { given: 0, returned: 0 },
      'Bank Transfer': { given: 0, returned: 0 },
      'UPI': { given: 0, returned: 0 },
      'Other': { given: 0, returned: 0 }
    };

    for (const t of txs) {
      const amt = Number(t.amount);
      if (t.transaction_type === 'given') {
        totalGiven += amt;
        if (byMethod[t.payment_method]) byMethod[t.payment_method].given += amt;
      } else {
        totalReturned += amt;
        if (byMethod[t.payment_method]) byMethod[t.payment_method].returned += amt;
      }

      if (!peopleInvolvedMap.has(t.person_id)) {
        peopleInvolvedMap.set(t.person_id, {
          id: t.person_id,
          name: t.person_name || 'Person',
          given: 0,
          returned: 0
        });
      }
      const pEntry = peopleInvolvedMap.get(t.person_id)!;
      if (t.transaction_type === 'given') pEntry.given += amt;
      else pEntry.returned += amt;
    }

    const peopleInvolved = Array.from(peopleInvolvedMap.values()).map(p => {
      const bal = this.getPersonBalance(p.id);
      return {
        ...p,
        current_pending: bal.remaining
      };
    });

    return {
      month,
      month_name: MONTH_NAMES[month - 1],
      year,
      total_given: totalGiven,
      total_returned: totalReturned,
      net_balance: totalGiven - totalReturned,
      transaction_count: txs.length,
      people_count: peopleInvolved.length,
      people_involved: peopleInvolved,
      transactions: txs,
      by_payment_method: byMethod as any
    };
  }

  public getYearlyAnalytics(year: number): YearlyAnalytics {
    const yearTxs = this.getTransactions({ year });
    let totalGiven = 0;
    let totalReturned = 0;

    const peopleMap = new Map<string, { id: string; name: string; given: number; returned: number }>();

    const monthlyBreakdown = Array.from({ length: 12 }, (_, idx) => {
      const m = idx + 1;
      const mTxs = yearTxs.filter(t => t.month === m);
      let g = 0;
      let r = 0;
      for (const t of mTxs) {
        if (t.transaction_type === 'given') g += Number(t.amount);
        else r += Number(t.amount);
      }
      return {
        month: m,
        month_name: MONTH_NAMES[idx],
        given: g,
        returned: r,
        net: g - r,
        transaction_count: mTxs.length
      };
    });

    for (const t of yearTxs) {
      const amt = Number(t.amount);
      if (t.transaction_type === 'given') totalGiven += amt;
      else totalReturned += amt;

      if (!peopleMap.has(t.person_id)) {
        peopleMap.set(t.person_id, {
          id: t.person_id,
          name: t.person_name || 'Person',
          given: 0,
          returned: 0
        });
      }
      const entry = peopleMap.get(t.person_id)!;
      if (t.transaction_type === 'given') entry.given += amt;
      else entry.returned += amt;
    }

    return {
      year,
      total_given: totalGiven,
      total_returned: totalReturned,
      total_pending: Math.max(0, totalGiven - totalReturned),
      transaction_count: yearTxs.length,
      people_count: peopleMap.size,
      monthly_breakdown: monthlyBreakdown,
      top_people: Array.from(peopleMap.values()).sort((a, b) => b.given - a.given).slice(0, 6)
    };
  }

  public getFinancialYearAnalytics(financialYear: string): FinancialYearAnalytics {
    const parts = financialYear.replace('FY ', '').split('-');
    const startYear = parseInt(parts[0], 10);
    const endYear = startYear + 1;

    const fyTxs = this.getTransactions({ financial_year: financialYear });
    let totalGiven = 0;
    let totalReturned = 0;

    const peopleSet = new Set<string>();

    const fyMonths = [
      { month: 4, year: startYear },
      { month: 5, year: startYear },
      { month: 6, year: startYear },
      { month: 7, year: startYear },
      { month: 8, year: startYear },
      { month: 9, year: startYear },
      { month: 10, year: startYear },
      { month: 11, year: startYear },
      { month: 12, year: startYear },
      { month: 1, year: endYear },
      { month: 2, year: endYear },
      { month: 3, year: endYear }
    ];

    const monthlyBreakdown = fyMonths.map(({ month, year }) => {
      const mTxs = fyTxs.filter(t => t.month === month && t.year === year);
      let g = 0;
      let r = 0;
      for (const t of mTxs) {
        if (t.transaction_type === 'given') g += Number(t.amount);
        else r += Number(t.amount);
        peopleSet.add(t.person_id);
      }
      totalGiven += g;
      totalReturned += r;
      return {
        month,
        month_name: MONTH_NAMES[month - 1],
        year,
        given: g,
        returned: r,
        net: g - r,
        transaction_count: mTxs.length
      };
    });

    return {
      financial_year: financialYear,
      start_year: startYear,
      end_year: endYear,
      total_given: totalGiven,
      total_returned: totalReturned,
      total_pending: Math.max(0, totalGiven - totalReturned),
      transaction_count: fyTxs.length,
      people_count: peopleSet.size,
      monthly_breakdown: monthlyBreakdown
    };
  }

  public getAvailableYearsAndFys(): { years: number[]; financial_years: string[] } {
    const yearsSet = new Set<number>();
    const fySet = new Set<string>();

    yearsSet.add(new Date().getFullYear());
    yearsSet.add(2026);
    yearsSet.add(2025);

    for (const t of this.data.transactions) {
      if (t.year) yearsSet.add(t.year);
      if (t.financial_year) fySet.add(t.financial_year);
    }

    const { fy: curFy } = calculateFinancialYear(new Date().toISOString().split('T')[0]);
    fySet.add(curFy);
    fySet.add('FY 2026-27');
    fySet.add('FY 2025-26');

    return {
      years: Array.from(yearsSet).sort((a, b) => b - a),
      financial_years: Array.from(fySet).sort().reverse()
    };
  }

  // --- Export & Backup ---
  public exportBackup(): BackupData {
    return {
      version: '1.0.0',
      export_date: new Date().toISOString(),
      user: { email: this.data.users[0]?.email || 'financialfree@com' },
      people: this.data.people,
      transactions: this.data.transactions,
      reminders: this.data.reminders
    };
  }

  public async importBackup(payload: BackupData): Promise<{ success: boolean; peopleCount: number; txCount: number }> {
    if (!payload.people || !Array.isArray(payload.people) || !payload.transactions || !Array.isArray(payload.transactions)) {
      throw new Error('Invalid backup file structure: missing people or transactions arrays.');
    }

    this.data.people = payload.people;
    this.data.transactions = payload.transactions;
    this.data.reminders = payload.reminders || [];
    this.saveToFile();

    // Push all imported items to Firestore
    await this.pushAllToFirestore();

    return {
      success: true,
      peopleCount: payload.people.length,
      txCount: payload.transactions.length
    };
  }

  public getRawDataForAI(): { people: Person[]; transactions: Transaction[]; summary: DashboardSummary } {
    return {
      people: this.getPeople(),
      transactions: this.getTransactions({}),
      summary: this.getDashboardSummary()
    };
  }

  public getStatus(): { isCloudSynced: boolean; peopleCount: number; txCount: number } {
    return {
      isCloudSynced: this.isCloudSynced,
      peopleCount: this.data.people.length,
      txCount: this.data.transactions.length
    };
  }
}

export const db = new DatabaseService();
