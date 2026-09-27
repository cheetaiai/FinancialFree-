import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';
import { BudgetProvider } from './context/BudgetContext';
import { SyncProvider, useSync } from './context/SyncContext';
import { BiometricAuthProvider, useBiometricAuth } from './context/BiometricAuthContext';
import { PerformanceProvider } from './context/PerformanceContext';
import { AppUpdateProvider } from './context/AppUpdateContext';
import { AppUpdateBanner } from './components/update/AppUpdateBanner';
import { AppUpdateModal } from './components/update/AppUpdateModal';
import { BudgetAlertBanner } from './components/budget/BudgetAlertBanner';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PeoplePage } from './pages/PeoplePage';
import { TransactionsPage } from './pages/TransactionsPage';
import { MonthlySummaryPage } from './pages/MonthlySummaryPage';
import { YearlySummaryPage } from './pages/YearlySummaryPage';
import { ReportsPage } from './pages/ReportsPage';
import { RemindersPage } from './pages/RemindersPage';
import { SettingsPage } from './pages/SettingsPage';
import { Navbar } from './components/layout/Navbar';
import { MobileTopSectionBar } from './components/layout/MobileTopSectionBar';
import { BottomNavigation, TabType } from './components/layout/BottomNavigation';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddPersonModal } from './components/AddPersonModal';
import { ReminderModal } from './components/ReminderModal';
import { AiFinancialChatDrawer } from './components/AiFinancialChatDrawer';
import { AppWalkthroughModal } from './components/onboarding/AppWalkthroughModal';
import { LogoutAnimationModal } from './components/auth/LogoutAnimationModal';
import { BiometricLockScreen } from './components/auth/BiometricLockScreen';
import { DataIntegrityModal } from './components/DataIntegrityModal';
import { DeviceFrameSimulator, DeviceMode } from './components/mobile/DeviceFrameSimulator';
import { OfflineIndicator } from './components/mobile/OfflineIndicator';
import { ConfirmDialog } from './components/ui/ConfirmDialog';
import { Person, Transaction, TransactionType } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, Bot } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading, logout } = useAuth();
  const { isLocked } = useBiometricAuth();
  const { runIntegrityCheck } = useSync();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('responsive');

  // App Walkthrough state (opened when clicked via Help / Tour button)
  const [isWalkthroughOpen, setIsWalkthroughOpen] = useState(false);

  // Logout state
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('given');
  const [txModalPersonId, setTxModalPersonId] = useState<string | undefined>(undefined);
  const [txModalInitialAmount, setTxModalInitialAmount] = useState<string | undefined>(undefined);
  const [txModalInitialNotes, setTxModalInitialNotes] = useState<string | undefined>(undefined);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderPersonId, setReminderPersonId] = useState<string | undefined>(undefined);

  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Refresh trigger for components
  const [refreshKey, setRefreshKey] = useState(0);

  // Automated Data Integrity Check on App Load
  useEffect(() => {
    if (isAuthenticated) {
      // Trigger automated integrity check on app load to compare local cached records with remote Firestore state
      const timer = setTimeout(() => {
        runIntegrityCheck(true);
      }, 1200);

      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, runIntegrityCheck]);

  // Reconciled listener
  useEffect(() => {
    const handleReconciled = () => {
      setRefreshKey(k => k + 1);
    };
    window.addEventListener('financialfree_data_reconciled', handleReconciled);
    return () => window.removeEventListener('financialfree_data_reconciled', handleReconciled);
  }, []);

  // Deep-Link Return Request Listener (?action=return&personId=...&amount=...)
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('action') === 'return') {
        const pId = params.get('personId') || undefined;
        const amt = params.get('amount') || undefined;
        const nts = params.get('notes') || undefined;
        setTxModalType('returned');
        setTxModalPersonId(pId);
        setTxModalInitialAmount(amt);
        setTxModalInitialNotes(nts);
        setEditTx(null);
        setIsTxModalOpen(true);

        // Clean URL parameters without reloading
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.warn('Failed to parse deep link params:', e);
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="text-sm font-medium text-slate-500">Loading FinancialFree...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage onOpenWalkthrough={() => setIsWalkthroughOpen(true)} />
        <AppWalkthroughModal
          isOpen={isWalkthroughOpen}
          onClose={() => {
            setIsWalkthroughOpen(false);
            localStorage.setItem('financialfree_walkthrough_seen', 'true');
          }}
          onProceedToLogin={() => {
            setIsWalkthroughOpen(false);
            localStorage.setItem('financialfree_walkthrough_seen', 'true');
          }}
        />
      </>
    );
  }

  const handleOpenGiveModal = (personId?: string) => {
    setEditTx(null);
    setTxModalType('given');
    setTxModalPersonId(personId);
    setIsTxModalOpen(true);
  };

  const handleOpenReturnModal = (personId?: string, amount?: string, notes?: string) => {
    setEditTx(null);
    setTxModalType('returned');
    setTxModalPersonId(personId);
    setTxModalInitialAmount(amount);
    setTxModalInitialNotes(notes);
    setIsTxModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditTx(tx);
    setTxModalType(tx.transaction_type);
    setTxModalPersonId(tx.person_id);
    setIsTxModalOpen(true);
  };

  const handleOpenAddPerson = (personToEdit?: Person) => {
    setEditPerson(personToEdit || null);
    setIsPersonModalOpen(true);
  };

  const handleOpenReminder = (personId?: string) => {
    setReminderPersonId(personId);
    setIsReminderModalOpen(true);
  };

  return (
    <DeviceFrameSimulator
      deviceMode={deviceMode}
      onChangeDeviceMode={setDeviceMode}
    >
      <div className="min-h-screen flex flex-col selection:bg-blue-500 selection:text-white relative">
        {/* Top Navigation */}
        <Navbar
          onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
          onNavigateTab={tab => {
            setSelectedPersonId(null);
            setCurrentTab(tab);
          }}
          currentTab={currentTab}
          onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
          onLogoutRequest={() => setIsLoggingOut(true)}
          currentDeviceMode={deviceMode}
          onSelectDeviceMode={setDeviceMode}
        />

        {/* Mobile Top Features Bar with Liquid-Glass Effects and Moving Section Indicator */}
        <MobileTopSectionBar
          currentTab={currentTab}
          onSelectTab={tab => {
            setSelectedPersonId(null);
            setCurrentTab(tab);
          }}
        />

        {/* Main Content Area */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 pt-3 sm:pt-4 pb-32 md:pb-24">
          {/* Over-The-Air Software Update Notification Banner with Live File Analysis */}
          <AppUpdateBanner className="mb-3" />

          {/* Budget In-App Alert Banner */}
          <BudgetAlertBanner className="mb-4" />

          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab + (selectedPersonId || '') + refreshKey}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {currentTab === 'dashboard' && (
                <DashboardPage
                  onNavigateToPeople={() => setCurrentTab('people')}
                  onNavigateToTransactions={() => setCurrentTab('transactions')}
                  onOpenGiveModal={handleOpenGiveModal}
                  onOpenReturnModal={handleOpenReturnModal}
                  onOpenAddPersonModal={() => handleOpenAddPerson()}
                  onOpenReminderModal={handleOpenReminder}
                  onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
                />
              )}

              {currentTab === 'people' && (
                <PeoplePage
                  selectedPersonId={selectedPersonId}
                  onClearSelectedPerson={() => setSelectedPersonId(null)}
                  onOpenGiveModal={handleOpenGiveModal}
                  onOpenReturnModal={handleOpenReturnModal}
                  onOpenAddPersonModal={handleOpenAddPerson}
                  onOpenReminderModal={handleOpenReminder}
                  onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
                />
              )}

              {currentTab === 'transactions' && (
                <TransactionsPage
                  onOpenGiveModal={() => handleOpenGiveModal()}
                  onOpenReturnModal={() => handleOpenReturnModal()}
                  onEditTransaction={handleEditTransaction}
                />
              )}

              {currentTab === 'monthly' && <MonthlySummaryPage />}

              {currentTab === 'yearly' && <YearlySummaryPage />}

              {currentTab === 'reports' && <ReportsPage />}

              {currentTab === 'reminders' && (
                <RemindersPage onOpenReminderModal={() => handleOpenReminder()} />
              )}

              {currentTab === 'settings' && (
                <SettingsPage
                  onOpenWalkthrough={() => setIsWalkthroughOpen(true)}
                  onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
                  onLogoutRequest={() => setIsLogoutConfirmOpen(true)}
                  currentDeviceMode={deviceMode}
                  onSelectDeviceMode={setDeviceMode}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Floating AI Agent Trigger Button (Right Side) */}
        <motion.button
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsAiDrawerOpen(true)}
          className="fixed bottom-20 sm:bottom-24 right-3 sm:right-6 z-40 flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white font-semibold text-xs shadow-xl shadow-blue-500/25 cursor-pointer border border-white/20 backdrop-blur-md"
          title="Open FinancialFree AI Agent"
        >
          <Sparkles size={15} className="animate-spin-slow shrink-0" />
          <span className="font-bold text-[11px] sm:text-xs">AI</span>
          <span className="hidden sm:inline font-semibold">Copilot</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
        </motion.button>

        {/* Floating Bottom Navigation Bar */}
        <BottomNavigation
          currentTab={currentTab}
          onSelectTab={tab => {
            setSelectedPersonId(null);
            setCurrentTab(tab);
          }}
          onOpenGiveModal={() => handleOpenGiveModal()}
          onOpenReturnModal={() => handleOpenReturnModal()}
          onOpenAddPersonModal={() => handleOpenAddPerson()}
          onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
          onLogoutRequest={() => setIsLogoutConfirmOpen(true)}
        />

        {/* Global Transaction Modal */}
        <AddTransactionModal
          isOpen={isTxModalOpen}
          onClose={() => {
            setIsTxModalOpen(false);
            setEditTx(null);
            setTxModalInitialAmount(undefined);
            setTxModalInitialNotes(undefined);
          }}
          onSuccess={() => setRefreshKey(k => k + 1)}
          initialType={txModalType}
          initialPersonId={txModalPersonId}
          initialAmount={txModalInitialAmount}
          initialNotes={txModalInitialNotes}
          editTransaction={editTx}
        />

        {/* Global Person Modal */}
        <AddPersonModal
          isOpen={isPersonModalOpen}
          onClose={() => {
            setIsPersonModalOpen(false);
            setEditPerson(null);
          }}
          onSuccess={() => setRefreshKey(k => k + 1)}
          editPerson={editPerson}
        />

        {/* Global Reminder Modal */}
        <ReminderModal
          isOpen={isReminderModalOpen}
          onClose={() => {
            setIsReminderModalOpen(false);
            setReminderPersonId(undefined);
          }}
          onSuccess={() => setRefreshKey(k => k + 1)}
          initialPersonId={reminderPersonId}
        />

        {/* Global AI Chat Drawer */}
        <AiFinancialChatDrawer
          isOpen={isAiDrawerOpen}
          onClose={() => setIsAiDrawerOpen(false)}
        />

        {/* 3-Page Walkthrough Tour Modal (with Page-Turn Animations & Feature Highlights) */}
        <AppWalkthroughModal
          isOpen={isWalkthroughOpen}
          onClose={() => {
            setIsWalkthroughOpen(false);
            localStorage.setItem('financialfree_walkthrough_seen', 'true');
          }}
          onProceedToLogin={() => {
            setIsWalkthroughOpen(false);
            localStorage.setItem('financialfree_walkthrough_seen', 'true');
          }}
        />

        {/* Data Integrity & Cloud Reconciliation Modal */}
        <DataIntegrityModal />

        {/* Global Sign Out Confirmation Dialog */}
        <ConfirmDialog
          isOpen={isLogoutConfirmOpen}
          onClose={() => setIsLogoutConfirmOpen(false)}
          onConfirm={() => {
            setIsLogoutConfirmOpen(false);
            setIsLoggingOut(true);
          }}
          title="Sign Out of FinancialFree?"
          message="Are you sure you want to sign out? Your records are safely saved and synchronized in Cloud Firestore."
          confirmText="Yes, Sign Out"
          isDestructive={true}
        />

        {/* Logout Animation Transition Modal */}
        <LogoutAnimationModal
          isOpen={isLoggingOut}
          onFinished={() => {
            setIsLoggingOut(false);
            logout();
          }}
        />

        {/* Real-Time Connectivity Offline/Online Notification */}
        <OfflineIndicator />

        {/* Over-the-Air Software Update & MB Analysis Modal */}
        <AppUpdateModal />

        {/* Biometric (WebAuthn) & Quick PIN Vault Lock Screen */}
        <AnimatePresence>
          {isLocked && <BiometricLockScreen />}
        </AnimatePresence>
      </div>
    </DeviceFrameSimulator>
  );
};

export function App() {
  return (
    <PerformanceProvider>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SyncProvider>
              <CurrencyProvider>
                <BudgetProvider>
                  <AppUpdateProvider>
                    <BiometricAuthProvider>
                      <MainApp />
                    </BiometricAuthProvider>
                  </AppUpdateProvider>
                </BudgetProvider>
              </CurrencyProvider>
            </SyncProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </PerformanceProvider>
  );
}

export default App;
