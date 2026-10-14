import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  QrCode,
  Download,
  Copy,
  Check,
  Share2,
  ExternalLink,
  FileText,
  Link,
  Smartphone,
  CreditCard,
  Zap,
  Globe,
  Send,
  MessageSquare,
  ArrowUpRight,
  HandCoins
} from 'lucide-react';
import { Person } from '../../types';
import { useCurrency } from '../../context/CurrencyContext';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { exportPublicSharePdf } from '../../lib/pdfExport';

type QrTab = 'request_money' | 'pay_upi' | 'public_share';

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
  const { user } = useAuth();
  const { formatAmount, currencySymbol } = useCurrency();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<QrTab>('request_money');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Tab 1: Payment Request (Take / Request Money from person)
  const [requestAmount, setRequestAmount] = useState<string>('');
  const [myUpiId, setMyUpiId] = useState<string>(() => {
    try {
      return localStorage.getItem('ff_user_receiving_upi') || '';
    } catch {
      return '';
    }
  });
  const [myPayeeName, setMyPayeeName] = useState<string>(() => {
    return user?.name || 'FinancialFree User';
  });
  const [requestMessage, setRequestMessage] = useState<string>('');
  const [reqCopied, setReqCopied] = useState(false);

  // Tab 2: Pay via UPI ID (Send Money to person)
  const [recipientUpiId, setRecipientUpiId] = useState('');
  const [payeeName, setPayeeName] = useState('');
  const [returnAmount, setReturnAmount] = useState<string>('');
  const [returnNotes, setReturnNotes] = useState<string>('');

  // Tab 3: Public Share Link State
  const [shareId, setShareId] = useState<string>('');
  const [shareUrl, setShareUrl] = useState<string>('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  // Initialize values dynamically when modal opens
  useEffect(() => {
    if (person) {
      const net = Number(person.net_balance ?? person.remaining_balance) || 0;
      const absNet = Math.abs(net);

      // Default active tab: if person owes money, default to request_money; if user owes, default to pay_upi
      if (net > 0) {
        setActiveTab('request_money');
      } else if (net < 0) {
        setActiveTab('pay_upi');
      } else {
        setActiveTab('request_money');
      }

      // Initialize Request Money state
      setRequestAmount(absNet > 0 ? absNet.toString() : '');
      setRequestMessage(`Hi ${person.full_name}, kindly settle ₹${absNet > 0 ? absNet : ''} on FinancialFree.`);

      // Initialize Pay via UPI ID state
      setReturnAmount(absNet > 0 ? absNet.toString() : '');
      setPayeeName(person.full_name);
      setReturnNotes(`Settlement payment for ${person.full_name}`);

      // Auto-extract phone-based UPI if valid 10 digits, otherwise leave clean empty (no mock/demo)
      if (person.phone) {
        const cleanPhone = person.phone.replace(/[^0-9]/g, '');
        if (cleanPhone.length >= 10) {
          setRecipientUpiId(`${cleanPhone.slice(-10)}@upi`);
        } else {
          setRecipientUpiId('');
        }
      } else {
        setRecipientUpiId('');
      }

      // Generate verified public share record
      generateShareRecord(person);
    }
  }, [person]);

  // Persist user's receiving UPI ID
  const handleUpdateMyUpiId = (val: string) => {
    setMyUpiId(val);
    try {
      localStorage.setItem('ff_user_receiving_upi', val.trim());
    } catch {}
  };

  const generateShareRecord = async (targetPerson: Person) => {
    try {
      setIsCreatingShare(true);
      const net = Number(targetPerson.net_balance ?? targetPerson.remaining_balance) || 0;
      const given = Number(targetPerson.total_given) || 0;
      const returned = Number(targetPerson.total_returned) || 0;

      let realTransactions: any[] = [];
      try {
        const allTxs = await api.getTransactions();
        realTransactions = (allTxs || [])
          .filter(t => t.person_id === targetPerson.id)
          .map(t => ({
            id: t.id,
            date: t.transaction_date,
            type: t.transaction_type,
            amount: t.amount,
            notes: t.notes || ''
          }));
      } catch (e) {
        console.warn('Failed to load transaction details for share:', e);
      }

      const res = await api.createPublicShare({
        personId: targetPerson.id,
        personName: targetPerson.full_name,
        totalGiven: given,
        totalReturned: returned,
        netBalance: net,
        currency: 'INR',
        note: `Verified statement of money given & taken for ${targetPerson.full_name}`,
        transactions: realTransactions
      });

      if (res && res.shareId) {
        setShareId(res.shareId);
        const resolvedUrl = `${window.location.origin}/share/${res.shareId}`;
        setShareUrl(resolvedUrl);
      }
    } catch (err) {
      console.warn('Share creation note:', err);
      const fallbackId = `share_${targetPerson.id.replace(/[^a-zA-Z0-9]/g, '')}`;
      setShareId(fallbackId);
      setShareUrl(`${window.location.origin}/share/${fallbackId}`);
    } finally {
      setIsCreatingShare(false);
    }
  };

  // Build UPI URI for Requesting Money (to your own UPI ID)
  const getRequestUpiUri = (): string => {
    const cleanUpi = myUpiId.trim() || 'user@upi';
    const cleanName = myPayeeName.trim() || user?.name || 'Receiver';
    const cleanAmount = requestAmount.trim() ? parseFloat(requestAmount) : 0;
    const cleanNote = requestMessage.trim() || `Payment request for ${person?.full_name || 'settlement'}`;

    let uri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}`;
    if (cleanAmount > 0) {
      uri += `&am=${cleanAmount.toFixed(2)}`;
    }
    uri += `&tn=${encodeURIComponent(cleanNote)}&cu=INR`;
    return uri;
  };

  // Build UPI URI for Paying / Sending Money (to person's UPI ID)
  const getPayUpiUri = (): string => {
    const cleanUpi = recipientUpiId.trim() || (person?.phone ? `${person.phone.replace(/[^0-9]/g, '').slice(-10)}@upi` : 'user@upi');
    const cleanName = payeeName.trim() || person?.full_name || 'Recipient';
    const cleanAmount = returnAmount.trim() ? parseFloat(returnAmount) : 0;
    const cleanNote = returnNotes.trim() || 'Settlement payment';

    let uri = `upi://pay?pa=${encodeURIComponent(cleanUpi)}&pn=${encodeURIComponent(cleanName)}`;
    if (cleanAmount > 0) {
      uri += `&am=${cleanAmount.toFixed(2)}`;
    }
    uri += `&tn=${encodeURIComponent(cleanNote)}&cu=INR`;
    return uri;
  };

  // Active payload to render inside QR code
  const getQrPayload = (): string => {
    if (activeTab === 'request_money') {
      return getRequestUpiUri();
    }
    if (activeTab === 'pay_upi') {
      return getPayUpiUri();
    }
    return shareUrl || `${window.location.origin}/share/${shareId || 'ledger'}`;
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
        dark: activeTab === 'request_money' ? '#d97706' : activeTab === 'pay_upi' ? '#047857' : '#1e293b',
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
  }, [isOpen, person, activeTab, myUpiId, myPayeeName, requestAmount, requestMessage, recipientUpiId, payeeName, returnAmount, returnNotes, shareUrl]);

  if (!isOpen || !person) return null;

  const netBalance = Number(person.net_balance ?? person.remaining_balance) || 0;
  const isOwed = netBalance > 0;
  const isSettled = netBalance === 0;

  // Launch installed UPI apps with UPI ID
  const handleLaunchUpiChooser = (mode: 'request' | 'pay') => {
    const uri = mode === 'request' ? getRequestUpiUri() : getPayUpiUri();
    window.location.href = uri;
    showToast('Opening installed UPI apps (GPay, PhonePe, Paytm, BHIM)...', 'info');
  };

  // WhatsApp payment request share
  const handleSendWhatsAppRequest = () => {
    const cleanPhone = person.phone ? person.phone.replace(/[^0-9]/g, '') : '';
    const uri = getRequestUpiUri();
    const fullText = `${requestMessage}\n\n👉 Pay via UPI: ${uri}`;
    const url = cleanPhone.length >= 10
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(fullText)}`
      : `https://wa.me/?text=${encodeURIComponent(fullText)}`;
    window.open(url, '_blank');
    showToast('Opening WhatsApp to send payment request...', 'success');
  };

  // SMS payment request share
  const handleSendSmsRequest = () => {
    const cleanPhone = person.phone ? person.phone.replace(/[^0-9+]/g, '') : '';
    const uri = getRequestUpiUri();
    const fullText = `${requestMessage}\n\nPay via UPI: ${uri}`;
    const url = cleanPhone ? `sms:${cleanPhone}?body=${encodeURIComponent(fullText)}` : `sms:?body=${encodeURIComponent(fullText)}`;
    window.location.href = url;
    showToast('Opening SMS messaging to send payment request...', 'info');
  };

  const handleCopyRequestMessage = async () => {
    const uri = getRequestUpiUri();
    const fullText = `${requestMessage}\n\nPay via UPI: ${uri}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setReqCopied(true);
      showToast('Payment request message and UPI link copied!', 'success');
      setTimeout(() => setReqCopied(false), 2000);
    } catch {
      showToast('Failed to copy message', 'error');
    }
  };

  const handleCopyUpiLink = async () => {
    const payload = activeTab === 'request_money' ? getRequestUpiUri() : getPayUpiUri();
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      showToast('UPI payment URI copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Failed to copy link', 'error');
    }
  };

  const handleCopyShareLink = async () => {
    const link = shareUrl || `${window.location.origin}/share/${shareId || 'ledger'}`;
    try {
      await navigator.clipboard.writeText(link);
      setShareCopied(true);
      showToast(`Public statement link copied: ${link}`, 'success');
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      showToast('Failed to copy share link', 'error');
    }
  };

  const handleDownloadQrImage = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    const prefix = activeTab === 'request_money' ? 'payment_request' : activeTab === 'pay_upi' ? 'pay_upi' : 'statement_share';
    a.download = `${person.full_name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${prefix}_qr.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR code saved as PNG image', 'success');
  };

  const handleDownloadPdf = () => {
    exportPublicSharePdf({
      shareId: shareId || 'ledger',
      personName: person.full_name,
      totalGiven: Number(person.total_given) || 0,
      totalReturned: Number(person.total_returned) || 0,
      netBalance,
      currency: 'INR',
      status: isOwed ? 'receivable' : netBalance < 0 ? 'payable' : 'settled',
      transactions: [],
      createdAt: new Date().toISOString()
    });
    showToast('Public statement PDF downloaded', 'success');
  };

  const handleNativeShare = async () => {
    const targetUrl = activeTab === 'request_money'
      ? getRequestUpiUri()
      : activeTab === 'pay_upi'
      ? getPayUpiUri()
      : (shareUrl || `${window.location.origin}/share/${shareId}`);
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share({
          title: `FinancialFree: ${person.full_name}`,
          text: activeTab === 'request_money'
            ? `${requestMessage} Pay via: ${targetUrl}`
            : `Verified statement of money given & taken for ${person.full_name}: ${targetUrl}`,
          url: targetUrl
        });
        showToast('Shared successfully!', 'success');
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
    }

    try {
      await navigator.clipboard.writeText(targetUrl);
      showToast(`Link copied to clipboard: ${targetUrl}`, 'success');
    } catch {
      showToast('Link: ' + targetUrl, 'info');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white/95 dark:bg-slate-900/95 border border-white/80 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 bg-slate-50/70 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl p-0.5 shadow-md flex items-center justify-center text-white ${
              activeTab === 'request_money'
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                : activeTab === 'pay_upi'
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500'
                : 'bg-gradient-to-tr from-blue-600 to-indigo-600'
            }`}>
              {activeTab === 'request_money' ? (
                <HandCoins size={22} />
              ) : activeTab === 'pay_upi' ? (
                <CreditCard size={22} />
              ) : (
                <Globe size={22} />
              )}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-tight">
                {activeTab === 'request_money'
                  ? 'Request Money from Person'
                  : activeTab === 'pay_upi'
                  ? 'Send / Pay via UPI App'
                  : 'Public Statement (No Login)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {activeTab === 'request_money'
                  ? 'Send custom request message & collect money via UPI'
                  : activeTab === 'pay_upi'
                  ? 'Direct UPI transfer using recipient UPI ID'
                  : 'Zero-login public ledger showing money given & taken'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector: 3 Clean Tabs */}
        <div className="p-2 bg-slate-100/70 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-white/5 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('request_money')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate ${
              activeTab === 'request_money'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HandCoins size={14} className="shrink-0" />
            <span className="truncate">Request Money</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pay_upi')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate ${
              activeTab === 'pay_upi'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <CreditCard size={14} className="shrink-0" />
            <span className="truncate">Pay via UPI</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('public_share')}
            className={`py-2 px-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer truncate ${
              activeTab === 'public_share'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Link size={14} className="shrink-0" />
            <span className="truncate">Share Link</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4">
          {/* Person summary banner */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-white/5">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {person.full_name}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                {person.phone ? <span>{person.phone}</span> : <span className="italic text-slate-400">No phone saved</span>}
                {person.category && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-white/10 text-[10px] font-semibold">
                    {person.category}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {isOwed ? 'Money to Take (Receivable)' : netBalance < 0 ? 'Money to Give (Payable)' : 'Settled Balance'}
              </div>
              <div
                className={`text-base font-black ${
                  isOwed
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : isSettled
                    ? 'text-slate-500'
                    : 'text-rose-500'
                }`}
              >
                {formatAmount(Math.abs(netBalance))}
              </div>
            </div>
          </div>

          {/* TAB 1: PAYMENT REQUEST (TAKE MONEY FROM PERSON) */}
          {activeTab === 'request_money' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Smartphone size={13} className="text-amber-500" />
                      <span>Your Receiving UPI ID</span>
                    </label>
                    <input
                      type="text"
                      value={myUpiId}
                      onChange={(e) => handleUpdateMyUpiId(e.target.value)}
                      placeholder="e.g. yourname@okhdfcbank or 9876543210@upi"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Amount to Request / Take ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={requestAmount}
                      onChange={(e) => setRequestAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black text-amber-600 dark:text-amber-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <MessageSquare size={13} className="text-amber-500" />
                    <span>Request Message to {person.full_name}</span>
                  </label>
                  <input
                    type="text"
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    placeholder="Enter custom request note..."
                    className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Quick messaging dispatch buttons */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleSendWhatsAppRequest}
                    className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <Send size={13} />
                    <span>Send via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSendSmsRequest}
                    className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                  >
                    <MessageSquare size={13} />
                    <span>Send via SMS</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PAY VIA UPI ID (SEND MONEY TO RECIPIENT) */}
          {activeTab === 'pay_upi' && (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <Smartphone size={13} className="text-emerald-600" />
                      <span>Recipient Bank UPI ID</span>
                    </label>
                    <input
                      type="text"
                      value={recipientUpiId}
                      onChange={(e) => setRecipientUpiId(e.target.value)}
                      placeholder="e.g. 9876543210@upi or name@okaxis"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Payee Name
                    </label>
                    <input
                      type="text"
                      value={payeeName}
                      onChange={(e) => setPayeeName(e.target.value)}
                      placeholder={person.full_name}
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Amount to Pay ({currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={returnAmount}
                      onChange={(e) => setReturnAmount(e.target.value)}
                      placeholder="e.g. 1500"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white font-black text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      Payment Note / Purpose
                    </label>
                    <input
                      type="text"
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      placeholder="e.g. Return money settlement"
                      className="w-full mt-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PUBLIC STATEMENT LINK (MONEY GIVEN & TAKEN ONLY • NO LOGIN) */}
          {activeTab === 'public_share' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Globe size={14} className="text-blue-600" />
                    <span>Public Statement (Money Given & Taken Only • No Login)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold">
                    Zero Login Required
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Anyone with this link sees <strong>only the money given and taken</strong> for {person.full_name}, with individual payment dates and net balance. No login, settings, or private data is exposed!
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl || `${window.location.origin}/share/${shareId || 'ledger'}`}
                    className="flex-1 px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-blue-600 dark:text-blue-400 font-mono font-bold select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                  >
                    {shareCopied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{shareCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <a
                    href={shareUrl || `${window.location.origin}/share/${shareId || 'ledger'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 text-blue-600 dark:text-blue-400 border border-blue-500/30 transition-colors"
                    title="Open public statement in new tab"
                  >
                    <ExternalLink size={15} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Canvas Card */}
          <div className="flex flex-col items-center justify-center p-5 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-white/10 shadow-inner">
            {isGenerating ? (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400">
                <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : qrDataUrl ? (
              <div className="relative group p-3 bg-white rounded-2xl shadow-md border border-slate-100 flex flex-col items-center">
                <img
                  src={qrDataUrl}
                  alt={`QR Code for ${person.full_name}`}
                  className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-xl"
                />

                <div className="mt-2 text-center">
                  <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full text-white shadow-xs ${
                    activeTab === 'request_money'
                      ? 'bg-amber-600'
                      : activeTab === 'pay_upi'
                      ? 'bg-emerald-700'
                      : 'bg-slate-900'
                  }`}>
                    {activeTab === 'request_money'
                      ? 'Scan to Pay & Settle Request'
                      : activeTab === 'pay_upi'
                      ? 'Scan with GPay, PhonePe, Paytm or BHIM'
                      : 'Scan to View Public Statement (No Login)'}
                  </span>
                </div>
              </div>
            ) : null}

            {/* Raw Link snippet */}
            <div className="w-full mt-3 p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-white/10 text-[10px] font-mono text-slate-600 dark:text-slate-400 break-all select-all">
              {activeTab === 'request_money' ? getRequestUpiUri() : activeTab === 'pay_upi' ? getPayUpiUri() : shareUrl}
            </div>
          </div>

          {/* Direct Pay & Sharing Actions */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activeTab === 'request_money' ? (
              <button
                type="button"
                onClick={() => handleLaunchUpiChooser('request')}
                className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-600/20 text-center"
              >
                <Zap size={14} />
                <span>Request in UPI App</span>
              </button>
            ) : activeTab === 'pay_upi' ? (
              <button
                type="button"
                onClick={() => handleLaunchUpiChooser('pay')}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-600/20 text-center"
              >
                <Zap size={14} />
                <span>Open in UPI App</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleDownloadPdf}
                className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-blue-600/20"
              >
                <FileText size={14} />
                <span>Download PDF</span>
              </button>
            )}

            <button
              type="button"
              onClick={activeTab === 'request_money' ? handleCopyRequestMessage : activeTab === 'pay_upi' ? handleCopyUpiLink : handleCopyShareLink}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {(activeTab === 'request_money' ? reqCopied : activeTab === 'pay_upi' ? copied : shareCopied) ? (
                <Check size={14} className="text-emerald-500" />
              ) : (
                <Copy size={14} />
              )}
              <span>{(activeTab === 'request_money' ? reqCopied : activeTab === 'pay_upi' ? copied : shareCopied) ? 'Copied!' : 'Copy Link'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadQrImage}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download size={14} />
              <span>Save PNG</span>
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Share2 size={14} />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
