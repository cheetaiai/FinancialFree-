import React, { useState } from 'react';
import { useAuth, PasswordResetAnalysisResult } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  Compass,
  User as UserIcon,
  KeyRound,
  Eye,
  EyeOff,
  ShieldAlert,
  Shield,
  CheckCircle2,
  X,
  Sparkles,
  Clock,
  RefreshCw
} from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { AppLogo } from '../components/common/AppLogo';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { AppUpdateModal } from '../components/update/AppUpdateModal';
import { useAppUpdate } from '../context/AppUpdateContext';

interface LoginPageProps {
  onOpenWalkthrough?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenWalkthrough }) => {
  const {
    login,
    register,
    sendPasswordReset,
    authStatusMessage,
    isRedirecting
  } = useAuth();
  const { showToast } = useToast();
  const { hasUpdateAvailable, isUpdateInstalled, latestVersion, openUpdateModal } = useAppUpdate();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regRole, setRegRole] = useState<'admin' | 'user'>('user');
  const [regAdminKey, setRegAdminKey] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);
  const [resetAnalysis, setResetAnalysis] = useState<PasswordResetAnalysisResult | null>(null);

  // Pending Admin Approval state
  const [pendingApprovalInfo, setPendingApprovalInfo] = useState<{
    name: string;
    email: string;
    submittedAt: string;
  } | null>(null);
  const [isCheckingApproval, setIsCheckingApproval] = useState(false);

  const handleCheckApprovalStatus = async () => {
    if (!pendingApprovalInfo?.email) return;
    try {
      setIsCheckingApproval(true);
      const res = await api.checkApprovalStatus(pendingApprovalInfo.email);
      if (res.status === 'approved') {
        showToast('🎉 Your account has been approved by the administrator! You can now sign in.', 'success');
        setEmail(pendingApprovalInfo.email);
        setPendingApprovalInfo(null);
        setAuthMode('login');
      } else if (res.status === 'rejected') {
        showToast('Your registration request was rejected by an administrator.', 'error');
      } else {
        showToast('Your registration is still awaiting administrator approval. Please check again shortly.', 'info');
      }
    } catch {
      showToast('Could not reach verification server. Please retry.', 'error');
    } finally {
      setIsCheckingApproval(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!email.trim() || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }

    setIsLoading(true);
    const success = await login(email.trim(), password);
    if (!success) {
      try {
        const check = await api.checkApprovalStatus(email.trim());
        if (check.status === 'pending') {
          setPendingApprovalInfo({
            name: check.name || email.trim().split('@')[0],
            email: email.trim(),
            submittedAt: 'Awaiting administrator approval'
          });
        }
      } catch {
        // ignore
      }
    }
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!regName.trim()) {
      showToast('Please enter your full name.', 'error');
      return;
    }

    if (!regEmail.trim()) {
      showToast('Please enter a valid email address.', 'error');
      return;
    }

    if (regRole === 'admin' && !regAdminKey.trim()) {
      showToast('Admin Key is required when selecting the Administrator role.', 'error');
      return;
    }

    if (regPassword.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      showToast('Passwords do not match.', 'error');
      return;
    }

    setIsLoading(true);
    const regResult = await register({
      email: regEmail.trim(),
      password: regPassword,
      name: regName.trim(),
      role: regRole,
      adminKey: regAdminKey.trim()
    });

    if (regResult.success) {
      if (regResult.requiresApproval) {
        setPendingApprovalInfo({
          name: regName.trim(),
          email: regEmail.trim(),
          submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        showToast('Account created successfully! Welcome to FinancialFree.', 'success');
      }
    }

    setIsLoading(false);
  };

  // Forgot Password Actions
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail || !forgotEmail.trim()) {
      showToast('Please enter your account email.', 'error');
      return;
    }

    try {
      setIsForgotLoading(true);
      const res = await sendPasswordReset(forgotEmail.trim());
      setResetAnalysis(res);
      if (res.code) {
        setGeneratedCodeHint(res.code);
      }
      setForgotStep('verify');
    } catch {
      // Toast already shown in AuthContext
    } finally {
      setIsForgotLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotCode || forgotCode.trim().length !== 6) {
      showToast('Please enter the 6-digit verification code.', 'error');
      return;
    }
    if (forgotNewPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'error');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      showToast('New passwords do not match.', 'error');
      return;
    }

    try {
      setIsForgotLoading(true);
      const res = await api.resetPassword(forgotEmail.trim(), forgotCode.trim(), forgotNewPassword);
      showToast(res.message || 'Password successfully reset! You can now sign in.', 'success');
      setIsForgotModalOpen(false);
      setForgotStep('request');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setEmail(forgotEmail);
    } catch (err: any) {
      showToast(err.message || 'Failed to reset password', 'error');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-950/40">
      {/* Background ambient liquid glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />



      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-md z-10"
      >
        <LiquidGlassCard variant="floating" className="p-6 sm:p-8 border border-white/80 dark:border-white/10 shadow-2xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="relative mb-2">
              <AppLogo size="xl" animate={true} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              FinancialFree
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Personal Money Lending & Return Tracker
            </p>

            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck size={14} />
              <span>Secure Multi-User Portal</span>
            </div>
          </div>

          {/* PENDING ADMIN APPROVAL STATE */}
          {pendingApprovalInfo ? (
            <div className="space-y-4 py-2 animate-in fade-in duration-200">
              <div className="text-center py-2 space-y-2">
                <div className="w-14 h-14 rounded-3xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/15">
                  <Clock size={28} className="animate-pulse" />
                </div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Registration Awaiting Approval
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-xs mx-auto">
                  Your account request has been submitted to the administrator. Once approved, you can log in immediately.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Full Name</span>
                  <span className="font-bold text-slate-900 dark:text-white">{pendingApprovalInfo.name}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Email Address</span>
                  <span className="font-mono text-slate-900 dark:text-white font-medium">{pendingApprovalInfo.email}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Submitted At</span>
                  <span className="text-slate-700 dark:text-slate-300">{pendingApprovalInfo.submittedAt}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-500/20">
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Current Status</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                    <span>Pending Admin Approval</span>
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <LiquidButton
                  variant="primary"
                  size="md"
                  onClick={handleCheckApprovalStatus}
                  disabled={isCheckingApproval}
                  icon={<RefreshCw size={15} className={isCheckingApproval ? 'animate-spin' : ''} />}
                  className="w-full font-bold shadow-lg shadow-blue-500/20 bg-gradient-to-r from-blue-600 to-indigo-600"
                >
                  {isCheckingApproval ? 'Checking Approval Status...' : 'Check Approval Status Now'}
                </LiquidButton>

                <button
                  type="button"
                  onClick={() => {
                    setEmail(pendingApprovalInfo.email);
                    setPendingApprovalInfo(null);
                    setAuthMode('login');
                  }}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ← Return to Sign In
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Section Indicator: Sign In vs Create Account */}
              <div className="relative p-1 rounded-2xl liquid-glass-secondary border border-white/60 dark:border-white/10 flex items-center mb-5">
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className={`relative flex-1 py-2 text-xs font-bold transition-colors cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                authMode === 'login'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {authMode === 'login' && (
                <motion.div
                  layoutId="auth-tab-indicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className="absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-white/10 -z-10"
                />
              )}
              <Lock size={13} />
              <span>Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className={`relative flex-1 py-2 text-xs font-bold transition-colors cursor-pointer rounded-xl flex items-center justify-center gap-1.5 ${
                authMode === 'register'
                  ? 'text-slate-900 dark:text-white'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {authMode === 'register' && (
                <motion.div
                  layoutId="auth-tab-indicator"
                  transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                  className="absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-white/10 -z-10"
                />
              )}
              <UserIcon size={13} />
              <span>Create Account</span>
            </button>
          </div>

          {/* AUTH FORM: LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
                <ShieldCheck size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Secure Sign In:</strong> Sign in with your approved account credentials or administrator access.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                  Account Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="user@financialfree.com or admin@..."
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1 ml-1 mr-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setIsForgotModalOpen(true);
                      setForgotStep('request');
                    }}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-12 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <LiquidButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 cursor-pointer"
                icon={<ArrowRight size={18} />}
              >
                Sign In to FinancialFree
              </LiquidButton>
            </form>
          )}

          {/* AUTH FORM: REGISTER (FULL NAME, EMAIL, ROLE, PASSWORD, ADMIN KEY - NO PHONE, NO HCAPTCHA) */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Shield size={16} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Admin Provisioning:</strong> Account creation requires an Admin Security Key to ensure only administrators can create accounts.
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="Administrator or User Name"
                    autoComplete="name"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={regEmail}
                    onChange={e => setRegEmail(e.target.value)}
                    placeholder="user@financialfree.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                  />
                </div>
              </div>

              {/* ROLE SELECTION */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                  Account Role Selection
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRegRole('admin')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      regRole === 'admin'
                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                        : 'liquid-glass-secondary border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <ShieldCheck size={14} />
                    <span>Administrator</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegRole('user')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      regRole === 'user'
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'liquid-glass-secondary border-slate-200/70 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <UserIcon size={14} />
                    <span>Standard User</span>
                  </button>
                </div>
              </div>

              {/* ADMIN AUTHORIZATION KEY (REQUIRED IF SELECTING ADMIN ROLE) */}
              <div>
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Admin Key {regRole === 'admin' ? '(Required for Admin Role)' : '(Optional for Standard Users)'}
                  </label>
                  {regRole === 'admin' && (
                    <span className="text-[10px] text-amber-500 font-bold">Required for Admin</span>
                  )}
                </div>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required={regRole === 'admin'}
                    value={regAdminKey}
                    onChange={e => setRegAdminKey(e.target.value)}
                    placeholder={regRole === 'admin' ? 'Enter Admin Key (e.g. FinancialFree@321)' : 'Optional Admin Key'}
                    className={`w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border ${
                      regRole === 'admin' ? 'border-amber-500/40 bg-amber-500/5' : 'border-slate-200/70 dark:border-white/10'
                    } text-slate-900 dark:text-white text-sm font-medium glass-input`}
                  />
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 ml-1">
                  {regRole === 'admin'
                    ? 'Required when selecting Administrator: Enter master Admin Key or existing admin credentials.'
                    : 'Standard user creation does not require an admin key.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regPassword}
                      onChange={e => setRegPassword(e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full pl-9 pr-3 py-2 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium glass-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type={showRegPassword ? 'text' : 'password'}
                      required
                      value={regConfirmPassword}
                      onChange={e => setRegConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-xs font-medium glass-input"
                    />
                  </div>
                </div>
              </div>

              <LiquidButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 cursor-pointer"
                icon={<ArrowRight size={18} />}
              >
                Create Account
              </LiquidButton>
            </form>
          )}
          </>
          )}

          {/* 3-Step Walkthrough trigger */}
          {onOpenWalkthrough && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={onOpenWalkthrough}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                <Compass size={14} />
                <span>View 3-Step App Overview & Features</span>
              </button>
            </div>
          )}

          <div className="mt-5 text-center text-[11px] text-slate-400 dark:text-slate-500">
            Protected by PBKDF2 hash encryption & role-based administrator security
          </div>
        </LiquidGlassCard>
      </motion.div>

      {/* Forgot Password & Verification Modal (No hCaptcha) */}
      <AnimatePresence>
        {isForgotModalOpen && (
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
                onClick={() => setIsForgotModalOpen(false)}
                className="absolute right-4 top-4 p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2.5 mb-4">
                <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {forgotStep === 'request' ? 'Reset Password' : 'Enter Verification Code'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {forgotStep === 'request'
                      ? 'Enter your administrator email to receive a recovery code'
                      : `Enter the 6-digit code sent to ${forgotEmail}`}
                  </p>
                </div>
              </div>

              {forgotStep === 'request' ? (
                <form onSubmit={handleRequestResetCode} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Account Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        placeholder="admin@financialfree.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-sm font-medium glass-input"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <LiquidButton
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="flex-1"
                    >
                      Cancel
                    </LiquidButton>
                    <LiquidButton
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isForgotLoading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      Send Code
                    </LiquidButton>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  {generatedCodeHint && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[11px]">Recovery Code:</span>
                        <span className="font-mono text-sm font-black tracking-widest text-white bg-emerald-950/70 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                          {generatedCodeHint}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(generatedCodeHint);
                            showToast('Code copied to clipboard!', 'success');
                          }}
                          className="text-[11px] px-2 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-bold cursor-pointer"
                        >
                          Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => setForgotCode(generatedCodeHint)}
                          className="text-[11px] px-2 py-1 rounded-lg bg-white text-slate-900 hover:bg-slate-100 font-bold cursor-pointer shadow-xs"
                        >
                          Auto Fill
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      6-Digit Verification Code
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={forgotCode}
                      onChange={e => setForgotCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-center font-mono text-lg tracking-widest font-bold glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={forgotNewPassword}
                      onChange={e => setForgotNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-sm font-medium glass-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      required
                      value={forgotConfirmPassword}
                      onChange={e => setForgotConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-sm font-medium glass-input"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <LiquidButton
                      type="button"
                      variant="secondary"
                      size="md"
                      onClick={() => setForgotStep('request')}
                      className="flex-1"
                    >
                      Back
                    </LiquidButton>
                    <LiquidButton
                      type="submit"
                      variant="primary"
                      size="md"
                      isLoading={isForgotLoading}
                      className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600"
                    >
                      Reset Password
                    </LiquidButton>
                  </div>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Login & Redirect Overlay */}
      <AnimatePresence>
        {(isRedirecting || (authStatusMessage && isLoading)) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="p-6 sm:p-8 rounded-3xl liquid-glass-card liquid-glass-specular max-w-sm w-full text-center space-y-4 shadow-2xl border border-white/20"
            >
              <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <ShieldCheck size={22} className="animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Authenticating Session
                </h3>
                <p className="text-xs text-blue-300 font-medium mt-1 animate-pulse">
                  {authStatusMessage || 'Redirecting to your FinancialFree ledger...'}
                </p>
              </div>

              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-400 via-indigo-400 to-blue-400 w-full animate-[pulse_1s_ease-in-out_infinite]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Small Subtle Liquid-Glass Update Notification Pill at bottom of screen */}
      {hasUpdateAvailable && !isUpdateInstalled && (
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-auto px-2"
        >
          <button
            type="button"
            onClick={() => {
              showToast(
                `✨ Update ${latestVersion} is available! Please log in to your account to install and activate it securely.`,
                'info'
              );
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold bg-slate-900/90 hover:bg-slate-900 text-blue-300 hover:text-white border border-blue-500/30 transition-all cursor-pointer shadow-xl backdrop-blur-xl group"
          >
            <Sparkles size={13} className="text-amber-400 animate-spin" />
            <span>Update <strong className="font-extrabold text-white">{latestVersion}</strong> available (1.9 GB)</span>
            <span className="text-[11px] text-blue-400 group-hover:text-blue-200 font-bold ml-1">• Login to Install →</span>
          </button>
        </motion.div>
      )}
    </div>
  );
};
