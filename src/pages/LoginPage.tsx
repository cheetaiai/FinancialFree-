import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { Wallet, Lock, Mail, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';
import { LiquidGlassCard } from '../components/ui/LiquidGlassCard';
import { LiquidButton } from '../components/ui/LiquidButton';

const ADMIN_PRESETS = [
  { label: 'Admin 1', email: 'startup.cheetaiaistudio.com@gmail.com' },
  { label: 'Admin 2', email: 'financiFinancial@free.com' },
  { label: 'Admin 3', email: 'noorjahan77027@gmail.com' }
];

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    await login(email, password);
    setIsLoading(false);
  };

  const handleSelectAdmin = (adminEmail: string) => {
    setEmail(adminEmail);
    setPassword('FinancialFree@321');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background ambient liquid glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="w-full max-w-md"
      >
        <LiquidGlassCard variant="floating" className="p-7 sm:p-9 border border-white/80 dark:border-white/10 shadow-2xl">
          {/* Logo & Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-4">
              <Wallet size={32} className="stroke-[2.2]" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              FinancialFree
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Personal Money Lending & Return Tracker
            </p>

            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold border border-emerald-500/20">
              <ShieldCheck size={14} />
              <span>Admin Access Only (3 Authorized Accounts)</span>
            </div>
          </div>

          {/* Quick Select Admin Badges */}
          <div className="mb-5 p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-white/5">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              <UserCheck size={13} />
              <span>Authorized Admin Accounts</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {ADMIN_PRESETS.map((admin) => (
                <button
                  key={admin.email}
                  type="button"
                  onClick={() => handleSelectAdmin(admin.email)}
                  className={`text-left text-xs px-2.5 py-1.5 rounded-xl transition-all flex items-center justify-between group ${
                    email.toLowerCase() === admin.email.toLowerCase()
                      ? 'bg-blue-600 text-white font-medium shadow-sm'
                      : 'bg-white/70 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 border border-slate-200/50 dark:border-white/5'
                  }`}
                >
                  <span className="truncate max-w-[240px] font-mono text-[11px]">{admin.email}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    email.toLowerCase() === admin.email.toLowerCase()
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:text-blue-600'
                  }`}>
                    {admin.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
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
                  placeholder="startup.cheetaiaistudio.com@gmail.com"
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
                  placeholder="FinancialFree@321"
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
              className="w-full mt-2"
              icon={<ArrowRight size={18} />}
            >
              Sign In as Admin
            </LiquidButton>
          </form>

          <div className="mt-5 text-center text-xs text-slate-400 dark:text-slate-500">
            Protected with PBKDF2 & Cloud Firestore synchronization
          </div>
        </LiquidGlassCard>
      </motion.div>
    </div>
  );
};
