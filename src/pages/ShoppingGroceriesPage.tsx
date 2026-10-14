import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ShoppingBag,
  ShoppingCart,
  Home,
  Plus,
  Search,
  Filter,
  CreditCard,
  Trash2,
  Edit2,
  FileText,
  Download,
  Receipt,
  Sparkles,
  X,
  Camera,
  CheckCircle2,
  Eye,
  Layers,
  ArrowRight,
  TrendingDown,
  Wrench,
  Zap,
  Coffee,
  RefreshCw,
  Check,
  Calendar
} from 'lucide-react';
import { ShoppingSpend, ShoppingCategory, PaymentMethod } from '../types';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { RocketLaunchAnimation } from '../components/ui/RocketLaunchAnimation';
import { useToast } from '../context/ToastContext';
import { CameraCaptureModal } from '../components/camera/CameraCaptureModal';
import { api } from '../lib/api';
import { exportShoppingSpendsPdf } from '../lib/pdfExport';

const STORAGE_KEY = 'financialfree_shopping_spends';

const CATEGORY_CONFIG: Record<
  ShoppingCategory,
  { label: string; icon: string; color: string; isHomeService: boolean }
> = {
  groceries: { label: 'Groceries & Staples', icon: '🛒', color: 'emerald', isHomeService: false },
  supermarket: { label: 'Supermarket & Mart', icon: '🏪', color: 'teal', isHomeService: false },
  shopping: { label: 'Personal & Household Shopping', icon: '🛍️', color: 'amber', isHomeService: false },
  home_service: { label: 'Home Services & Repairs', icon: '🔧', color: 'blue', isHomeService: true },
  maid_cook: { label: 'Domestic Help & Cook', icon: '🧹', color: 'indigo', isHomeService: true },
  maintenance: { label: 'Society & Maintenance', icon: '🏠', color: 'cyan', isHomeService: true },
  utilities: { label: 'Power, Gas & Water', icon: '⚡', color: 'orange', isHomeService: true },
  food_delivery: { label: 'Food Delivery & Dining', icon: '🛵', color: 'rose', isHomeService: false },
  pharmacy: { label: 'Pharmacy & Health', icon: '💊', color: 'red', isHomeService: false },
  other: { label: 'Other Home Spend', icon: '📦', color: 'purple', isHomeService: true }
};

// Clean slate: no pre-loaded sample mock items as requested by user
const INITIAL_SAMPLE_SPENDS: ShoppingSpend[] = [];

type MainCategoryFilter = 'all' | 'groceries' | 'shopping' | 'home_services';

