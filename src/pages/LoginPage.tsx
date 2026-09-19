import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import {
  Lock,
  Mail,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  X,
  Compass,
  Phone,
  User as UserIcon,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Download
} from 'lucide-react';
import { downloadApkClientSide } from '../lib/apkData';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { AppLogo } from '../components/common/AppLogo';
import { HCaptchaWidget } from '../components/auth/HCaptchaWidget';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface LoginPageProps {
  onOpenWalkthrough?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenWalkthrough }) => {
  const {
    login,
    register,
    loginWithGoogle,
    unauthorizedDomainInfo,
    clearUnauthorizedDomainError,
    authStatusMessage,
    isRedirecting
  } = useAuth();
  const { showToast } = useToast();

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  
  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // hCaptcha state - mandatory for ALL users and admins
  const [hcaptchaToken, setHcaptchaToken] = useState<string | null>(null);

  // Loading states
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Forgot Password modal states
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotHcaptchaToken, setForgotHcaptchaToken] = useState<string | null>(null);
  const [generatedCodeHint, setGeneratedCodeHint] = useState<string | null>(null);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading) return;

    if (!hcaptchaToken) {
      showToast('Mandatory security verification: Please complete the hCaptcha below.', 'error');
      return;
    }

    setIsLoading(true);
    await login(email, password, hcaptchaToken);
    setIsLoading(false);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading) return;

    if (!hcaptchaToken) {
      showToast('Mandatory security verification: Please complete the hCaptcha below.', 'error');
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
    const success = await register({
      email: regEmail,
      password: regPassword,
      name: regName,
      phone: regPhone,
      hcaptchaToken
    });
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (isLoading || isGoogleLoading) return;
    setIsGoogleLoading(true);
    await loginWithGoogle();
    setIsGoogleLoading(false);
  };

  const handleCopyDomain = (domainToCopy: string) => {
    navigator.clipboard.writeText(domainToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  // Forgot Password Actions
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail) {
      showToast('Please enter your account email.', 'error');
      return;
    }
    if (!forgotHcaptchaToken) {
      showToast('Please complete the security captcha before requesting code.', 'error');
      return;
    }

    try {
      setIsForgotLoading(true);
      const res = await api.forgotPassword(forgotEmail, forgotHcaptchaToken);
      showToast(res.message, 'success');
      if (res.code) {
        setGeneratedCodeHint(res.code);
      }
      setForgotStep('verify');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset code', 'error');
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
      const res = await api.resetPassword(forgotEmail, forgotCode.trim(), forgotNewPassword);
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
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden bg-slate-950/40">
      {/* Background ambient liquid glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-md"
      >
        {/* Firebase Unauthorized Domain Assistance Alert */}
        <AnimatePresence>
          {unauthorizedDomainInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="mb-4 rounded-3xl p-5 bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 shadow-xl backdrop-blur-xl relative"
            >
              <button
                type="button"
                onClick={clearUnauthorizedDomainError}
                className="absolute right-3.5 top-3.5 p-1 rounded-full text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 transition-colors"
                title="Dismiss"
              >
                <X size={16} />
              </button>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-2 text-xs pr-4">
                  <div className="font-bold text-sm text-amber-950 dark:text-amber-100">
                    Firebase Authorized Domain Notice
                  </div>
                  <p className="leading-relaxed text-slate-600 dark:text-slate-300">
                    Firebase OAuth restricts sign-in popups to authorized domains. Whitelist this domain in Firebase Console or sign in with your email & password.
                  </p>

                  <div className="flex items-center gap-2 p-2 rounded-xl bg-white/60 dark:bg-black/40 border border-amber-500/20 font-mono text-[11px] text-slate-800 dark:text-slate-200 select-all overflow-x-auto">
                    <span className="truncate flex-1">{unauthorizedDomainInfo.domain}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyDomain(unauthorizedDomainInfo.domain)}
                      className="px-2 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 font-sans font-semibold flex items-center gap-1 cursor-pointer flex-shrink-0"
                    >
                      {hasCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>{hasCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    <a
                      href={`https://console.firebase.google.com/project/${unauthorizedDomainInfo.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 font-semibold flex items-center gap-1.5 transition-colors text-[11px]"
                    >
                      <span>Open Firebase Console</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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

            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-semibold border border-blue-500/20">
              <ShieldCheck size={14} />
              <span>Multi-Tenant & Admin Portal</span>
            </div>
          </div>

          {/* Liquid Glass Section Indicator: Sign In vs Create Account */}
          <div className="relative p-1 rounded-2xl liquid-glass-secondary border border-white/60 dark:border-white/10 flex items-center mb-5">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setHcaptchaToken(null);
              }}
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
              onClick={() => {
                setAuthMode('register');
                setHcaptchaToken(null);
              }}
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

          {/* Google Sign-In */}
          <div className="space-y-2.5 mb-4">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-800/95 text-slate-800 dark:text-white font-semibold text-sm border border-slate-200/90 dark:border-white/10 shadow-sm hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-[0.98] group min-h-[44px]"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
            </button>
          </div>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-slate-50 dark:bg-slate-900 px-3 text-slate-400 font-bold tracking-wider rounded-full">
                {authMode === 'login' ? 'Or Sign In with Credentials' : 'Or Register New Account'}
              </span>
            </div>
          </div>

          {/* AUTH FORM: LOGIN */}
          {authMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="name@example.com"
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
                      setForgotHcaptchaToken(null);
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

              {/* Mandatory hCaptcha Widget */}
              <HCaptchaWidget
                onVerify={(token) => setHcaptchaToken(token)}
                onExpire={() => setHcaptchaToken(null)}
                onError={() => setHcaptchaToken(null)}
              />

              <LiquidButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={!hcaptchaToken}
                className="w-full mt-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 cursor-pointer"
                icon={<ArrowRight size={18} />}
              >
                {hcaptchaToken ? 'Sign In Securely' : 'Complete Captcha to Sign In'}
              </LiquidButton>
            </form>
          )}

          {/* AUTH FORM: REGISTER */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3">
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
                    placeholder="John Doe"
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
                    placeholder="user@example.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                  />
                </div>
              </div>

              {/* Phone feature in profile creation */}
              <div>
                <div className="flex items-center justify-between mb-1 ml-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Phone Number
                  </label>
                  <span className="text-[10px] text-blue-500 font-medium">WhatsApp & SMS Ready</span>
                </div>
                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={regPhone}
                    onChange={e => setRegPhone(e.target.value)}
                    placeholder="+1 555-0199 or +91..."
                    autoComplete="tel"
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                  />
                </div>
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

              {/* Mandatory hCaptcha Widget */}
              <HCaptchaWidget
                onVerify={(token) => setHcaptchaToken(token)}
                onExpire={() => setHcaptchaToken(null)}
                onError={() => setHcaptchaToken(null)}
              />

              <LiquidButton
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                disabled={!hcaptchaToken}
                className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 cursor-pointer"
                icon={<ArrowRight size={18} />}
              >
                {hcaptchaToken ? 'Create Account' : 'Complete Captcha to Register'}
              </LiquidButton>
            </form>
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
            Protected by PBKDF2 hash encryption & mandatory hCaptcha security
          </div>
        </LiquidGlassCard>

        {/* Direct Android APK Download Card */}
        <div className="mt-4 p-3.5 rounded-2xl liquid-glass-card border border-emerald-500/30 flex items-center justify-between gap-3 text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-sm flex-shrink-0">
              APK
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>FinancialFree Android App</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold">.apk</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Direct download for Android phone & tablet
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => downloadApkClientSide()}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 flex-shrink-0"
          >
            <Download size={14} />
            <span>Download APK</span>
          </button>
        </div>
      </motion.div>

      {/* Forgot Password & Verification Modal */}
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
                className="absolute right-4 top-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {forgotStep === 'request' ? 'Forgot Password' : 'Enter Verification Code'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {forgotStep === 'request'
                      ? 'We will send a 6-digit verification code to your email'
                      : `Enter the code sent to ${forgotEmail}`}
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
                        placeholder="your-email@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-2xl liquid-glass-secondary border border-white/10 text-white text-sm font-medium glass-input"
                      />
                    </div>
                  </div>

                  <HCaptchaWidget
                    onVerify={(token) => setForgotHcaptchaToken(token)}
                    onExpire={() => setForgotHcaptchaToken(null)}
                    onError={() => setForgotHcaptchaToken(null)}
                  />

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
                      disabled={!forgotHcaptchaToken}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600"
                    >
                      Send Code
                    </LiquidButton>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3.5">
                  {generatedCodeHint && (
                    <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold">Reset code generated:</span>{' '}
                        <span className="font-mono text-sm font-black tracking-widest text-white bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                          {generatedCodeHint}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setForgotCode(generatedCodeHint)}
                        className="text-[11px] underline font-bold cursor-pointer hover:text-white"
                      >
                        Auto Fill
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      6-Digit Code
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

                  <div className="flex gap-2 pt-1">
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

      {/* Instantaneous Login & Redirect Liquid Overlay */}
      <AnimatePresence>
        {(isRedirecting || (authStatusMessage && (isGoogleLoading || isLoading))) && (
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
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck size={22} className="animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Authenticating Session
                </h3>
                <p className="text-xs text-emerald-300 font-medium mt-1 animate-pulse">
                  {authStatusMessage || 'Redirecting to your FinancialFree ledger...'}
                </p>
              </div>

              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 w-full animate-[pulse_1s_ease-in-out_infinite]" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
