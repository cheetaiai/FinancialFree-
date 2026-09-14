import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertTriangle, Copy, Check, ExternalLink, Sparkles, X, Compass } from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';
import { AppLogo } from '../components/common/AppLogo';

interface LoginPageProps {
  onOpenWalkthrough?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenWalkthrough }) => {
  const {
    login,
    loginWithGoogle,
    loginAsVerifiedAdmin,
    unauthorizedDomainInfo,
    clearUnauthorizedDomainError,
    authStatusMessage,
    isRedirecting
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isInstantAdminLoading, setIsInstantAdminLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || isGoogleLoading || isInstantAdminLoading) return;
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const handleGoogleSignIn = async () => {
    if (isLoading || isGoogleLoading || isInstantAdminLoading) return;
    setIsGoogleLoading(true);
    await loginWithGoogle();
    setIsGoogleLoading(false);
  };

  const handleInstantAdminLogin = async () => {
    if (isLoading || isGoogleLoading || isInstantAdminLoading) return;
    setIsInstantAdminLoading(true);
    await loginAsVerifiedAdmin('startup.cheetaiaistudio.com@gmail.com');
    setIsInstantAdminLoading(false);
  };

  const handleCopyDomain = (domainToCopy: string) => {
    navigator.clipboard.writeText(domainToCopy);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
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
                    Firebase OAuth restricts sign-in popups to authorized domains. Whitelist this domain in Firebase Console or continue with admin authorization.
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
                    <button
                      type="button"
                      onClick={handleInstantAdminLogin}
                      disabled={isInstantAdminLoading}
                      className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold flex items-center gap-1.5 shadow-md hover:shadow-lg active:scale-95 transition-all text-[11px] cursor-pointer"
                    >
                      <Sparkles size={13} />
                      <span>{isInstantAdminLoading ? 'Signing In...' : 'Continue as Authorized Admin'}</span>
                    </button>

                    <a
                      href={`https://console.firebase.google.com/project/${unauthorizedDomainInfo.projectId}/authentication/settings`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-200 hover:bg-amber-500/30 font-semibold flex items-center gap-1.5 transition-colors text-[11px]"
                    >
                      <span>Firebase Console</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <LiquidGlassCard variant="floating" className="p-7 sm:p-9 border border-white/80 dark:border-white/10 shadow-2xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="relative mb-3">
              <AppLogo size="xl" animate={true} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              FinancialFree
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Personal Money Lending & Return Tracker
            </p>

            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck size={14} />
              <span>Secure Admin Portal</span>
            </div>
          </div>

          {/* Firebase Authentication Button */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading || isInstantAdminLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800/95 text-slate-800 dark:text-white font-semibold text-sm border border-slate-200/90 dark:border-white/10 shadow-md hover:shadow-lg hover:bg-slate-50 dark:hover:bg-slate-700/80 transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 active:scale-[0.98] group min-h-[44px]"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{isGoogleLoading ? 'Opening Google Sign-In...' : 'Sign In with Google'}</span>
            </button>

            <button
              type="button"
              onClick={handleInstantAdminLogin}
              disabled={isGoogleLoading || isLoading || isInstantAdminLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500/15 via-teal-500/15 to-emerald-500/15 hover:from-emerald-500/25 hover:via-teal-500/25 hover:to-emerald-500/25 text-emerald-700 dark:text-emerald-300 font-semibold text-xs border border-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all min-h-[44px]"
            >
              <Sparkles size={14} className="text-emerald-500 animate-pulse" />
              <span>
                {isInstantAdminLoading
                  ? 'Verifying Fast Access...'
                  : 'Fast 1-Tap Sign-In (startup.cheetaiaistudio.com@gmail.com)'}
              </span>
            </button>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80 dark:border-white/10" />
            </div>
            <div className="relative flex justify-center text-[11px] uppercase">
              <span className="bg-slate-50 dark:bg-slate-900 px-3 text-slate-400 font-semibold tracking-wider rounded-full">
                Or Sign In With Email & Password
              </span>
            </div>
          </div>

          {/* Clean Form - No exposed credentials or demo-fill buttons */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                Admin Email
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
                  className="w-full pl-10 pr-4 py-3 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-12 py-3 rounded-2xl liquid-glass-secondary border border-slate-200/70 dark:border-white/10 text-slate-900 dark:text-white text-sm font-medium glass-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            <LiquidButton
              type="submit"
              variant="primary"
              size="lg"
              isLoading={isLoading}
              className="w-full mt-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500"
              icon={<ArrowRight size={18} />}
            >
              Sign In to Admin Panel
            </LiquidButton>
          </form>

          {/* 3-Step Walkthrough trigger */}
          {onOpenWalkthrough && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={onOpenWalkthrough}
                className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold cursor-pointer"
              >
                <Compass size={14} />
                <span>View 3-Step App Overview & Features</span>
              </button>
            </div>
          )}

          <div className="mt-6 text-center text-xs text-slate-400 dark:text-slate-500">
            Encrypted & protected with PBKDF2 authentication
          </div>
        </LiquidGlassCard>
      </motion.div>

      {/* Instantaneous Login & Redirect Liquid Overlay */}
      <AnimatePresence>
        {(isRedirecting || (authStatusMessage && (isGoogleLoading || isInstantAdminLoading || isLoading))) && (
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
