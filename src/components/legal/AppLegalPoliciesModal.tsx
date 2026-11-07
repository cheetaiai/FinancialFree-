import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  ShieldCheck,
  Lock,
  Scale,
  Mail,
  ExternalLink,
  X,
  Search,
  CheckCircle2,
  Building,
  MapPin,
  Globe,
  AlertCircle,
  Activity,
  Cpu
} from 'lucide-react';
import { LiquidButton } from '../ui/LiquidButton';
import { playTickSound } from '../../lib/soundEffects';

export type LegalPolicyTab = 'terms' | 'privacy' | 'grievance' | 'mechanics';

interface AppLegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalPolicyTab;
}

export const AppLegalPoliciesModal: React.FC<AppLegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'terms'
}) => {
  const [activeTab, setActiveTab] = useState<LegalPolicyTab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const handleTabChange = (tab: LegalPolicyTab) => {
    try {
      playTickSound();
    } catch {}
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-xl overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl border border-slate-200 dark:border-white/15 bg-white/95 dark:bg-slate-900/95 shadow-[0_25px_70px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden my-auto"
      >
        {/* Modal Top Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-slate-50/80 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-400 p-0.5 shadow-md flex items-center justify-center shrink-0">
              <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Scale size={20} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  FinancialFree Policies & Legal Compliance
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                  Verified Legal Entity
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Andhra Pradesh, India • Https://financialfree.vercel.app
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close legal modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigation Controls */}
        <div className="px-5 py-2.5 sm:px-7 border-b border-slate-200/80 dark:border-white/10 bg-slate-100/60 dark:bg-slate-900/60 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <button
              type="button"
              onClick={() => handleTabChange('terms')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
              }`}
            >
              <FileText size={14} />
              <span>Terms & Conditions</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('privacy')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'privacy'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
              }`}
            >
              <ShieldCheck size={14} />
              <span>Privacy Policy</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('grievance')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'grievance'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
              }`}
            >
              <Building size={14} />
              <span>Grievance Redressal</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('mechanics')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'mechanics'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                  : 'bg-white/60 dark:bg-white/5 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10'
              }`}
            >
              <Activity size={14} />
              <span>Admin Mechanics</span>
            </button>
          </div>

          <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
            Last Updated: Nov 04, 2026
          </div>
        </div>

        {/* Scrollable Policy Content Area with Crisp Typography */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6 text-slate-800 dark:text-slate-200 text-xs sm:text-sm leading-relaxed">
          {activeTab === 'terms' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-blue-600 dark:text-blue-400" />
                  <span>Terms and Conditions Summary</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  These Terms govern access and use of the FinancialFree web and mobile application (Https://financialfree.vercel.app), provided from Andhra Pradesh, India.
                </p>
              </div>

              <div className="space-y-4 prose prose-slate dark:prose-invert max-w-none">
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Interpretation and Definitions</h4>
                  <ul className="list-disc pl-5 space-y-1.5 text-slate-700 dark:text-slate-300">
                    <li><strong>Company:</strong> Refers to <em>FinancialFree</em>, located in Andhra Pradesh, India.</li>
                    <li><strong>Service / Website:</strong> Refers to FinancialFree, accessible at <a href="https://financialfree.vercel.app" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 font-semibold underline">Https://financialfree.vercel.app</a>.</li>
                    <li><strong>Device:</strong> Means any device that can access the Service such as a computer, cell phone, or digital tablet.</li>
                    <li><strong>Terms and Conditions:</strong> Means these Terms and Conditions governing your access and forming the entire agreement regarding the Service.</li>
                  </ul>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Acknowledgment & User Eligibility</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    By accessing or using the Service, you agree to be bound by these Terms. You represent that you are over the age of 18. FinancialFree does not permit individuals under 18 to operate financial ledger accounting without guardian supervision.
                  </p>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Money Lending & Ledger Record Integrity</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    FinancialFree serves as a personal record-keeping, balance tracking, and reminder software. The user retains complete authority and legal responsibility over personal loan agreements, peer-to-peer money lending, and repayment settlements initiated using the application.
                  </p>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">4. Governing Law & Dispute Resolution</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    The laws of Andhra Pradesh, India, excluding its conflicts of law rules, govern these Terms and your use of the Service. In case of disputes, parties agree to first attempt informal resolution through our designated Grievance Redressal Mechanism.
                  </p>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">5. Contact Information</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    Questions regarding these Terms can be addressed directly to:
                  </p>
                  <div className="p-3 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1 font-mono text-xs">
                    <div>Email: <strong className="text-blue-600 dark:text-blue-400">startup.cheetaiaistudio.com@gmail.com</strong></div>
                    <div>Website: <strong className="text-blue-600 dark:text-blue-400">Shaikzakeerprofile.lovable.app</strong></div>
                    <div>Jurisdiction: <strong>Andhra Pradesh, India</strong></div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-1.5">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>Privacy Policy & Data Protection Overview</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  FinancialFree applies tri-tier cryptographic client-side storage, WebAuthn biometrics, and secure Firestore cloud sync.
                </p>
              </div>

              <div className="space-y-4">
                <section className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">1. Types of Data Collected</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    We collect personal information necessary to deliver personalized ledger accounting and peer-to-peer tracking:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 dark:text-slate-300">
                    <li>Account details: Email address, authorized username, encrypted credentials.</li>
                    <li>Ledger information: Contact names, transaction principal amounts, repayment records, and categories.</li>
                    <li>Usage data: IP addresses, device identifiers, and diagnostic metrics ensuring zero data-loss resilience.</li>
                  </ul>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">2. Zero Sale of Mobile or Personal Information</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    <strong>Strict Commitment:</strong> No mobile phone numbers, contact lists, financial figures, or user identities are ever sold, rented, or traded to third parties or marketing affiliates. Data is stored solely to provide your personal ledger calculations.
                  </p>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">3. Client-Side Vault & Security Measures</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    All financial transaction logs are buffered into your phone’s local hardware storage with WebAuthn biometrics support. Synchronization with Google Cloud Firestore occurs over encrypted TLS 1.3 tunnels with strict access rules.
                  </p>
                </section>

                <section className="space-y-2 pt-2 border-t border-slate-200 dark:border-white/10">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">4. Right to Deletion & Data Portability</h4>
                  <p className="text-slate-700 dark:text-slate-300">
                    You have full sovereignty over your information. At any point, you can export your entire database via Universal JSON or CSV, or permanently purge all member records directly from the Settings page.
                  </p>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'grievance' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-1.5">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Building size={16} className="text-amber-600 dark:text-amber-400" />
                  <span>Statutory Grievance & Redressal Mechanism</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Pursuant to the Information Technology Act of India and Digital Data Protection guidelines.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Designated Grievance Officer</div>
                  <div className="text-base font-black text-slate-900 dark:text-white">Shaik Zakeer</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">Compliance & User Rights Officer</div>
                  <div className="pt-2 border-t border-slate-200 dark:border-white/10 space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <Mail size={13} className="text-blue-600 dark:text-blue-400" />
                      <span>startup.cheetaiaistudio.com@gmail.com</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe size={13} className="text-teal-600 dark:text-teal-400" />
                      <span>Shaikzakeerprofile.lovable.app</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-rose-600 dark:text-rose-400" />
                      <span>Andhra Pradesh, India</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Resolution SLA Timelines</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Acknowledgment:</strong> Within 24 hours of grievance ticket submission.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>Investigation & Redressal:</strong> Within 15 business days maximum.</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span><strong>App Version Inquiries:</strong> Immediate assistance via official channel.</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs text-slate-600 dark:text-slate-400">
                To file an official grievance or request manual account reconciliation, email us with your user account ID and statement reference.
              </div>
            </div>
          )}

          {activeTab === 'mechanics' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-1.5">
                <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Cpu size={16} className="text-indigo-600 dark:text-indigo-400" />
                  <span>Admin Mechanics & Enterprise System Architecture</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Underlying administrative protocols, pipeline verification, and security boundaries powering FinancialFree v.6.5.4.0.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500" />
                    <span>6-Phase Pipeline Self-Test</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Automated multi-layer verification testing authentication, Firestore rules, WebAuthn biometrics, and dynamic share statement engines.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Activity size={14} className="text-blue-500" />
                    <span>Strict Manual Update Policy</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    The software will never auto-update without explicit user authorization and manual review. Updates are initiated solely upon user confirmation.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Lock size={14} className="text-indigo-500" />
                    <span>Tri-Tier Vault & Offline Buffer</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    4.0 GB allocated cache buffer with instant atomic writes to prevent data loss on unexpected power cuts, browser crashes, or network loss.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Scale size={14} className="text-teal-500" />
                    <span>Zero Data Leaks & Public Isolation</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Shared ledger links only display individual sanitized debtor/creditor balances with dynamic UPI codes, never exposing other user records.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 sm:px-7 border-t border-slate-200 dark:border-white/10 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-400">
            <span>FinancialFree v.6.5.4.0</span>
            <span>•</span>
            <span className="text-emerald-600 dark:text-emerald-400">🇮🇳 Crafted & Owned by India</span>
          </div>

          <LiquidButton variant="secondary" size="sm" onClick={onClose} className="font-bold text-xs">
            Done
          </LiquidButton>
        </div>
      </motion.div>
    </div>
  );
};
