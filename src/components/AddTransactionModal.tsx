import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { LiquidModal } from './ui/LiquidModal';
import { LiquidButton } from './ui/LiquidButton';
import { LiquidDropdown } from './ui/LiquidDropdown';
import { LiquidDatePicker } from './ui/LiquidDatePicker';
import { LiquidSegmentedControl } from './ui/LiquidSegmentedControl';
import { Person, Transaction, TransactionType, PaymentMethod } from '../types';
import { api } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { formatINR, getFinancialYearFromDate } from '../lib/formatters';
import { ArrowUpRight, ArrowDownLeft, AlertCircle, Sparkles, Camera, Image as ImageIcon, X, CheckCircle2, UserPlus, RefreshCw } from 'lucide-react';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (tx: Transaction) => void;
  initialType?: TransactionType;
  initialPersonId?: string;
  editTransaction?: Transaction | null;
}

const PAYMENT_METHODS: PaymentMethod[] = ['UPI', 'Bank Transfer', 'Cash', 'Other'];

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialType = 'given',
  initialPersonId,
  editTransaction = null
}) => {
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [people, setPeople] = useState<Person[]>([]);
  const [isLoadingPeople, setIsLoadingPeople] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [type, setType] = useState<TransactionType>(initialType);
  const [personId, setPersonId] = useState<string>(initialPersonId || '');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [purpose, setPurpose] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // AI Image Scanner State
  const [isScanning, setIsScanning] = useState(false);
  const [detectedPersonName, setDetectedPersonName] = useState<string | null>(null);
  const [scanSummary, setScanSummary] = useState<string | null>(null);

  // Load people list
  useEffect(() => {
    if (isOpen) {
      setIsLoadingPeople(true);
      setErrorMessage('');
      setScanSummary(null);
      setDetectedPersonName(null);
      api.getPeople()
        .then(data => {
          setPeople(data);
          if (initialPersonId) {
            setPersonId(initialPersonId);
          } else if (!personId && data.length > 0) {
            setPersonId(data[0].id);
          }
        })
        .catch(err => console.error(err))
        .finally(() => setIsLoadingPeople(false));
    }
  }, [isOpen, initialPersonId]);

  // Sync if editing
  useEffect(() => {
    if (editTransaction) {
      setType(editTransaction.transaction_type);
      setPersonId(editTransaction.person_id);
      setAmount(editTransaction.amount.toString());
      setDate(editTransaction.transaction_date);
      setPaymentMethod(editTransaction.payment_method);
      setPurpose(editTransaction.purpose || '');
      setNotes(editTransaction.notes || '');
      setReceiptImage(editTransaction.receipt_image || '');
    } else {
      setType(initialType);
      if (initialPersonId) setPersonId(initialPersonId);
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setPaymentMethod('UPI');
      setPurpose('');
      setNotes('');
      setReceiptImage('');
    }
  }, [editTransaction, initialType, initialPersonId, isOpen]);

  // Scan Receipt or Payment Screenshot to Auto-Fill
  const handleReceiptImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      setErrorMessage('Image size must be less than 8MB.');
      return;
    }

    setIsScanning(true);
    setErrorMessage('');
    setScanSummary(null);
    setDetectedPersonName(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReceiptImage(base64);

      try {
        const result = await api.scanReceiptOrImage(base64, file.type || 'image/jpeg');

        if (result.amount) {
          setAmount(result.amount.toString());
        }
        if (result.transaction_type) {
          setType(result.transaction_type);
        }
        if (result.transaction_date) {
          setDate(result.transaction_date);
        }
        if (result.payment_method) {
          setPaymentMethod(result.payment_method);
        }
        if (result.purpose) {
          setPurpose(result.purpose);
        }
        if (result.notes) {
          setNotes(result.notes);
        }

        // Match or propose person
        if (result.person_name) {
          const matched = people.find(
            p => p.full_name.toLowerCase().includes(result.person_name!.toLowerCase()) ||
                 result.person_name!.toLowerCase().includes(p.full_name.toLowerCase())
          );
          if (matched) {
            setPersonId(matched.id);
            setScanSummary(`Auto-matched person: ${matched.full_name}`);
          } else {
            setDetectedPersonName(result.person_name);
            setScanSummary(`Detected amount ₹${result.amount || ''} for "${result.person_name}".`);
          }
        } else {
          setScanSummary(result.confidence_summary || 'Receipt scanned. Money amount and details auto-filled.');
        }

        showToast('Receipt scanned & fields auto-filled!', 'success');
      } catch (err: any) {
        console.error('Scan error:', err);
        setErrorMessage('Could not auto-scan receipt details. You can enter them manually.');
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Quick-create person from scanned receipt
  const handleCreateScannedPerson = async () => {
    if (!detectedPersonName) return;
    try {
      const newPerson = await api.createPerson({
        full_name: detectedPersonName.trim(),
        category: 'Friends',
        notes: 'Created via receipt scan'
      });
      setPeople(prev => [...prev, newPerson]);
      setPersonId(newPerson.id);
      setDetectedPersonName(null);
      showToast(`Created person "${newPerson.full_name}" and selected in form.`, 'success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create person.');
    }
  };

  const selectedPerson = people.find(p => p.id === personId);
  const currentPending = selectedPerson?.remaining_balance || 0;

  // Validation check
  const numAmount = parseFloat(amount) || 0;
  const isReturnOverLimit = type === 'returned' && !editTransaction && numAmount > currentPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMessage('');

    if (!personId) {
      setErrorMessage('Please select or add a person.');
      return;
    }

    if (isNaN(numAmount) || numAmount <= 0) {
      setErrorMessage('Please enter a valid amount greater than 0.');
      return;
    }

    if (type === 'returned' && !editTransaction && numAmount > currentPending) {
      setErrorMessage(`This return amount (${formatINR(numAmount)}) is greater than the outstanding balance of ${formatINR(currentPending)}.`);
      return;
    }

    if (!date) {
      setErrorMessage('Please select a transaction date.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editTransaction) {
        const updated = await api.updateTransaction(editTransaction.id, {
          person_id: personId,
          transaction_type: type,
          amount: numAmount,
          transaction_date: date,
          payment_method: paymentMethod,
          purpose: purpose.trim(),
          notes: notes.trim(),
          receipt_image: receiptImage
        });
        showToast('Transaction updated successfully.', 'success');
        onSuccess(updated);
        onClose();
      } else {
        const created = await api.createTransaction({
          person_id: personId,
          transaction_type: type,
          amount: numAmount,
          transaction_date: date,
          payment_method: paymentMethod,
          purpose: purpose.trim(),
          notes: notes.trim(),
          ...(receiptImage ? { receipt_image: receiptImage } : {})
        });

        // Confetti celebration on full payoff
        if (type === 'returned' && numAmount === currentPending && currentPending > 0) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 }
          });
          showToast(`Outstanding balance for ${selectedPerson?.full_name} is now fully cleared! 🎉`, 'success');
        } else {
          showToast(
            type === 'given' ? 'Money given recorded successfully.' : 'Return payment recorded successfully.',
            'success'
          );
        }

        onSuccess(created);
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedFy = getFinancialYearFromDate(date || new Date().toISOString().split('T')[0]);

  return (
    <LiquidModal
      isOpen={isOpen}
      onClose={onClose}
      title={editTransaction ? 'Edit Transaction' : type === 'given' ? 'Record Money Given' : 'Record Money Returned'}
      subtitle={editTransaction ? `Transaction ID: ${editTransaction.id}` : 'Transaction will update real-time financial ledger'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type Toggle */}
        {!editTransaction && (
          <div className="flex justify-center mb-2">
            <LiquidSegmentedControl<TransactionType>
              layoutId="tx-type-capsule"
              options={[
                { id: 'given', label: 'Give Money', icon: <ArrowUpRight size={15} /> },
                { id: 'returned', label: 'Money Returned', icon: <ArrowDownLeft size={15} /> }
              ]}
              value={type}
              onChange={setType}
              size="md"
            />
          </div>
        )}

        {/* AI Receipt / Screenshot Scanner Dropzone */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-teal-500/10 border border-blue-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                {isScanning ? <RefreshCw size={16} className="animate-spin" /> : <Sparkles size={16} />}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <span>Scan Image / Receipt to Fill Money</span>
                  <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-semibold">
                    AI Auto-Fill
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Upload UPI screenshot (GPay/PhonePe), bank receipt, or bill
                </div>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReceiptImageUpload}
            />

            <button
              type="button"
              disabled={isScanning}
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <Camera size={14} />
              <span>{receiptImage ? 'Re-scan Image' : 'Upload & Auto-Fill'}</span>
            </button>
          </div>

          {/* Image preview & scan status */}
          {receiptImage && (
            <div className="mt-2.5 pt-2.5 border-t border-blue-500/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  referrerPolicy="no-referrer"
                  className="w-10 h-10 rounded-lg object-cover border border-blue-400 shadow-sm"
                />
                <div className="text-xs text-slate-700 dark:text-slate-200">
                  <div className="font-medium flex items-center gap-1">
                    <CheckCircle2 size={13} className="text-emerald-500" />
                    <span>Receipt image attached</span>
                  </div>
                  {scanSummary && (
                    <div className="text-[11px] text-blue-600 dark:text-blue-300 font-medium">
                      {scanSummary}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setReceiptImage('');
                  setScanSummary(null);
                  setDetectedPersonName(null);
                }}
                className="text-xs text-rose-500 hover:underline cursor-pointer"
              >
                Remove
              </button>
            </div>
          )}

          {/* Quick-add detected person prompt */}
          {detectedPersonName && (
            <div className="mt-2.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-center justify-between">
              <span className="text-amber-800 dark:text-amber-200">
                Receipt detected person: <strong>{detectedPersonName}</strong>
              </span>
              <button
                type="button"
                onClick={handleCreateScannedPerson}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer shadow-sm"
              >
                <UserPlus size={13} />
                <span>Add "{detectedPersonName}"</span>
              </button>
            </div>
          )}
        </div>

        {/* Person Selector */}
        <div>
          <LiquidDropdown<string>
            label="Person *"
            placeholder={isLoadingPeople ? 'Loading people...' : people.length === 0 ? 'No people yet (add one first)' : 'Select person'}
            options={people.map(p => ({
              value: p.id,
              label: p.full_name,
              sublabel: `Pending: ${formatINR(p.remaining_balance)} (${p.status})`
            }))}
            value={personId}
            onChange={v => setPersonId(v)}
            disabled={isLoadingPeople}
          />
          {selectedPerson && (
            <div className="mt-1.5 flex items-center justify-between text-xs px-1 text-slate-500 dark:text-slate-400">
              <span>Current Outstanding: <strong className="text-slate-800 dark:text-slate-100 font-semibold">{formatINR(selectedPerson.remaining_balance)}</strong></span>
              <span>Category: {selectedPerson.category || 'General'}</span>
            </div>
          )}
        </div>

        {/* Amount Input with Live Preview */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Amount (INR ₹) *
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
              ₹
            </span>
            <input
              type="number"
              step="any"
              min="1"
              required
              placeholder="0.00"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full pl-9 pr-24 py-3 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white font-semibold text-lg glass-input transition-all"
            />
            {numAmount > 0 && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg">
                {formatINR(numAmount)}
              </div>
            )}
          </div>

          {/* Return amount helper limit */}
          {type === 'returned' && (
            <div className="mt-1.5 flex items-center justify-between text-xs px-1">
              <span className="text-slate-500">Max returnable: {formatINR(currentPending)}</span>
              {currentPending > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(currentPending.toString())}
                  className="text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                >
                  Pay Full Balance
                </button>
              )}
            </div>
          )}
        </div>

        {/* Date and Payment Method in 2 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <LiquidDatePicker
            label="Transaction Date *"
            value={date}
            onChange={setDate}
          />

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
              Payment Method
            </label>
            <LiquidDropdown<PaymentMethod>
              options={PAYMENT_METHODS.map(m => ({ value: m, label: m }))}
              value={paymentMethod}
              onChange={setPaymentMethod}
            />
          </div>
        </div>

        {/* Auto period badge */}
        <div className="text-[11px] text-slate-400 px-1">
          Auto-mapped Financial Period: <span className="text-slate-600 dark:text-slate-300 font-medium">{calculatedFy}</span>
        </div>

        {/* Purpose / Reason */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Purpose / Description (Optional)
          </label>
          <input
            type="text"
            placeholder={type === 'given' ? 'e.g. Medical emergency advance, laptop repair' : 'e.g. First instalment return, full settlement'}
            value={purpose}
            onChange={e => setPurpose(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input transition-all"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
            Additional Notes / Transaction Ref (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="UPI reference number, bank receipt ID, or repayment terms..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm glass-input resize-none transition-all"
          />
        </div>

        {/* Error message banner */}
        {(errorMessage || isReturnOverLimit) && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs">
            <AlertCircle size={16} className="flex-shrink-0" />
            <span>{errorMessage || `Return amount (${formatINR(numAmount)}) exceeds outstanding balance (${formatINR(currentPending)}).`}</span>
          </div>
        )}

        {/* Footer Actions */}
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
            variant={type === 'given' ? 'primary' : 'emerald'}
            size="md"
            isLoading={isSubmitting}
            disabled={isReturnOverLimit}
          >
            {editTransaction ? 'Save Changes' : type === 'given' ? 'Save Money Given' : 'Record Return'}
          </LiquidButton>
        </div>
      </form>
    </LiquidModal>
  );
};