export const ShoppingGroceriesPage: React.FC = () => {
  const { showToast } = useToast();

  // State: List of shopping & home spends (clean slate)
  const [spends, setSpends] = useState<ShoppingSpend[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter(p => !['sp_1', 'sp_2', 'sp_3', 'sp_4', 'sp_5'].includes(p.id));
      }
    } catch {}
    return [];
  });

  const [isLoadingServer, setIsLoadingServer] = useState(false);

  // Dual-sync data loss fix: Fetch from server on mount and reconcile with local cache
  useEffect(() => {
    let isMounted = true;
    const fetchServerSpends = async () => {
      try {
        setIsLoadingServer(true);
        const serverSpends = await api.getShoppingSpends();
        if (isMounted && Array.isArray(serverSpends) && serverSpends.length > 0) {
          setSpends(prev => {
            // Merge server and local spends by id, keeping latest updated_at
            const map = new Map<string, ShoppingSpend>();
            for (const item of prev) map.set(item.id, item);
            for (const item of serverSpends) {
              const existing = map.get(item.id);
              if (!existing) {
                map.set(item.id, item);
              } else {
                const existingTime = new Date(existing.updated_at || existing.created_at || 0).getTime();
                const serverTime = new Date(item.updated_at || item.created_at || 0).getTime();
                if (serverTime >= existingTime) {
                  map.set(item.id, item);
                }
              }
            }
            const merged = Array.from(map.values());
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
            return merged;
          });
        } else if (isMounted) {
          // If server is empty, backfill with local/initial spends
          api.batchSaveShoppingSpends(spends).catch(() => {});
        }
      } catch (err) {
        console.warn('Server spends fetch note (offline fallback active):', err);
      } finally {
        if (isMounted) setIsLoadingServer(false);
      }
    };

    fetchServerSpends();
    return () => {
      isMounted = false;
    };
  }, []);

  // Save to localStorage whenever spends state updates
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(spends));
    } catch {}
  }, [spends]);

  // Add/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpend, setEditingSpend] = useState<ShoppingSpend | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState<ShoppingCategory>('groceries');
  const [formMerchant, setFormMerchant] = useState('');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<PaymentMethod>('UPI');
  const [formNotes, setFormNotes] = useState('');
  const [formReceiptImage, setFormReceiptImage] = useState<string | undefined>(undefined);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Visual Moving Indicator Filter State
  const [activeMainFilter, setActiveMainFilter] = useState<MainCategoryFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<'all' | 'monthly' | 'yearly'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Animated Tick Success Modal State
  const [addedSuccessItem, setAddedSuccessItem] = useState<{ title: string; amount: number } | null>(null);
  const [isRocketLaunching, setIsRocketLaunching] = useState(false);

  // Preview Receipt Modal
  const [viewReceiptUrl, setViewReceiptUrl] = useState<string | null>(null);

  // Open modal for new spend
  const handleOpenAddModal = (presetCategory?: ShoppingCategory) => {
    setEditingSpend(null);
    setFormTitle('');
    setFormAmount('');
    setFormCategory(presetCategory || 'groceries');
    setFormMerchant('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormPaymentMethod('UPI');
    setFormNotes('');
    setFormReceiptImage(undefined);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (item: ShoppingSpend) => {
    setEditingSpend(item);
    setFormTitle(item.title);
    setFormAmount(item.amount.toString());
    setFormCategory(item.category);
    setFormMerchant(item.merchant || '');
    setFormDate(item.date);
    setFormPaymentMethod(item.payment_method);
    setFormNotes(item.notes || '');
    setFormReceiptImage(item.receipt_image);
    setIsModalOpen(true);
  };

  // Quick preset amount additions
  const handleAddPresetAmount = (increment: number) => {
    const current = parseFloat(formAmount) || 0;
    setFormAmount((current + increment).toString());
  };

  // Submit form (saves locally and to server database)
  const handleSaveSpend = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (!parsedAmount || parsedAmount <= 0) {
      showToast('Please enter a valid spend amount.', 'error');
      return;
    }

    if (!formTitle.trim()) {
      showToast('Please enter an item or service name.', 'error');
      return;
    }

    const isHome = CATEGORY_CONFIG[formCategory].isHomeService;
    const now = new Date().toISOString();

    if (editingSpend) {
      // Update existing item
      const updated: ShoppingSpend = {
        ...editingSpend,
        title: formTitle.trim(),
        amount: parsedAmount,
        category: formCategory,
        merchant: formMerchant.trim() || undefined,
        date: formDate,
        payment_method: formPaymentMethod,
        notes: formNotes.trim() || undefined,
        receipt_image: formReceiptImage,
        is_home_service: isHome,
        updated_at: now
      };

      setSpends(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      setIsModalOpen(false);
      showToast(`Updated "${updated.title}" successfully.`, 'success');

      // Sync to server database
      api.saveShoppingSpend(updated).catch(() => {});
    } else {
      // Create new item
      const newSpend: ShoppingSpend = {
        id: `sp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: formTitle.trim(),
        amount: parsedAmount,
        category: formCategory,
        merchant: formMerchant.trim() || undefined,
        date: formDate,
        payment_method: formPaymentMethod,
        notes: formNotes.trim() || undefined,
        receipt_image: formReceiptImage,
        is_home_service: isHome,
        created_at: now,
        updated_at: now
      };

      setSpends(prev => [newSpend, ...prev]);
      setIsModalOpen(false);
      setIsRocketLaunching(true);
      setAddedSuccessItem({ title: newSpend.title, amount: parsedAmount });
      setTimeout(() => setAddedSuccessItem(null), 1500);
      showToast(`Added ₹${parsedAmount} for "${newSpend.title}".`, 'success');

      // Sync to server database
      api.saveShoppingSpend(newSpend).catch(() => {});
    }
  };

  // Toggle item settlement checkmark
  const handleToggleSettled = (id: string) => {
    setSpends(prev =>
      prev.map(item => {
        if (item.id === id) {
          const nextState = !item.is_settled;
          const updated: ShoppingSpend = {
            ...item,
            is_settled: nextState,
            updated_at: new Date().toISOString()
          };
          api.saveShoppingSpend(updated).catch(() => {});
          if (nextState) {
            setAddedSuccessItem({ title: `Completed "${item.title}"`, amount: item.amount });
            setTimeout(() => setAddedSuccessItem(null), 1600);
          }
          showToast(
            nextState
              ? `✓ Settled "${item.title}"!`
              : `Unmarked "${item.title}".`,
            'info'
          );
          return updated;
        }
        return item;
      })
    );
  };

  // Delete spend
  const handleDeleteSpend = (id: string, title: string) => {
    setSpends(prev => prev.filter(s => s.id !== id));
    showToast(`Removed "${title}".`, 'info');
    api.deleteShoppingSpend(id).catch(() => {});
  };

  // Filtered Spends List based on category, period, and search query
  const filteredSpends = useMemo(() => {
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const currentYearPrefix = `${now.getFullYear()}`;

    return spends.filter(item => {
      // 1. Period Filter (Monthly / Yearly / All Time)
      if (periodFilter === 'monthly') {
        if (!item.date.startsWith(currentMonthPrefix)) return false;
      } else if (periodFilter === 'yearly') {
        if (!item.date.startsWith(currentYearPrefix)) return false;
      }

      // 2. Moving Indicator Category Filter
      if (activeMainFilter === 'groceries') {
        if (item.category !== 'groceries' && item.category !== 'supermarket') return false;
      } else if (activeMainFilter === 'shopping') {
        if (item.category !== 'shopping' && item.category !== 'food_delivery') return false;
      } else if (activeMainFilter === 'home_services') {
        if (!item.is_home_service && item.category !== 'utilities' && item.category !== 'maintenance') return false;
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesMerchant = (item.merchant || '').toLowerCase().includes(q);
        const matchesNotes = (item.notes || '').toLowerCase().includes(q);
        const matchesCat = CATEGORY_CONFIG[item.category]?.label.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMerchant && !matchesNotes && !matchesCat) return false;
      }

      return true;
    });
  }, [spends, activeMainFilter, periodFilter, searchQuery]);

  // Statistics Computations
  const stats = useMemo(() => {
    let total = 0;
    let groceries = 0;
    let shopping = 0;
    let homeServices = 0;

    for (const item of spends) {
      const amt = Number(item.amount) || 0;
      total += amt;
      if (item.category === 'groceries' || item.category === 'supermarket') {
        groceries += amt;
      } else if (item.category === 'shopping' || item.category === 'food_delivery') {
        shopping += amt;
      }
      if (item.is_home_service) {
        homeServices += amt;
      }
    }

    return { total, groceries, shopping, homeServices, count: spends.length };
  }, [spends]);

  // Export PDF Spends Handler requested by user
  const handleDownloadPdf = () => {
    let filterLabel = 'All Spends & Services';
    if (activeMainFilter === 'groceries') filterLabel = 'Groceries & Mart';
    else if (activeMainFilter === 'shopping') filterLabel = 'Personal Shopping';
    else if (activeMainFilter === 'home_services') filterLabel = 'Home Services & Bills';

    exportShoppingSpendsPdf(filteredSpends, filterLabel);
    showToast(`Exported ${filteredSpends.length} spends items to PDF statement!`, 'success');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header & Action Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>Shopping 🛍️ & Groceries</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
              Daily Living Hub
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track daily groceries, supermarket restocks, personal shopping & home services expenses separately with zero data loss.
          </p>
        </div>

        {/* Action Buttons: PDF Download & Add Expense */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-200/80 dark:border-white/10 shadow-xs cursor-pointer transition-colors"
          >
            <Download size={15} className="text-emerald-600 dark:text-emerald-400" />
            <span>Download Spends PDF</span>
          </button>

          <LiquidButton
            variant="primary"
            onClick={() => handleOpenAddModal()}
            icon={<Plus size={16} />}
            className="text-xs font-bold"
          >
            Add New Spend
          </LiquidButton>
        </div>
      </div>

      {/* KPI Statistics Cards with Liquid-Glass Aesthetic */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Spends */}
        <LiquidGlassCard
          variant="primary"
          glowColor="rgba(59, 130, 246, 0.15)"
          className="p-4 border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-slate-900/5 to-transparent"
        >
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Daily Spend</span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Layers size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            ₹{stats.total.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            {stats.count} tracked expenses
          </p>
        </LiquidGlassCard>

        {/* Card 2: Groceries & Supermarket */}
        <LiquidGlassCard
          variant="secondary"
          glowColor="rgba(16, 185, 129, 0.15)"
          className="p-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-slate-900/5 to-transparent"
        >
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Groceries & Mart</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <ShoppingCart size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            ₹{stats.groceries.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Fresh produce & kitchen staples
          </p>
        </LiquidGlassCard>

        {/* Card 3: Personal Shopping */}
        <LiquidGlassCard
          variant="secondary"
          glowColor="rgba(245, 158, 11, 0.15)"
          className="p-4 border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-slate-900/5 to-transparent"
        >
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Personal Shopping</span>
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <ShoppingBag size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            ₹{stats.shopping.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Apparel, mart & retail
          </p>
        </LiquidGlassCard>

        {/* Card 4: Home Services & Bills */}
        <LiquidGlassCard
          variant="secondary"
          glowColor="rgba(139, 92, 246, 0.15)"
          className="p-4 border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-slate-900/5 to-transparent"
        >
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Home Services & Bills</span>
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Home size={14} />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
            ₹{stats.homeServices.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Maid, repairs & electricity
          </p>
        </LiquidGlassCard>
      </div>

      {/* LIQUID-GLASS FILTER BAR WITH MOVING INDICATOR & PERIOD SELECTOR */}
      <div className="p-1.5 sm:p-2 rounded-3xl liquid-glass-secondary border border-white/60 dark:border-white/10 shadow-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Moving Indicator Category Tabs */}
        <div className="relative flex items-center bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl overflow-x-auto">
          {[
            { id: 'all', label: 'All Spends', icon: Sparkles },
            { id: 'groceries', label: 'Groceries & Mart', icon: ShoppingCart },
            { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
            { id: 'home_services', label: 'Home Services & Bills', icon: Home }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeMainFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMainFilter(tab.id as MainCategoryFilter)}
                className={`relative px-3.5 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 select-none ${
                  isActive
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {/* Smooth Animated Liquid Indicator Pill */}
                {isActive && (
                  <motion.div
                    layoutId="shoppingCategoryIndicator"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-200/80 dark:border-white/15 -z-10"
                  />
                )}
                <Icon size={14} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right side: Period Selector (Monthly / Yearly) & Search Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          {/* Period selector pill */}
          <div className="relative flex items-center bg-slate-200/60 dark:bg-slate-800/60 p-1 rounded-2xl shrink-0">
            {[
              { id: 'all', label: 'All' },
              { id: 'monthly', label: 'Monthly' },
              { id: 'yearly', label: 'Yearly' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodFilter(p.id as any)}
                className={`relative px-2.5 py-1.5 text-xs font-bold rounded-xl transition-colors cursor-pointer select-none ${
                  periodFilter === p.id
                    ? 'text-slate-900 dark:text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {periodFilter === p.id && (
                  <motion.div
                    layoutId="shoppingPeriodIndicator"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-white dark:bg-slate-900 shadow-md border border-slate-200/80 dark:border-white/15 -z-10"
                  />
                )}
                <span>{p.label}</span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items, mart..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-2xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Spends List */}
      <div className="space-y-3">
        {filteredSpends.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredSpends.map(item => {
              const catCfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.other;
              return (
                <LiquidGlassCard
                  key={item.id}
                  variant="secondary"
                  className={`p-4 sm:p-5 border-white/60 dark:border-white/10 hover:border-emerald-500/30 transition-all group ${
                    item.is_settled ? 'opacity-85' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Interactive Settlement Checkbox with Spring Tick */}
                      <button
                        type="button"
                        onClick={() => handleToggleSettled(item.id)}
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-all cursor-pointer shrink-0 mt-0.5 ${
                          item.is_settled
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-emerald-500 border-slate-200/80 dark:border-white/10 hover:border-emerald-500/40'
                        }`}
                        title={item.is_settled ? 'Settled (Click to unmark)' : 'Click to mark as Settled'}
                      >
                        {item.is_settled ? (
                          <motion.svg
                            initial={{ scale: 0, rotate: -20 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                            className="w-4 h-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </motion.svg>
                        ) : (
                          <span className="text-sm">{catCfg.icon}</span>
                        )}
                      </button>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={`text-sm font-bold text-slate-900 dark:text-white leading-tight ${
                            item.is_settled ? 'line-through text-slate-500 dark:text-slate-400' : ''
                          }`}>
                            {item.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-white/10">
                            {catCfg.label}
                          </span>
                          {item.is_home_service && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              Home Service
                            </span>
                          )}
                          {item.is_settled && (
                            <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1">
                              <Check size={10} />
                              <span>Settled</span>
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 flex-wrap">
                          <span>{item.date}</span>
                          {item.merchant && <span>• {item.merchant}</span>}
                          <span>• {item.payment_method}</span>
                        </div>

                        {item.notes && (
                          <p className="text-xs text-slate-600 dark:text-slate-300/90 line-clamp-2 mt-1">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Amount & Actions */}
                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        ₹{Number(item.amount).toLocaleString('en-IN')}
                      </div>

                      <div className="flex items-center justify-end gap-1.5 mt-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        {item.receipt_image && (
                          <button
                            type="button"
                            onClick={() => setViewReceiptUrl(item.receipt_image!)}
                            className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer"
                            title="View Receipt"
                          >
                            <Receipt size={14} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-500/10 cursor-pointer transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSpend(item.id, item.title)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </LiquidGlassCard>
              );
            })}
          </div>
        ) : (
          <LiquidGlassCard className="p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-2xl shadow-xs">
              🛒
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No spend items found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? 'No items matched your search query. Try another term.'
                : 'Start tracking your daily groceries, supermarket restocks, and home services.'}
            </p>
            <LiquidButton
              variant="primary"
              size="sm"
              onClick={() => handleOpenAddModal()}
              icon={<Plus size={14} />}
              className="text-xs"
            >
              Add First Spend
            </LiquidButton>
          </LiquidGlassCard>
        )}
      </div>

      {/* Add / Edit Spend Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-lg">
                    {CATEGORY_CONFIG[formCategory]?.icon || '🛒'}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingSpend ? 'Edit Spend Record' : 'Add New Daily Spend'}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Track spending on groceries, shopping, and home services
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSaveSpend} className="p-6 overflow-y-auto space-y-4">
                {/* Title */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Item / Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Weekly Vegetables, Supermarket Restock, Maid Salary"
                    className="w-full mt-1 px-3.5 py-2.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-medium"
                  />
                </div>

                {/* Amount with Quick Add Increments */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Amount (₹) *
                    </label>
                    <div className="flex items-center gap-1">
                      {[100, 500, 1000, 2000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleAddPresetAmount(val)}
                          className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 cursor-pointer transition-colors"
                        >
                          +{val}
                        </button>
                      ))}
                    </div>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min="1"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="Enter spend amount"
                    className="w-full mt-1 px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                {/* Category Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => {
                      const isSelected = formCategory === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFormCategory(key as ShoppingCategory)}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs'
                              : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <span className="text-base">{cfg.icon}</span>
                          <span className="text-xs truncate">{cfg.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Merchant & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Merchant / Vendor / Technician
                    </label>
                    <input
                      type="text"
                      value={formMerchant}
                      onChange={(e) => setFormMerchant(e.target.value)}
                      placeholder="e.g. DMart, Urban Company, Local Store"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Date
                    </label>
                    <input
                      type="date"
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mt-1">
                    {(['UPI', 'Cash', 'Bank Transfer', 'Card'] as PaymentMethod[]).map(pm => (
                      <button
                        key={pm}
                        type="button"
                        onClick={() => setFormPaymentMethod(pm)}
                        className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all cursor-pointer ${
                          formPaymentMethod === pm
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {pm}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Notes & Details
                  </label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="e.g. 5kg rice, cooking oil, detergent powder"
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Receipt Image */}
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Bill / Receipt Photo
                  </label>
                  {formReceiptImage ? (
                    <div className="relative inline-block">
                      <img
                        src={formReceiptImage}
                        alt="Receipt"
                        className="w-24 h-24 object-cover rounded-xl border border-slate-200 dark:border-white/10"
                      />
                      <button
                        type="button"
                        onClick={() => setFormReceiptImage(undefined)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center cursor-pointer shadow-xs"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsCameraOpen(true)}
                      className="px-3 py-2 rounded-xl border border-dashed border-slate-300 dark:border-white/20 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Camera size={14} />
                      <span>Take Photo / Upload Receipt</span>
                    </button>
                  )}
                </div>

                {/* Modal Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-white/10">
                  <LiquidButton
                    type="button"
                    variant="ghost"
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </LiquidButton>
                  <LiquidButton
                    type="submit"
                    variant="primary"
                    className="text-xs font-bold"
                  >
                    {editingSpend ? 'Save Changes' : 'Save Spend'}
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCaptureModal
          isOpen={isCameraOpen}
          onClose={() => setIsCameraOpen(false)}
          onCapture={(dataUrl) => {
            setFormReceiptImage(dataUrl);
            setIsCameraOpen(false);
            showToast('Receipt photo attached!', 'success');
          }}
        />
      )}

      {/* View Full Receipt Modal */}
      {viewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="relative max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-4 overflow-hidden border border-white/10 shadow-2xl">
            <button
              onClick={() => setViewReceiptUrl(null)}
              className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 text-white cursor-pointer"
            >
              <X size={16} />
            </button>
            <img src={viewReceiptUrl} alt="Full Receipt" className="w-full max-h-[80vh] object-contain rounded-2xl" />
          </div>
        </div>
      )}

      {/* Animated Liquid-Glass Checkmark / Tick Notification */}
      <AnimatePresence>
        {addedSuccessItem && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ type: 'spring', stiffness: 450, damping: 26 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className="flex items-center gap-3.5 px-6 py-4 rounded-3xl bg-emerald-600/90 dark:bg-emerald-500/90 text-white backdrop-blur-2xl shadow-2xl border border-emerald-300/40">
              <div className="relative w-10 h-10 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shrink-0 shadow-lg">
                <motion.svg
                  className="w-6 h-6 text-emerald-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <motion.path
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
                {/* Glowing ring animation */}
                <motion.span
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{ scale: 1.6, opacity: 0 }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400"
                />
              </div>
              <div>
                <div className="text-xs font-black tracking-wide flex items-center gap-1.5">
                  <span>Spend Item Saved & Synced!</span>
                  <span>✨</span>
                </div>
                <div className="text-[11px] font-semibold text-emerald-100">
                  {addedSuccessItem.title} • ₹{addedSuccessItem.amount.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Razorpay Rocket Launch Micro-Interaction */}
      <RocketLaunchAnimation
        isActive={isRocketLaunching}
        onComplete={() => setIsRocketLaunching(false)}
      />
    </div>
  );
};
