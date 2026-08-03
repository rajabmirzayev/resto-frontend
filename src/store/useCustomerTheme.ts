import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CustomerThemeId = 'classic' | 'emerald' | 'sunset' | 'rose' | 'violet' | 'amber';

interface CustomerThemeState {
  theme: CustomerThemeId;
  setTheme: (theme: CustomerThemeId) => void;
}

export const useCustomerTheme = create<CustomerThemeState>()(
  persist(
    (set) => ({
      theme: 'classic',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'restoflow-customer-theme',
    }
  )
);
