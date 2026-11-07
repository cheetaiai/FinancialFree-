import React, { useState } from 'react';
import { AppLegalPoliciesModal, LegalPolicyTab } from '../legal/AppLegalPoliciesModal';
import { playTickSound } from '../../lib/soundEffects';

interface AppBrandFooterProps {
  className?: string;
}

export const AppBrandFooter: React.FC<AppBrandFooterProps> = ({ className = '' }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<LegalPolicyTab>('terms');

  const openPolicy = (tab: LegalPolicyTab) => {
    try {
      playTickSound();
    } catch {}
    setSelectedTab(tab);
    setModalOpen(true);
  };

  return (
    <>
      <div className={`w-full py-8 sm:py-10 flex flex-col items-center justify-center text-center space-y-4 ${className}`}>
        {/* Brand Header */}
        <div className="space-y-1">
          <div className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center justify-center gap-2">
            <span>FinancialFree</span>
          </div>

          <div className="text-xs font-bold text-slate-600 dark:text-slate-400 flex items-center justify-center gap-1.5">
            <span>🇮🇳</span>
            <span>Crafted & Owned by India</span>
            <span>🇮🇳</span>
          </div>
        </div>

        {/* Legal & Policy Links (Styled exactly like Paytm footer in attachment) */}
        <div className="max-w-md mx-auto text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-medium px-4">
          <button
            type="button"
            onClick={() => openPolicy('terms')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Terms & Conditions
          </button>
          <span className="mx-1.5 text-slate-400 dark:text-slate-600">,</span>

          <button
            type="button"
            onClick={() => openPolicy('privacy')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Privacy policy
          </button>
          <span className="mx-1.5 text-slate-400 dark:text-slate-600">,</span>

          <br className="hidden sm:inline" />

          <button
            type="button"
            onClick={() => openPolicy('grievance')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Grievance
          </button>
          <span className="mx-1.5 text-slate-400 dark:text-slate-600">,</span>

          <button
            type="button"
            onClick={() => openPolicy('grievance')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Redressal Mechanism
          </button>
          <span className="mx-1.5 text-slate-400 dark:text-slate-600">,</span>

          <button
            type="button"
            onClick={() => openPolicy('mechanics')}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Admin Mechanics
          </button>
          <span className="mx-1.5 text-slate-400 dark:text-slate-600">,</span>

          <button
            type="button"
            onClick={() => openPolicy('terms')}
            className="text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
          >
            See all policies
          </button>
        </div>

        {/* Clean Version Number (Matching the Paytm footer attachment) */}
        <div className="pt-1">
          <span className="font-mono text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 tracking-wider">
            v.5.5.5.0
          </span>
        </div>
      </div>

      {/* Interactive Policy Modal */}
      <AppLegalPoliciesModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        initialTab={selectedTab}
      />
    </>
  );
};
