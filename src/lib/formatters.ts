import { SUPPORTED_CURRENCIES, CurrencyCode } from '../context/CurrencyContext';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Get active currency from local storage if available
 */
export function getActiveCurrencyCode(): CurrencyCode {
  if (typeof window !== 'undefined' && window.localStorage) {
    const stored = window.localStorage.getItem('financialfree_currency') as CurrencyCode;
    if (stored && SUPPORTED_CURRENCIES.some(c => c.code === stored)) {
      return stored;
    }
  }
  return 'INR';
}

/**
 * Format numbers with selected currency or active user currency
 */
export function formatCurrency(
  amount: number | string | undefined | null,
  currencyCode?: CurrencyCode,
  showSymbol = true
): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
  const code = currencyCode || getActiveCurrencyCode();
  const config = SUPPORTED_CURRENCIES.find(c => c.code === code) || SUPPORTED_CURRENCIES[0];

  if (isNaN(num)) return showSymbol ? `${config.symbol}0` : '0';

  const isNegative = num < 0;
  const absNum = Math.abs(num);

  let formatted: string;
  try {
    formatted = absNum.toLocaleString(config.locale, {
      maximumFractionDigits: config.decimals,
      minimumFractionDigits: config.decimals > 0 && absNum % 1 !== 0 ? 2 : 0
    });
  } catch {
    formatted = absNum.toLocaleString('en-US', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0
    });
  }

  const symbolPrefix = showSymbol ? (config.code === 'AED' ? 'AED ' : config.symbol) : '';
  return `${isNegative ? '-' : ''}${symbolPrefix}${formatted}`;
}

/**
 * Legacy alias formatINR now dynamically honors user's chosen currency
 */
export function formatINR(amount: number | string | undefined | null, showSymbol = true): string {
  return formatCurrency(amount, undefined, showSymbol);
}

/**
 * Format ISO date or YYYY-MM-DD to Indian date format (e.g. "26 Aug 2026")
 */
export function formatIndianDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const day = d.getDate();
    const month = MONTH_SHORT_NAMES[d.getMonth()];
    const year = d.getFullYear();
    return `${day < 10 ? '0' + day : day} ${month} ${year}`;
  } catch {
    return dateStr;
  }
}

/**
 * Returns Indian Financial Year string from a given date (e.g. "FY 2026-27")
 */
export function getFinancialYearFromDate(dateStr: string): string {
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const y = d.getFullYear();
  const start = m >= 4 ? y : y - 1;
  const endShort = String(start + 1).slice(-2);
  return `FY ${start}-${endShort}`;
}

/**
 * Get greeting based on current local hour
 */
export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Payment status color mapping for liquid badges
 */
export function getStatusBadgeConfig(status?: string): { bg: string; text: string; border: string; label: string } {
  switch (status) {
    case 'Paid':
      return {
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-600 dark:text-emerald-400',
        border: 'border-emerald-500/30',
        label: 'Paid (Zero Balance)'
      };
    case 'Partially Paid':
      return {
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
        label: 'Partially Paid'
      };
    case 'Pending':
      return {
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-600 dark:text-rose-400',
        border: 'border-rose-500/30',
        label: 'Pending Balance'
      };
    default:
      return {
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-600 dark:text-slate-400',
        border: 'border-slate-500/30',
        label: 'No Balance'
      };
  }
}
