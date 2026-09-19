import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Edit2,
  Save,
  X,
  Sparkles,
  KeyRound,
  ShieldAlert,
  Smartphone,
  Check
} from 'lucide-react';
import { LiquidGlassCard } from '../ui/LiquidGlassCard';
import { LiquidButton } from '../ui/LiquidButton';
import { motion, AnimatePresence } from 'motion/react';

export const UserProfileCard: React.FC = () => {
  const { user, updateProfile, sendEmailVerification, verifyEmail } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [isSaving, setIsSaving] = useState(false);

  // Email verification modal state
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeHint, setCodeHint] = useState<string | null>(null);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const isEmailVerified = !!user.email_verified;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const success = await updateProfile({ name: name.trim(), phone: phone.trim() });
      if (success) {
        setIsEditing(false);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartEmailVerification = async () => {
    try {
      setIsSendingCode(true);
      const res = await sendEmailVerification();
      if (res.code) {
        setCodeHint(res.code);
      }
      setIsVerifyModalOpen(true);
    } catch {
      // Toast already shown in AuthContext
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleConfirmVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.trim().length !== 6) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return;
    }

    try {
      setIsVerifying(true);
      const success = await verifyEmail(verificationCode.trim());
      if (success) {
        setIsVerifyModalOpen(false);
        setVerificationCode('');
        setCodeHint(null);
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <>
      <LiquidGlassCard variant="primary" className="p-5 sm:p-6 space-y-4 border border-blue-500/20 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Avatar & Core Profile Info */}
          <div className="flex items-center gap-3.5">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-teal-400 p-0.5 shadow-md flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-900 flex items-center justify-center text-slate-800 dark:text-white font-black text-xl tracking-tight">
                  {(user.name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
              <div
                className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${
                  isAdmin ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                }`}
                title={isAdmin ? 'Administrator' : 'Personal Account'}
              >
                {isAdmin ? <Sparkles size={10} /> : <User size={10} />}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                  {user.name || 'FinancialFree User'}
                </h3>
                {isAdmin ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 shadow-xs">
                    <Sparkles size={11} className="text-amber-500" />
                    Master Administrator
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30 shadow-xs">
                    <ShieldCheck size={11} className="text-blue-500" />
                    Personal Single Account
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                <span className="flex items-center gap-1">
                  <Mail size={12} className="text-slate-400" />
                  <span>{user.email}</span>
                </span>

                {user.phone ? (
                  <span className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                    <Phone size={12} className="text-emerald-500" />
                    <span>{user.phone}</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-amber-500/90 italic text-[11px]">
                    <Phone size={12} />
                    <span>No phone linked</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions / Edit Profile Trigger */}
          <div className="flex items-center gap-2 flex-wrap">
            {!isEditing ? (
              <LiquidButton
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setName(user.name || '');
                  setPhone(user.phone || '');
                  setIsEditing(true);
                }}
                icon={<Edit2 size={13} />}
              >
                Edit Profile
              </LiquidButton>
            ) : (
              <LiquidButton
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                icon={<X size={13} />}
              >
                Cancel
              </LiquidButton>
            )}

            {!isEmailVerified ? (
              <button
                type="button"
                onClick={handleStartEmailVerification}
                disabled={isSendingCode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-200 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-all active:scale-95"
              >
                <AlertCircle size={13} className="text-amber-500" />
                <span>{isSendingCode ? 'Sending...' : 'Verify Email'}</span>
              </button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 text-xs font-semibold">
                <CheckCircle2 size={13} className="text-emerald-500" />
                <span>Email Verified</span>
              </span>
            )}
          </div>
        </div>

        {/* Edit Profile Form (Name & Phone feature) */}
        <AnimatePresence>
          {isEditing && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleSaveProfile}
              className="pt-3 border-t border-slate-200/70 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3"
            >
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-9 pr-3 py-2 rounded-xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium glass-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Phone Feature (WhatsApp / SMS)
                  </label>
                  <span className="text-[10px] text-blue-500 font-medium">Added to profile</span>
                </div>
                <div className="relative">
                  <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+1 555-0199 or +91..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl liquid-glass-secondary border border-slate-200/80 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium glass-input"
                  />
                </div>
              </div>

              <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
                <LiquidButton
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </LiquidButton>
                <LiquidButton
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={isSaving}
                  icon={<Save size={13} />}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  Save Profile Changes
                </LiquidButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Single Account vs Admin Privacy Scope Banner */}
        <div className="rounded-2xl p-3 bg-black/5 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 flex items-start gap-2.5 text-xs">
          <div className="p-1.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
            <Smartphone size={15} />
          </div>
          <div className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
            {isAdmin ? (
              <span>
                <strong className="text-slate-900 dark:text-white font-bold">Admin Privileges Active:</strong> You have system-wide visibility, cloud synchronization tools, and master database diagnostics.
              </span>
            ) : (
              <span>
                <strong className="text-slate-900 dark:text-white font-bold">Single Account Privacy:</strong> Your profile and financial records are isolated. Only you can access your ledger entries, borrowers, and reminders.
              </span>
            )}
          </div>
        </div>
      </LiquidGlassCard>

      {/* Email Verification 6-Digit Code Modal */}
      <AnimatePresence>
        {isVerifyModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 15 }}
              className="p-6 sm:p-7 rounded-3xl liquid-glass-card liquid-glass-specular max-w-md w-full shadow-2xl border border-white/20 relative"
            >
              <button
                type="button"
                onClick={() => setIsVerifyModalOpen(false)}
                className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Mail size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">
                    Verify Your Email Address
                  </h3>
                  <p className="text-xs text-slate-400">
                    Enter the 6-digit verification code sent to <strong className="text-white">{user.email}</strong>
                  </p>
                </div>
              </div>

              {codeHint && (
                <div className="p-3 mb-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold">Verification code:</span>{' '}
                    <span className="font-mono text-sm font-black tracking-widest text-white bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                      {codeHint}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setVerificationCode(codeHint)}
                    className="text-[11px] underline font-bold cursor-pointer hover:text-white"
                  >
                    Fill Code
                  </button>
                </div>
              )}

              <form onSubmit={handleConfirmVerifyCode} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={verificationCode}
                    onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-center font-mono text-xl tracking-widest font-black glass-input"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <LiquidButton
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => setIsVerifyModalOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </LiquidButton>
                  <LiquidButton
                    type="submit"
                    variant="primary"
                    size="md"
                    isLoading={isVerifying}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                  >
                    Verify Email
                  </LiquidButton>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
