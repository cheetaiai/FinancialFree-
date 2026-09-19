import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, RefreshCw, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    hcaptcha?: {
      render: (container: string | HTMLElement, options: any) => string;
      reset: (widgetId?: string) => void;
      getResponse: (widgetId?: string) => string;
      remove: (widgetId?: string) => void;
    };
  }
}

export const HCAPTCHA_SITE_KEY = '3bb6adea-325c-43d8-83b2-53548e2c8f9a';

interface HCaptchaWidgetProps {
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: (err: any) => void;
  theme?: 'light' | 'dark';
}

export const HCaptchaWidget: React.FC<HCaptchaWidgetProps> = ({
  onVerify,
  onExpire,
  onError,
  theme = 'dark'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let checkInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current) return;

      if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
        try {
          if (widgetIdRef.current !== null) {
            try {
              window.hcaptcha.reset(widgetIdRef.current);
            } catch {}
            return;
          }

          // Clear any existing content in container
          containerRef.current.innerHTML = '';

          const widgetId = window.hcaptcha.render(containerRef.current, {
            sitekey: HCAPTCHA_SITE_KEY,
            theme: theme === 'dark' ? 'dark' : 'light',
            size: 'normal',
            'callback': (token: string) => {
              if (isMounted) {
                setIsVerified(true);
                onVerify(token);
              }
            },
            'expired-callback': () => {
              if (isMounted) {
                setIsVerified(false);
                if (onExpire) onExpire();
              }
            },
            'error-callback': (err: any) => {
              if (isMounted) {
                setIsVerified(false);
                if (onError) onError(err);
              }
            }
          });

          widgetIdRef.current = widgetId;
          setIsReady(true);
        } catch (err: any) {
          console.warn('hCaptcha render attempt error:', err);
        }
      }
    };

    if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
      renderWidget();
    } else {
      // Poll every 300ms until hCaptcha script is ready
      let attempts = 0;
      checkInterval = setInterval(() => {
        attempts++;
        if (window.hcaptcha && typeof window.hcaptcha.render === 'function') {
          if (checkInterval) clearInterval(checkInterval);
          renderWidget();
        } else if (attempts > 35) {
          if (checkInterval) clearInterval(checkInterval);
          if (isMounted) {
            setLoadError('Security captcha taking longer than expected. Please check your network connection.');
          }
        }
      }, 300);
    }

    return () => {
      isMounted = false;
      if (checkInterval) clearInterval(checkInterval);
      if (widgetIdRef.current && window.hcaptcha) {
        try {
          window.hcaptcha.remove(widgetIdRef.current);
        } catch {}
        widgetIdRef.current = null;
      }
    };
  }, [theme, onVerify, onExpire, onError]);

  return (
    <div className="w-full flex flex-col items-center justify-center p-3 rounded-2xl liquid-glass-secondary border border-blue-500/20 my-2.5 space-y-2">
      <div className="flex items-center justify-between w-full text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-1">
        <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
          <ShieldCheck size={14} className="text-blue-500" />
          <span>Mandatory Security Verification</span>
        </span>
        {isVerified ? (
          <span className="text-emerald-500 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Verified
          </span>
        ) : (
          <span className="text-amber-500/90 text-[10px]">Captcha Required</span>
        )}
      </div>

      <div
        ref={containerRef}
        className="min-h-[78px] flex items-center justify-center w-full overflow-hidden rounded-xl"
      >
        {!isReady && !loadError && (
          <div className="flex items-center gap-2 text-xs text-slate-400 py-4">
            <RefreshCw size={14} className="animate-spin text-blue-500" />
            <span>Loading hCaptcha widget...</span>
          </div>
        )}
        {loadError && (
          <div className="flex items-center gap-2 text-xs text-amber-500 py-2">
            <AlertCircle size={14} />
            <span>{loadError}</span>
          </div>
        )}
      </div>

      <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
        Protected by hCaptcha · All accounts & admins must verify
      </div>
    </div>
  );
};
