export type TransactionType = 'given' | 'returned';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Other';

export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'No Balance';

export interface User {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role?: 'admin' | 'user';
  email_verified?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected';
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'admin' | 'user';
  approval_status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface Person {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  email?: string;
  address?: string;
  notes?: string;
  category?: string;
  avatar_color?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  total_given?: number;
  total_returned?: number;
  remaining_balance?: number;
  net_balance?: number;
  status?: PaymentStatus;
  transaction_count?: number;
  last_transaction_date?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  person_id: string;
  person_name?: string;
  transaction_type: TransactionType;
  amount: number;
  transaction_date: string; // YYYY-MM-DD
  month: number; // 1-12
  year: number; // e.g. 2026
  financial_year?: string; // e.g. "FY 2026-27"
  payment_method: PaymentMethod;
  category?: string;
  purpose?: string;
  notes?: string;
  receipt_image?: string;
  created_at: string;
  updated_at: string;
  // Computed running balance in person's history
  running_balance?: number;
}

export interface AiTransactionSuggestion {
  category: string;
  purpose: string;
  suggestedTags: string[];
  categories: string[];
  purposes: string[];
  confidenceSummary?: string;
}

export interface ScannedFinancialData {
  amount?: number;
  transaction_type?: TransactionType;
  person_name?: string;
  transaction_date?: string;
  payment_method?: PaymentMethod;
  purpose?: string;
  notes?: string;
  confidence_summary?: string;
}

export interface Reminder {
  id: string;
  user_id: string;
  person_id: string;
  person_name?: string;
  pending_amount: number;
  reminder_date: string; // YYYY-MM-DD
  note?: string;
  status: 'pending' | 'completed' | 'dismissed';
  created_at: string;
  updated_at: string;
}

export interface DashboardSummary {
  total_given: number;
  total_returned: number;
  total_pending: number;
  people_count: number;
  active_borrowers_count: number;
  this_month: {
    month: number;
    year: number;
    given: number;
    returned: number;
    pending: number;
    transaction_count: number;
  };
  this_year: {
    year: number;
    given: number;
    returned: number;
    pending: number;
    transaction_count: number;
  };
  current_financial_year: {
    label: string;
    given: number;
    returned: number;
    pending: number;
  };
  recent_transactions: Transaction[];
  top_debtors: Person[];
  monthly_trend: {
    month: number;
    month_name: string;
    year: number;
    given: number;
    returned: number;
    net: number;
  }[];
}

export interface MonthlyAnalytics {
  month: number;
  month_name: string;
  year: number;
  total_given: number;
  total_returned: number;
  net_balance: number;
  transaction_count: number;
  people_count: number;
  people_involved: {
    id: string;
    name: string;
    given: number;
    returned: number;
    current_pending: number;
  }[];
  transactions: Transaction[];
  by_payment_method: Record<PaymentMethod, { given: number; returned: number }>;
}

export interface YearlyAnalytics {
  year: number;
  total_given: number;
  total_returned: number;
  total_pending: number;
  transaction_count: number;
  people_count: number;
  monthly_breakdown: {
    month: number;
    month_name: string;
    given: number;
    returned: number;
    net: number;
    transaction_count: number;
  }[];
  top_people: {
    id: string;
    name: string;
    given: number;
    returned: number;
  }[];
}

export interface FinancialYearAnalytics {
  financial_year: string; // e.g. "FY 2026-27"
  start_year: number;
  end_year: number;
  total_given: number;
  total_returned: number;
  total_pending: number;
  transaction_count: number;
  people_count: number;
  monthly_breakdown: {
    month: number;
    month_name: string;
    year: number;
    given: number;
    returned: number;
    net: number;
    transaction_count: number;
  }[];
}

export interface WeeklySummary {
  startDate: string;
  endDate: string;
  weekNumber: number;
  year: number;
  totalGiven: number;
  totalReturned: number;
  totalShopping: number;
  totalSpending: number; // totalGiven + totalShopping
  totalIncome: number;   // totalReturned
  netBalance: number;    // totalIncome - totalSpending
  transactionCount: number;
  shoppingCount: number;
  topPeople: {
    id: string;
    name: string;
    given: number;
    returned: number;
    pending: number;
  }[];
  categoryBreakdown: {
    category: string;
    amount: number;
  }[];
  headline: string;
  generatedAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
}

export interface BackupData {
  version: string;
  export_date: string;
  user: { email: string };
  people: Person[];
  transactions: Transaction[];
  reminders: Reminder[];
  shopping_spends?: ShoppingSpend[];
}

export type SyncStatus = 'idle' | 'syncing' | 'saved' | 'discrepancy' | 'offline' | 'error';

export interface IntegrityServerReport {
  serverPeopleCount: number;
  serverTxCount: number;
  serverReminderCount: number;
  serverPeople: Array<{ id: string; full_name: string; phone?: string; updated_at: string; remaining_balance: number }>;
  serverTransactions: Array<{ id: string; person_id: string; amount: number; transaction_type: string; transaction_date: string; updated_at: string }>;
  isCloudSynced: boolean;
  timestamp: string;
}

export interface DiscrepancyDetails {
  hasDiscrepancy: boolean;
  localPeopleCount: number;
  serverPeopleCount: number;
  localTxCount: number;
  serverTxCount: number;
  missingOnServerPeople: Person[];
  missingOnLocalPeople: Array<{ id: string; full_name: string }>;
  missingOnServerTxs: Transaction[];
  missingOnLocalTxs: Array<{ id: string; amount: number; type: string }>;
  summaryMessage: string;
}

export interface AppUpdateFile {
  name: string;
  path: string;
  category: 'core' | 'vendor' | 'styles' | 'pwa' | 'assets';
  sizeBytes: number;
  sizeFormatted: string;
  sha256?: string;
  description: string;
  status: 'pending' | 'analyzed' | 'downloading' | 'verified';
}

export interface FeatureAdvantage {
  title: string;
  desc: string;
}

export interface AppUpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseDate: string;
  releaseTitle: string;
  isAvailable: boolean;
  totalBytes: number;
  totalSizeMB: number;
  totalSizeFormatted: string;
  fileCount: number;
  files: AppUpdateFile[];
  releaseNotes: string[];
  advantages?: FeatureAdvantage[];
}

