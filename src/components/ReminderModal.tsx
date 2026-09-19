import React, { useState, useEffect } from 'react';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidButton } from './ui/LiquidButton';
import { LiquidDatePicker } from './ui/LiquidDatePicker';
import { LiquidDropdown } from './ui/LiquidDropdown';
import { Person, Reminder } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { formatINR, formatIndianDate } from '../lib/formatters';
import { Bell, Sparkles, MessageCircle, Copy, Check, Calendar } from 'lucide-react';

interface ReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialPersonId?: string;
}

export const ReminderModal: React.FC<ReminderModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialPersonId
}) => {
  const { showToast } = useToast();
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState(initialPersonId || '');
  const [reminderDate, setReminderDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraftingAi, setIsDraftingAi] = useState(false);
  const [aiDraft, setAiDraft] = useState('');
  const [tone, setTone] = useState<'friendly' | 'polite' | 'formal'>('friendly');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.getPeople({ status: 'Pending' })
        .then(data => {
          // Filter to people with pending balance
          const pendingPeople = data.filter(p => (p.remaining_balance || 0) > 0);
          setPeople(pendingPeople);
          if (initialPersonId) {
            setPersonId(initialPersonId);
          } else if (pendingPeople.length > 0 && !personId) {
            setPersonId(pendingPeople[0].id);
          }
        })
        .catch(err => console.error(err));
    }
  }, [isOpen, initialPersonId]);

  const selectedPerson = people.find(p => p.id === personId);
  const pendingAmount = selectedPerson?.remaining_balance || 0;

  const handleGenerateDraft = async (chosenTone: 'friendly' | 'polite' | 'formal' = tone) => {
    if (!personId) return;
    setIsDraftingAi(true);
    try {
      const res = await api.draftReminder(personId, chosenTone);
      setAiDraft(res.message);
      if (res.suggestedDate) {
        setReminderDate(res.suggestedDate);
      }
      showToast('AI draft message generated!', 'info');
    } catch (err: any) {
      showToast('Failed to generate draft message', 'error');
    } finally {
      setIsDraftingAi(false);
    }
  };

  const handleCopyDraft = () => {
    if (!aiDraft) return;
    navigator.clipboard.writeText(aiDraft);
    setCopied(true);
    showToast('Message copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!aiDraft || !selectedPerson) return;
    const cleanPhone = selectedPerson.phone.replace(/[^0-9]/g, '');
    const encoded = encodeURIComponent(aiDraft);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!personId) {
      showToast('Please select a person with a pending balance', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createReminder({
        person_id: personId,
        reminder_date: reminderDate,
        note: (note.trim() || aiDraft.trim())
      });
      showToast('Reminder scheduled successfully.', 'success');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to create reminder', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={onClose}
      title="Payment Reminder & Message Drafter"
      subtitle="Schedule follow-up reminder and generate considerate message"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Person Selector */}
        <div>
          <LiquidDropdown
            label="Select Borrower"
            placeholder={people.length === 0 ? 'No borrowers with pending balances' : 'Select person'}
            options={people.map(p => ({
              value: p.id,
              label: p.full_name,
              sublabel: `Pending: ${formatINR(p.remaining_balance)}`
            }))}
            value={personId}
            onChange={v => setPersonId(v)}
          />
        </div>

        {selectedPerson && (
          <div className="p-3.5 rounded-2xl liquid-glass-secondary border border-slate-200/60 dark:border-white/10 flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-500">Outstanding Balance</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400">
                {formatINR(pendingAmount)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Contact</div>
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {selectedPerson.phone || 'No phone recorded'}
              </div>
            </div>
          </div>
        )}

        {/* Reminder Date */}
        <LiquidDatePicker
          label="Reminder Date"
          value={reminderDate}
          onChange={setReminderDate}
        />

        {/* AI Draft Message Generator */}
        <div className="p-4 rounded-2xl liquid-glass-secondary border border-blue-500/20 bg-blue-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              <Sparkles size={14} />
              <span>AI Message Drafter (Gemini)</span>
            </div>
            <div className="flex items-center gap-1">
              {(['friendly', 'polite', 'formal'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setTone(t);
                    handleGenerateDraft(t);
                  }}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize transition-colors ${
                    tone === t
                      ? 'bg-blue-600 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {aiDraft ? (
            <div className="space-y-2">
              <div className="p-3 rounded-xl bg-white/80 dark:bg-black/30 border border-black/5 dark:border-white/10 text-xs text-slate-800 dark:text-slate-100 leading-relaxed font-sans">
                {aiDraft}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyDraft}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-white text-slate-700 dark:text-slate-200 cursor-pointer border border-black/5"
                >
                  {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  <span>{copied ? 'Copied' : 'Copy Text'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenWhatsApp}
                  className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-sm"
                >
                  <MessageCircle size={13} />
                  <span>Send via WhatsApp</span>
                </button>
              </div>
            </div>
          ) : (
            <LiquidButton
              type="button"
              variant="secondary"
              size="sm"
              icon={<Sparkles size={14} className="text-blue-500" />}
              onClick={() => handleGenerateDraft(tone)}
              isLoading={isDraftingAi}
              disabled={!personId}
              className="w-full"
            >
              Draft WhatsApp Reminder with AI
            </LiquidButton>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Internal Note / Follow-up Details (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="e.g. Call after month-end salary credit or festival week"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-black/5 dark:border-white/10">
          <LiquidButton
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </LiquidButton>
          <LiquidButton
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSubmitting}
            disabled={!personId || people.length === 0}
          >
            Schedule Reminder
          </LiquidButton>
        </div>
      </form>
    </LiquidModal>
  );
};
