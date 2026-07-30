import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark' | 'system';

interface ThemeState {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleDark: () => void;
}

function getSystemDark(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolveDark(theme: Theme): boolean {
  if (theme === 'dark') return true;
  if (theme === 'light') return false;
  return getSystemDark();
}

function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
}

export const useTheme = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'system',
      isDark: false,
      setTheme: (theme) => {
        const isDark = resolveDark(theme);
        applyTheme(isDark);
        set({ theme, isDark });
      },
      toggleDark: () => {
        const current = get().theme;
        const next: Theme = current === 'dark' ? 'light' : 'dark';
        const isDark = resolveDark(next);
        applyTheme(isDark);
        set({ theme: next, isDark });
      },
    }),
    {
      name: 'tabler-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(resolveDark(state.theme));
        }
      },
      merge: (persisted, current) => {
        const base = { ...current, ...(typeof persisted === 'object' && persisted ? persisted : {}) };
        if (typeof persisted === 'object' && persisted && 'theme' in persisted) {
          const p = persisted as Record<string, unknown>;
          if (p.theme === 'light' || p.theme === 'dark' || p.theme === 'system') {
            base.isDark = resolveDark(p.theme as Theme);
          }
        }
        return base;
      },
    }
  )
);

export function initTheme() {
  try {
    const saved = localStorage.getItem('tabler-theme');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.state?.theme) {
        const isDark = resolveDark(parsed.state.theme);
        applyTheme(isDark);
        return;
      }
    }
  } catch {}
  applyTheme(getSystemDark());
}