export type ShoppingCategory =
  | 'groceries'
  | 'supermarket'
  | 'shopping'
  | 'home_service'
  | 'maid_cook'
  | 'maintenance'
  | 'utilities'
  | 'food_delivery'
  | 'pharmacy'
  | 'other';

export interface ShoppingSpend {
  id: string;
  user_id?: string;
  title: string; // e.g., "Tata Salt 1kg", "Fortune Sunlite Oil", "Weekly Vegetables & Dairy"
  amount: number; // Final purchase amount paid (in ₹)
  category: ShoppingCategory;
  merchant?: string; // Store or seller name (e.g. "DMart", "Kirana Store", "Blinkit")
  brand?: string; // Brand / Manufacturer (e.g. "Tata", "Amul", "Nestle", "Fortune", "Dettol")
  mrp?: number; // Maximum Retail Price printed on package/tag (in ₹)
  selling_price?: number; // Discounted or retail purchase price
  discount_amount?: number; // Discount/savings (mrp - amount)
  net_quantity?: string; // Net weight or volume (e.g. "1 kg", "500 ml", "Pack of 2")
  mfg_date?: string; // Manufacturing date (e.g. "2026-08" or "08/2026")
  expiry_date?: string; // Expiry or Best Before date (e.g. "2027-02" or "02/2027")
  batch_number?: string; // Batch or Barcode number
  fssai_lic_no?: string; // FSSAI License number if scanned
  date: string; // YYYY-MM-DD
  payment_method: PaymentMethod;
  notes?: string;
  receipt_image?: string; // Photo of product packaging, back MRP tag, or bill
  is_home_service: boolean; // Flag to filter Home Services separately
  is_settled?: boolean; // Completed / Settled checkmark status
  is_product_scan?: boolean; // True if scanned from product pack/MRP
  firestore_synced_at?: string; // Timestamp when synced to Cloud Firestore
  created_at: string;
  updated_at: string;
}

export interface VerifiedShoppingBillItem {
  name: string;
  quantity?: string;
  price: number;
}

export interface VerifiedShoppingBill {
  title: string;
  total_amount: number;
  mrp?: number;
  brand?: string;
  net_quantity?: string;
  expiry_date?: string;
  mfg_date?: string;
  batch_number?: string;
  category: ShoppingCategory;
  merchant: string;
  date: string;
  payment_method: PaymentMethod;
  notes: string;
  items: VerifiedShoppingBillItem[];
  is_verified_bill: boolean;
  is_product_scan?: boolean; // True if photo was a product back/front pack or MRP label
  confidence_score: number;
  summary: string;
  raw_text?: string;
}

export interface GitRepoStatus {
  isGitRepo: boolean;
  branch: string;
  latestCommit: string;
  commitMessage: string;
  commitDate: string;
  clean: boolean;
  remotes: string[];
  hasRemote: boolean;
  remoteOrigin?: string;
  pendingChangesCount: number;
  totalCommits: number;
  lastPushedAt?: string | null;
  lastPushStatus?: 'idle' | 'success' | 'failed';
  lastPushMessage?: string;
}

export interface GitPushResult {
  success: boolean;
  message: string;
  commitHash?: string;
  branch?: string;
  pushedFilesCount?: number;
  timestamp?: string;
  needRemoteConfig?: boolean;
  error?: string;
}

export interface PublicShareTransaction {
  id?: string;
  date: string;
  type: 'given' | 'returned';
  amount: number;
  category?: string;
  notes?: string;
}

export interface PublicShareData {
  shareId: string;
  userId?: string;
  personId?: string;
  personName: string;
  totalGiven: number;
  totalReturned: number;
  netBalance: number;
  currency: string;
  status: 'receivable' | 'payable' | 'settled';
  note?: string;
  transactions: PublicShareTransaction[];
  createdAt: string;
}


