import React, { createContext, useContext, useEffect, useState, useRef } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('financialfree_theme');
      return (saved as Theme) || 'system';
    } catch {
      return 'system';
    }
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const isInitialMount = useRef(true);
  const isTransitioningRef = useRef(false);

  // Trigger smooth transition CSS class on root element
  const triggerTransitionClass = () => {
    try {
      const root = document.documentElement;
      root.classList.add('theme-transitioning');
      window.setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 400);
    } catch {}
  };

  useEffect(() => {
    try {
      localStorage.setItem('financialfree_theme', theme);
    } catch {}

    const updateResolved = () => {
      let isDark = false;
      if (theme === 'system') {
        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      } else {
        isDark = theme === 'dark';
      }

      setResolvedTheme(isDark ? 'dark' : 'light');

      const applyTheme = () => {
        const root = document.documentElement;
        if (isDark) {
          root.classList.add('dark');
        } else {
          root.classList.remove('dark');
        }
      };

      // On initial page load, apply theme immediately without view transition animation
      if (isInitialMount.current) {
        isInitialMount.current = false;
        applyTheme();
        return;
      }

      triggerTransitionClass();

      // Safe Modern View Transitions API check
      // Prevents "Transition was skipped. New ViewTransition started" errors
      if (
        !isTransitioningRef.current &&
        'startViewTransition' in document &&
        typeof (document as any).startViewTransition === 'function'
      ) {
        try {
          isTransitioningRef.current = true;
          const transition = (document as any).startViewTransition(() => {
            applyTheme();
          });

          if (transition && typeof transition.catch === 'function') {
            transition.catch(() => {});
          }

          if (transition && transition.ready && typeof transition.ready.catch === 'function') {
            transition.ready.catch(() => {});
          }

          if (transition && transition.updateCallbackDone && typeof transition.updateCallbackDone.catch === 'function') {
            transition.updateCallbackDone.catch(() => {});
          }

          if (transition && transition.finished) {
            transition.finished
              .catch(() => {})
              .finally(() => {
                isTransitioningRef.current = false;
              });
          } else {
            isTransitioningRef.current = false;
          }
        } catch {
          isTransitioningRef.current = false;
          applyTheme();
        }
      } else {
        applyTheme();
      }
    };

    updateResolved();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => {
      if (theme === 'system') updateResolved();
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    triggerTransitionClass();
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    triggerTransitionClass();
    const nextTheme: Theme = resolvedTheme === 'dark' ? 'light' : 'dark';
    setThemeState(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
