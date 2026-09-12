import React, { useState } from 'react';
import { Smartphone, Download, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../lib/usePWAInstall';
import { MobileAppShowcaseModal } from './MobileAppShowcaseModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'button' | 'compact';
  onSelectDeviceMode?: (mode: 'responsive' | 'iphone' | 'android' | 'tablet') => void;
  currentDeviceMode?: 'responsive' | 'iphone' | 'android' | 'tablet';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
  onSelectDeviceMode,
  currentDeviceMode = 'responsive'
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid } = usePWAInstall();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${className}`}
          title="Mobile App (Android / iPhone / Tablet)"
          aria-label="Mobile App Showcase"
        >
          <Smartphone size={18} className="text-blue-500" />
        </button>

        <MobileAppShowcaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentDeviceMode={currentDeviceMode}
          onSelectDeviceMode={onSelectDeviceMode}
        />
      </>
    );
  }

  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            isInstalled
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
          } ${className}`}
        >
          {isInstalled ? (
            <>
              <CheckCircle2 size={15} />
              <span>Installed App</span>
            </>
          ) : (
            <>
              <Smartphone size={15} />
              <span>Install Mobile App</span>
            </>
          )}
        </button>

        <MobileAppShowcaseModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          currentDeviceMode={currentDeviceMode}
          onSelectDeviceMode={onSelectDeviceMode}
        />
      </>
    );
  }

  // Navbar variant: stylish pill that looks great on mobile, tablet, and desktop
  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-blue-500/20 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold transition-all cursor-pointer select-none ${className}`}
        title="Mobile App: Android & iPhone PWA, Icons, and Phone/Tablet Simulator"
      >
        <Smartphone size={14} className="text-blue-500 flex-shrink-0" />
        <span className="hidden sm:inline">Mobile App</span>
        <span className="sm:hidden text-[11px]">App</span>
      </button>

      <MobileAppShowcaseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentDeviceMode={currentDeviceMode}
        onSelectDeviceMode={onSelectDeviceMode}
      />
    </>
  );
};
