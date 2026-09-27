import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  Phone,
  Mail,
  CreditCard,
  User,
  ExternalLink,
  Printer,
  ArrowDownLeft,
  DollarSign,
  Link,
  Play
} from 'lucide-react';
import { Person } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';

type QrMode = 'return_request' | 'summary' | 'upi' | 'vcard';

interface PersonQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  onTriggerReturn?: (personId: string, amount?: string, notes?: string) => void;
}

export const PersonQrCodeModal: React.FC<PersonQrCodeModalProps> = ({
  isOpen,
  onClose,
  person,
  onTriggerReturn
}) => {
  const { formatAmount, currencySymbol } = useCurrency();
  const { showToast } = useToast();
  const [qrMode, setQrMode] = useState<QrMode>('return_request');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upiId, setUpiId] = useState('');
  
  // Return Deep-Link State
  const [returnAmount, setReturnAmount] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize return amount with person's current balance
  useEffect(() => {
    if (person) {
      const net = Number(person.net_balance ?? person.remaining_balance) || 0;
      setReturnAmount(net > 0 ? net.toString() : '');
      setReturnNotes(`Repayment from ${person.full_name}`);
    }
  }, [person]);

  // Generate deep-link URL for Return request
  const getReturnDeepLinkUrl = (): string => {
    if (!person) return '';
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams();
    params.set('action', 'return');
    params.set('personId', person.id);
    if (returnAmount && Number(returnAmount) > 0) {
      params.set('amount', returnAmount.trim());
    }
    if (person.full_name) {
      params.set('name', person.full_name.trim());
    }
    if (returnNotes) {
      params.set('notes', returnNotes.trim());
    }
    return `${origin}/?${params.toString()}`;
  };

  // Generate QR string based on mode
  const getQrPayload = (): string => {
    if (!person) return '';

    const net = Number(person.net_balance ?? person.remaining_balance) || 0;
    const given = Number(person.total_given) || 0;
    const returned = Number(person.total_returned) || 0;
    const statusText =
      net > 0 ? 'Receivable (They owe you)' : net < 0 ? 'Payable (You owe them)' : 'Settled';

    if (qrMode === 'return_request') {
      return getReturnDeepLinkUrl();
    }

    if (qrMode === 'summary') {
      return [
        `--- FINANCIAL RECORD: ${person.full_name.toUpperCase()} ---`,
        person.phone ? `Phone: ${person.phone}` : null,
        person.email ? `Email: ${person.email}` : null,
        person.category ? `Category: ${person.category}` : null,
        `Status: ${person.status || 'Active'} [${statusText}]`,
        `Net Balance: ${formatAmount(Math.abs(net))}`,
        `Total Given: ${formatAmount(given)}`,
        `Total Returned: ${formatAmount(returned)}`,
        `Generated: ${new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}`,
        `Security: Verified Personal Vault Record`
      ]
        .filter(Boolean)
        .join('\n');
    }

    if (qrMode === 'upi') {
      const activeUpiId = upiId.trim() || (person.phone ? `${person.phone.replace(/[^0-9]/g, '')}@upi` : '');
      const encodedName = encodeURIComponent(person.full_name);
      const amount = returnAmount || (Math.abs(net) > 0 ? Math.abs(net).toFixed(2) : '');
      return `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodedName}${amount ? `&am=${amount}` : ''}&cu=INR&tn=${encodeURIComponent('FinancialFree Settlement')}`;
    }

    if (qrMode === 'vcard') {
      const names = person.full_name.trim().split(' ');
      const firstName = names[0] || '';
      const lastName = names.slice(1).join(' ') || '';
      return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `N:${lastName};${firstName};;;`,
        `FN:${person.full_name}`,
        person.phone ? `TEL;TYPE=CELL:${person.phone}` : null,
        person.email ? `EMAIL:${person.email}` : null,
        person.address ? `ADR;TYPE=HOME:;;${person.address};;;;` : null,
        person.notes ? `NOTE:${person.notes}` : null,
        'END:VCARD'
      ]
        .filter(Boolean)
        .join('\n');
    }

    return person.full_name;
  };

  useEffect(() => {
    if (!isOpen || !person) return;

    let isMounted = true;
    setIsGenerating(true);

    const payload = getQrPayload();

    QRCode.toDataURL(payload, {
      width: 480,
      margin: 2,
      color: {
        dark: qrMode === 'return_request' ? '#065f46' : '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) {
          setQrDataUrl(url);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to render QR Code:', err);
        if (isMounted) {
          setIsGenerating(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, person, qrMode, upiId, returnAmount, returnNotes]);

  if (!isOpen || !person) return null;

  const netBalance = Number(person.net_balance ?? person.remaining_balance) || 0;
  const isOwed = netBalance > 0;
  const isSettled = netBalance === 0;

  const handleCopyText = async () => {
    const payload = getQrPayload();
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      showToast(
        qrMode === 'return_request'
          ? 'Pre-fill Return deep link copied to clipboard!'
          : 'QR content copied to clipboard!',
        'success'
      );
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    const prefix = qrMode === 'return_request' ? 'return_request' : 'contact';
    a.download = `${person.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${prefix}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR code saved as PNG image', 'success');
  };

  const handleShare = async () => {
    const payload = getQrPayload();
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Return Repayment Request for ${person.full_name}`,
          text: `Scan or click this link to record a return repayment in FinancialFree: ${payload}`,
          url: qrMode === 'return_request' ? payload : undefined
        });
      } else {
        handleCopyText();
      }
    } catch {
      // Ignored if cancelled
    }
  };

  const handleTestReturnInApp = () => {
    onClose();
    if (onTriggerReturn) {
      onTriggerReturn(person.id, returnAmount, returnNotes);
    } else {
      // Trigger via URL
      window.location.href = getReturnDeepLinkUrl();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                QR Code & Return Deep Link
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Pre-fill transactions or share contact ledger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-2 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-white/5 grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setQrMode('return_request')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              qrMode === 'return_request'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <ArrowDownLeft size={13} />
            <span>Return QR</span>
          </button>
          <button
            type="button"
            onClick={() => setQrMode('summary')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              qrMode === 'summary'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <User size={13} />
            <span>Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setQrMode('upi')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              qrMode === 'upi'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard size={13} />
            <span>UPI Pay</span>
          </button>
          <button
            type="button"
            onClick={() => setQrMode('vcard')}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer ${
              qrMode === 'vcard'
                ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Phone size={13} />
            <span>vCard</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4" ref={printRef}>
          {/* Person summary banner */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {person.full_name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                {person.phone && <span>{person.phone}</span>}
                {person.category && (
                  <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 dark:bg-white/10 text-[10px]">
                    {person.category}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Current Balance</div>
              <div
                className={`text-sm font-black ${
                  isOwed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isSettled
                    ? 'text-slate-500'
                    : 'text-amber-500'
                }`}
              >
                {formatAmount(Math.abs(netBalance))}
              </div>
            </div>
          </div>

          {/* Return Request Deep-Link Controls */}
          {qrMode === 'return_request' && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <ArrowDownLeft size={14} className="text-emerald-600" />
                  <span>Pre-Fill Return Transaction Deep Link</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold">
                  Deep-Link Active
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Return Amount ({currencySymbol})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={returnAmount}
                    onChange={(e) => setReturnAmount(e.target.value)}
                    placeholder="Enter return amount"
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400">
                    Repayment Note
                  </label>
                  <input
                    type="text"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="e.g. Loan return"
                    className="w-full mt-1 px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/90 leading-tight">
                Scanning this QR code on any device automatically opens FinancialFree with a pre-filled <strong>Return (Repayment)</strong> for {person.full_name}.
              </p>
            </div>
          )}

          {/* QR Code Canvas Display */}
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/10 shadow-inner">
            {isGenerating ? (
              <div className="w-56 h-56 flex items-center justify-center text-slate-400">
                <span className="text-xs">Generating QR Code...</span>
              </div>
            ) : qrDataUrl ? (
              <div className="relative group p-2 bg-white rounded-xl shadow-md">
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${person.full_name}`}
                  className="w-56 h-56 object-contain rounded-lg"
                />
                <div className="absolute inset-x-0 bottom-3 text-center">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-900/85 text-white shadow-xs">
                    {qrMode === 'return_request' ? 'Scan to Pre-Fill Return' : 'Scan with Camera'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Deep-link snippet preview for return_request mode */}
            {qrMode === 'return_request' && (
              <div className="w-full mt-3 p-2 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-600 dark:text-slate-400 break-all select-all">
                {getReturnDeepLinkUrl()}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              <span>{copied ? 'Copied!' : qrMode === 'return_request' ? 'Copy Deep Link' : 'Copy Payload'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadImage}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Save PNG</span>
            </button>

            <button
              type="button"
              onClick={handleShare}
              className="py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share QR / Link</span>
            </button>

            {qrMode === 'return_request' ? (
              <button
                type="button"
                onClick={handleTestReturnInApp}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Play size={13} fill="white" />
                <span>Test Return Now</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setQrMode('return_request')}
                className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <ArrowDownLeft size={14} />
                <span>Return Deep Link</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
