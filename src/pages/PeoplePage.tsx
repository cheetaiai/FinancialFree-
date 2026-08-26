import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Bell,
  Edit2,
  Trash2,
  Receipt,
  FileText,
  Printer,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { LiquidSegmentedControl } from '../components/ui/LiquidSegmentedControl';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { LiquidModal } from '../components/ui/LiquidModal';
import { Person, Transaction, Reminder } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { formatINR, formatIndianDate, getStatusBadgeConfig } from '../lib/formatters';

interface PeoplePageProps {
  selectedPersonId?: string | null;
  onClearSelectedPerson?: () => void;
  onOpenGiveModal: (personId?: string) => void;
  onOpenReturnModal: (personId?: string) => void;
  onOpenAddPersonModal: (editPerson?: Person) => void;
  onOpenReminderModal: (personId?: string) => void;
  onOpenAiDrawer: () => void;
}

export const PeoplePage: React.FC<PeoplePageProps> = ({
  selectedPersonId: externalPersonId,
  onClearSelectedPerson,
  onOpenGiveModal,
  onOpenReturnModal,
  onOpenAddPersonModal,
  onOpenReminderModal,
  onOpenAiDrawer
}) => {
  const { showToast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activePersonId, setActivePersonId] = useState<string | null>(externalPersonId || null);

  // Active Person Drilldown State
  const [personDetail, setPersonDetail] = useState<{
    person: Person;
    transactions: Transaction[];
    reminders: Reminder[];
  } | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Delete State
  const [deletePersonId, setDeletePersonId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Receipt modal
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);

  const fetchPeople = async () => {
    setIsLoading(true);
    try {
      const data = await api.getPeople();
      setPeople(data);
    } catch (err) {
      console.error('Failed to load people:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, []);

  // Sync external selected person
  useEffect(() => {
    if (externalPersonId) {
      setActivePersonId(externalPersonId);
    }
  }, [externalPersonId]);

  // Load single person drilldown details
  useEffect(() => {
    if (activePersonId) {
      setIsLoadingDetail(true);
      api.getPersonById(activePersonId)
        .then(data => setPersonDetail(data))
        .catch(err => {
          showToast('Failed to load person details', 'error');
          setActivePersonId(null);
        })
        .finally(() => setIsLoadingDetail(false));
    } else {
      setPersonDetail(null);
    }
  }, [activePersonId]);

  const handleDeletePerson = async () => {
    if (!deletePersonId) return;
    setIsDeleting(true);
    try {
      await api.deletePerson(deletePersonId);
      showToast('Person and their transactions removed.', 'info');
      setDeletePersonId(null);
      if (activePersonId === deletePersonId) {
        setActivePersonId(null);
        onClearSelectedPerson?.();
      }
      fetchPeople();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete person', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter people
  const filteredPeople = people.filter(p => {
    const matchesSearch =
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone && p.phone.includes(searchQuery)) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'pending' && p.status === 'Pending') ||
      (statusFilter === 'partial' && p.status === 'Partially Paid') ||
      (statusFilter === 'paid' && p.status === 'Paid');

    const matchesCategory =
      categoryFilter === 'all' || p.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = ['all', 'Friends', 'Family', 'Business', 'Colleagues', 'Neighbours', 'Other'];

  // If in Person Detail Drilldown view:
  if (activePersonId && personDetail) {
    const { person, transactions, reminders } = personDetail;
    const badge = getStatusBadgeConfig(person.status);

    return (
      <div className="space-y-6 pb-24">
        {/* Back Button & Actions */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            onClick={() => {
              setActivePersonId(null);
              onClearSelectedPerson?.();
            }}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-white/10 cursor-pointer transition-all"
          >
            <ArrowLeft size={16} />
            <span>Back to People</span>
          </button>

          <div className="flex items-center gap-2 flex-wrap">
            <LiquidButton
              variant="secondary"
              size="sm"
              icon={<Printer size={14} />}
              onClick={() => window.print()}
              className="no-print"
            >
              Print Ledger
            </LiquidButton>
            <LiquidButton
              variant="secondary"
              size="sm"
              icon={<Edit2 size={14} />}
              onClick={() => onOpenAddPersonModal(person)}
            >
              Edit
            </LiquidButton>
            <LiquidButton
              variant="destructive"
              size="sm"
              icon={<Trash2 size={14} />}
              onClick={() => setDeletePersonId(person.id)}
            >
              Delete
            </LiquidButton>
          </div>
        </div>

        {/* Person Header Glass Card */}
        <LiquidGlassCard variant="primary" className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {person.avatar_url ? (
                <img
                  src={person.avatar_url}
                  alt={person.full_name}
                  referrerPolicy="no-referrer"
                  className="w-16 h-16 rounded-3xl object-cover shadow-lg border-2 border-white/80 dark:border-white/20 flex-shrink-0"
                />
              ) : (
                <div
                  className="w-16 h-16 rounded-3xl flex items-center justify-center text-white font-black text-2xl shadow-lg flex-shrink-0"
                  style={{ backgroundColor: person.avatar_color || '#3B82F6' }}
                >
                  {person.full_name.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="space-y-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {person.full_name}
                  </h2>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                    {badge.label}
                  </span>
                  {person.category && (
                    <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20">
                      {person.category}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-1">
                  {person.phone && (
                    <span className="flex items-center gap-1">
                      <Phone size={13} /> {person.phone}
                    </span>
                  )}
                  {person.email && (
                    <span className="flex items-center gap-1">
                      <Mail size={13} /> {person.email}
                    </span>
                  )}
                  {person.address && (
                    <span className="flex items-center gap-1">
                      <MapPin size={13} /> {person.address}
                    </span>
                  )}
                </div>

                {person.notes && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 italic pt-1">
                    "{person.notes}"
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <LiquidButton
                variant="primary"
                size="sm"
                icon={<ArrowUpRight size={15} />}
                onClick={() => onOpenGiveModal(person.id)}
              >
                Give Money
              </LiquidButton>
              <LiquidButton
                variant="emerald"
                size="sm"
                icon={<ArrowDownLeft size={15} />}
                onClick={() => onOpenReturnModal(person.id)}
                disabled={person.remaining_balance <= 0}
              >
                Money Returned
              </LiquidButton>
              <LiquidButton
                variant="secondary"
                size="sm"
                icon={<Bell size={15} className="text-blue-500" />}
                onClick={() => onOpenReminderModal(person.id)}
                disabled={person.remaining_balance <= 0}
              >
                Reminder & AI
              </LiquidButton>
            </div>
          </div>

          {/* 3 Metric Subcards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-black/5 dark:border-white/10">
            <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Given
              </div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                {formatINR(person.total_given)}
              </div>
            </div>

            <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Total Returned
              </div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatINR(person.total_returned)}
              </div>
            </div>

            <div className="p-4 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Remaining Balance
              </div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
                {formatINR(person.remaining_balance)}
              </div>
            </div>
          </div>
        </LiquidGlassCard>

        {/* Transaction History for this Person */}
        <LiquidGlassCard variant="primary" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Receipt size={18} className="text-blue-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Ledger History ({transactions.length})
              </h3>
            </div>
          </div>

          {transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-black/5 dark:border-white/10 text-slate-400 text-[11px] uppercase font-bold tracking-wider">
                    <th className="pb-3 px-3">Date</th>
                    <th className="pb-3 px-3">Type</th>
                    <th className="pb-3 px-3">Method</th>
                    <th className="pb-3 px-3">Purpose & Receipt</th>
                    <th className="pb-3 px-3 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {transactions.map(tx => {
                    const isGiven = tx.transaction_type === 'given';

                    return (
                      <tr key={tx.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatIndianDate(tx.transaction_date)}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              isGiven
                                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            {isGiven ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
                            {isGiven ? 'Given' : 'Returned'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                          {tx.payment_method}
                        </td>
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-xs">
                          <div className="flex items-center gap-2">
                            <span>{tx.purpose || tx.notes || '-'}</span>
                            {tx.receipt_image && (
                              <button
                                type="button"
                                onClick={() => setPreviewReceiptUrl(tx.receipt_image!)}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/20 text-[11px] font-medium cursor-pointer"
                                title="View Receipt Screenshot"
                              >
                                <ImageIcon size={12} />
                                <span>Receipt</span>
                              </button>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 px-3 text-right font-black whitespace-nowrap ${
                          isGiven ? 'text-slate-900 dark:text-white' : 'text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isGiven ? '-' : '+'}{formatINR(tx.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs">
              No transactions recorded for this contact yet.
            </div>
          )}
        </LiquidGlassCard>

        {/* Receipt Image Preview Modal */}
        <LiquidModal
          isOpen={!!previewReceiptUrl}
          onClose={() => setPreviewReceiptUrl(null)}
          title="Attached Receipt / Proof"
          subtitle="Original payment confirmation image"
          maxWidth="md"
        >
          {previewReceiptUrl && (
            <div className="space-y-4">
              <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 max-h-[70vh] flex items-center justify-center bg-black/5">
                <img
                  src={previewReceiptUrl}
                  alt="Receipt Preview"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto max-h-[65vh] object-contain"
                />
              </div>
              <div className="flex justify-end">
                <LiquidButton
                  variant="secondary"
                  size="md"
                  onClick={() => setPreviewReceiptUrl(null)}
                >
                  Close Preview
                </LiquidButton>
              </div>
            </div>
          )}
        </LiquidModal>

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!deletePersonId}
          onClose={() => setDeletePersonId(null)}
          onConfirm={handleDeletePerson}
          title="Delete Person"
          message="Are you sure you want to delete this person? All associated transactions will also be permanently deleted."
          confirmText="Delete Person & Records"
          isLoading={isDeleting}
        />
      </div>
    );
  }

  // Primary Directory View
  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Directory
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            People ({people.length})
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Borrower contacts and personal financial balance profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <LiquidButton
            variant="primary"
            size="sm"
            onClick={() => onOpenAddPersonModal()}
            icon={<UserPlus size={15} />}
          >
            Add Person
          </LiquidButton>
        </div>
      </div>

      {/* Search and Category/Status Filter Bars */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, phone, city, notes..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-2xl liquid-glass-primary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
          />
        </div>

        {/* Status and Category Filter Pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-x-auto pb-1">
          {/* Status Tabs */}
          <LiquidSegmentedControl
            layoutId="people-status-filter"
            size="sm"
            options={[
              { id: 'all', label: 'All Statuses' },
              { id: 'pending', label: 'Pending' },
              { id: 'partial', label: 'Partially Paid' },
              { id: 'paid', label: 'Paid' }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-xs font-semibold px-3 py-1.5 rounded-xl capitalize transition-all cursor-pointer whitespace-nowrap ${
                  categoryFilter === cat
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* People Grid */}
      {filteredPeople.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPeople.map(person => {
            const badge = getStatusBadgeConfig(person.status);

            return (
              <LiquidGlassCard
                key={person.id}
                variant="primary"
                hoverEffect
                onClick={() => setActivePersonId(person.id)}
                className="cursor-pointer space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {person.avatar_url ? (
                        <img
                          src={person.avatar_url}
                          alt={person.full_name}
                          referrerPolicy="no-referrer"
                          className="w-12 h-12 rounded-2xl object-cover shadow-md border border-white/50 flex-shrink-0"
                        />
                      ) : (
                        <div
                          className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md flex-shrink-0"
                          style={{ backgroundColor: person.avatar_color || '#3B82F6' }}
                        >
                          {person.full_name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div>
                        <h4 className="text-base font-bold text-slate-900 dark:text-white">
                          {person.full_name}
                        </h4>
                        <span className="text-xs text-slate-400">
                          {person.category || 'General'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                      {person.status}
                    </span>
                  </div>

                  {/* Financial Balance Summary for Card */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 rounded-2xl liquid-glass-secondary border border-slate-200/50 dark:border-white/5">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Given</div>
                      <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                        {formatINR(person.total_given)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">Pending</div>
                      <div className="text-sm font-black text-rose-600 dark:text-rose-400">
                        {formatINR(person.remaining_balance)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer with view ledger link */}
                <div className="flex items-center justify-between pt-2 border-t border-black/5 dark:border-white/5 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                  <span>View Statement</span>
                  <ChevronRight size={15} />
                </div>
              </LiquidGlassCard>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center rounded-3xl liquid-glass-secondary border border-dashed border-slate-200 dark:border-white/10">
          <Users size={36} className="mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No People Found
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No borrower contacts match your search query.'
              : 'Start by adding a person you lend money to.'}
          </p>
          <div className="mt-4">
            <LiquidButton
              variant="primary"
              size="sm"
              onClick={() => onOpenAddPersonModal()}
              icon={<UserPlus size={15} />}
            >
              Add First Person
            </LiquidButton>
          </div>
        </div>
      )}
    </div>
  );
};
