export type TransactionType = 'given' | 'returned';

export type PaymentMethod = 'Cash' | 'Bank Transfer' | 'UPI' | 'Other';

export type PaymentStatus = 'Pending' | 'Partially Paid' | 'Paid' | 'No Balance';

export interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
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
  purpose?: string;
  notes?: string;
  receipt_image?: string;
  created_at: string;
  updated_at: string;
  // Computed running balance in person's history
  running_balance?: number;
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
}
