import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { CurrencyProvider } from './context/CurrencyContext';
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
import { BottomNavigation, TabType } from './components/layout/BottomNavigation';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddPersonModal } from './components/AddPersonModal';
import { ReminderModal } from './components/ReminderModal';
import { AiFinancialChatDrawer } from './components/AiFinancialChatDrawer';
import { Person, Transaction, TransactionType } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Sparkles, Bot } from 'lucide-react';

const MainApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txModalType, setTxModalType] = useState<TransactionType>('given');
  const [txModalPersonId, setTxModalPersonId] = useState<string | undefined>(undefined);
  const [editTx, setEditTx] = useState<Transaction | null>(null);

  const [isPersonModalOpen, setIsPersonModalOpen] = useState(false);
  const [editPerson, setEditPerson] = useState<Person | null>(null);

  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderPersonId, setReminderPersonId] = useState<string | undefined>(undefined);

  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Refresh trigger for components
  const [refreshKey, setRefreshKey] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-500" size={32} />
        <span className="text-sm font-medium text-slate-500">Loading FinancialFree...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const handleOpenGiveModal = (personId?: string) => {
    setEditTx(null);
    setTxModalType('given');
    setTxModalPersonId(personId);
    setIsTxModalOpen(true);
  };

  const handleOpenReturnModal = (personId?: string) => {
    setEditTx(null);
    setTxModalType('returned');
    setTxModalPersonId(personId);
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
    <div className="min-h-screen flex flex-col selection:bg-blue-500 selection:text-white relative">
      {/* Top Navigation */}
      <Navbar
        onOpenAiDrawer={() => setIsAiDrawerOpen(true)}
        onNavigateTab={tab => {
          setSelectedPersonId(null);
          setCurrentTab(tab);
        }}
        currentTab={currentTab}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-4">
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

            {currentTab === 'settings' && <SettingsPage />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floating AI Agent Trigger Button (Right Side) */}
      <motion.button
        whileHover={{ scale: 1.06, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAiDrawerOpen(true)}
        className="fixed bottom-24 right-4 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-500 text-white font-semibold text-xs shadow-xl shadow-blue-500/25 cursor-pointer border border-white/20 backdrop-blur-md"
        title="Open FinancialFree AI Agent"
      >
        <Sparkles size={16} className="animate-spin-slow" />
        <span className="hidden sm:inline">AI Agent Copilot</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
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
      />

      {/* Global Transaction Modal */}
      <AddTransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditTx(null);
        }}
        onSuccess={() => setRefreshKey(k => k + 1)}
        initialType={txModalType}
        initialPersonId={txModalPersonId}
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
    </div>
  );
};

export function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <CurrencyProvider>
            <MainApp />
          </CurrencyProvider>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
