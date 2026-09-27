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
  Printer
} from 'lucide-react';
import { Person } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';

type QrMode = 'summary' | 'upi' | 'vcard';

interface PersonQrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
}

export const PersonQrCodeModal: React.FC<PersonQrCodeModalProps> = ({
  isOpen,
  onClose,
  person
}) => {
  const { formatAmount } = useCurrency();
  const { showToast } = useToast();
  const [qrMode, setQrMode] = useState<QrMode>('summary');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upiId, setUpiId] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  // Generate QR string based on mode
  const getQrPayload = (): string => {
    if (!person) return '';

    const net = Number(person.net_balance ?? person.remaining_balance) || 0;
    const given = Number(person.total_given) || 0;
    const returned = Number(person.total_returned) || 0;
    const statusText =
      net > 0 ? 'Receivable (They owe you)' : net < 0 ? 'Payable (You owe them)' : 'Settled';

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
      const amount = Math.abs(net) > 0 ? Math.abs(net).toFixed(2) : '';
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
        dark: '#0f172a',
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
  }, [isOpen, person, qrMode, upiId]);

  if (!isOpen || !person) return null;

  const netBalance = Number(person.net_balance ?? person.remaining_balance) || 0;
  const isOwed = netBalance > 0;
  const isSettled = netBalance === 0;

  const handleCopyText = async () => {
    const payload = getQrPayload();
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      showToast('QR payload content copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy text', 'error');
    }
  };

  const handleDownloadImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `${person.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR code saved as PNG image', 'success');
  };

  const handleShare = async () => {
    if (!qrDataUrl) return;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${person.full_name} - Balance & Contact QR`,
          text: getQrPayload()
        });
      } else {
        handleCopyText();
      }
    } catch {
      // Ignored if cancelled
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <QrCode size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Contact & Ledger QR Code
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Scan with any phone camera or UPI payment app
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
        <div className="p-3 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-white/5 flex gap-1">
          <button
            type="button"
            onClick={() => setQrMode('summary')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              qrMode === 'upi'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <CreditCard size={13} />
            <span>UPI Payment</span>
          </button>
          <button
            type="button"
            onClick={() => setQrMode('vcard')}
            className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {person.full_name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                {person.phone && (
                  <span className="flex items-center gap-1">
                    <Phone size={11} />
                    <span>{person.phone}</span>
                  </span>
                )}
                {person.category && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-200/60 dark:bg-slate-700/60">
                    {person.category}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {isOwed ? 'To Receive' : netBalance < 0 ? 'To Pay' : 'Settled'}
              </div>
              <div
                className={`text-sm font-bold ${
                  isOwed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isSettled
                    ? 'text-slate-500'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {formatAmount(Math.abs(netBalance))}
              </div>
            </div>
          </div>

          {/* UPI Custom ID Input when in UPI Mode */}
          {qrMode === 'upi' && (
            <div className="space-y-1.5 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
              <label className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                <CreditCard size={13} />
                <span>UPI ID / VPA Address:</span>
              </label>
              <input
                type="text"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder={person.phone ? `${person.phone.replace(/[^0-9]/g, '')}@upi` : 'e.g. mobile@paytm or upiid@okhdfcbank'}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <p className="text-[10px] text-emerald-700 dark:text-emerald-400/80">
                Scanning this QR in Google Pay, PhonePe, or Paytm auto-fills ₹{Math.abs(netBalance).toLocaleString('en-IN')} for instant settlement.
              </p>
            </div>
          )}

          {/* QR Code Display Canvas Container */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-inner">
            {isGenerating ? (
              <div className="w-56 h-56 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : qrDataUrl ? (
              <div className="relative group flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt={`QR code for ${person.full_name}`}
                  className="w-56 h-56 object-contain rounded-lg transition-transform group-hover:scale-[1.02]"
                />
                <div className="mt-2 text-center">
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                    {qrMode === 'summary' ? 'Contact Ledger Badge' : qrMode === 'upi' ? 'UPI Pay Link' : 'vCard 3.0'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="w-56 h-56 flex items-center justify-center text-xs text-slate-400">
                Unable to generate QR code
              </div>
            )}
          </div>

          {/* Quick Info text */}
          <p className="text-center text-[11px] text-slate-500 dark:text-slate-400 px-2">
            {qrMode === 'summary' && 'Displays contact ledger balance, total given, and return status.'}
            {qrMode === 'upi' && 'Instant Indian UPI payment link with pre-filled amount.'}
            {qrMode === 'vcard' && 'Opens phone dialer and address book to save contact.'}
          </p>
        </div>

        {/* Action Buttons Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleCopyText}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 cursor-pointer transition-colors"
              title="Copy QR Content"
            >
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 cursor-pointer transition-colors"
              title="Share"
            >
              <Share2 size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadImage}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer transition-colors"
            >
              <Download size={14} />
              <span>Save PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold cursor-pointer transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
