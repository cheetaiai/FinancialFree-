import React, { createContext, useContext, useState, useEffect } from 'react';

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED' | 'CAD' | 'AUD' | 'SGD' | 'JPY';

export interface CurrencyConfig {
  code: CurrencyCode;
  name: string;
  symbol: string;
  locale: string;
  flag: string;
  decimals: number;
}

export const SUPPORTED_CURRENCIES: CurrencyConfig[] = [
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', locale: 'en-IN', flag: '🇮🇳', decimals: 0 },
  { code: 'USD', name: 'US Dollar', symbol: '$', locale: 'en-US', flag: '🇺🇸', decimals: 2 },
  { code: 'EUR', name: 'Euro', symbol: '€', locale: 'de-DE', flag: '🇪🇺', decimals: 2 },
  { code: 'GBP', name: 'British Pound', symbol: '£', locale: 'en-GB', flag: '🇬🇧', decimals: 2 },
  { code: 'AED', name: 'UAE Dirham', symbol: 'AED', locale: 'en-AE', flag: '🇦🇪', decimals: 2 },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', locale: 'en-CA', flag: '🇨🇦', decimals: 2 },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'AU$', locale: 'en-AU', flag: '🇦🇺', decimals: 2 },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'SG$', locale: 'en-SG', flag: '🇸🇬', decimals: 2 },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', locale: 'ja-JP', flag: '🇯🇵', decimals: 0 }
];

const CURRENCY_STORAGE_KEY = 'financialfree_currency';

interface CurrencyContextType {
  currency: CurrencyCode;
  currencyConfig: CurrencyConfig;
  setCurrency: (code: CurrencyCode) => void;
  formatAmount: (amount: number | string | undefined | null, showSymbol?: boolean) => string;
  currencySymbol: string;
  currencies: CurrencyConfig[];
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    const stored = localStorage.getItem(CURRENCY_STORAGE_KEY) as CurrencyCode;
    if (stored && SUPPORTED_CURRENCIES.some(c => c.code === stored)) {
      return stored;
    }
    return 'INR';
  });

  const currencyConfig = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

  const setCurrency = (code: CurrencyCode) => {
    if (SUPPORTED_CURRENCIES.some(c => c.code === code)) {
      setCurrencyState(code);
      localStorage.setItem(CURRENCY_STORAGE_KEY, code);
      // Dispatch storage event for other components if needed
      window.dispatchEvent(new CustomEvent('currency-changed', { detail: code }));
    }
  };

  const formatAmount = (amount: number | string | undefined | null, showSymbol = true): string => {
    const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
    if (isNaN(num)) return showSymbol ? `${currencyConfig.symbol}0` : '0';

    const isNegative = num < 0;
    const absNum = Math.abs(num);

    let formatted: string;
    try {
      formatted = absNum.toLocaleString(currencyConfig.locale, {
        maximumFractionDigits: currencyConfig.decimals,
        minimumFractionDigits: currencyConfig.decimals > 0 && absNum % 1 !== 0 ? 2 : 0
      });
    } catch {
      formatted = absNum.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      });
    }

    const symbolPrefix = showSymbol ? (currencyConfig.code === 'AED' ? 'AED ' : currencyConfig.symbol) : '';
    return `${isNegative ? '-' : ''}${symbolPrefix}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        currencyConfig,
        setCurrency,
        formatAmount,
        currencySymbol: currencyConfig.symbol,
        currencies: SUPPORTED_CURRENCIES
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    // Fallback if rendered outside provider
    const defaultConfig = SUPPORTED_CURRENCIES[0];
    return {
      currency: 'INR',
      currencyConfig: defaultConfig,
      setCurrency: () => {},
      formatAmount: (amount, showSymbol = true) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : (amount || 0);
        if (isNaN(num)) return showSymbol ? '₹0' : '0';
        return `${num < 0 ? '-' : ''}${showSymbol ? '₹' : ''}${Math.abs(num).toLocaleString('en-IN')}`;
      },
      currencySymbol: '₹',
      currencies: SUPPORTED_CURRENCIES
    };
  }
  return context;
};
