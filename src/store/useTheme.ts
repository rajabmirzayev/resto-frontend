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
          const isDark = resolveDark(state.theme);
          applyTheme(isDark);
          state.isDark = isDark;
        }
      },
    }
  )
);

export function initTheme() {
  const saved = localStorage.getItem('tabler-theme');
  let theme: Theme = 'system';
  if (saved) {
    try {
      theme = JSON.parse(saved).state.theme;
    } catch {}
  }
  const isDark = resolveDark(theme);
  applyTheme(isDark);
}
