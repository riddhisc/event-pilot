import { create } from 'zustand';

const storedTheme = typeof localStorage === 'undefined'
  ? 'light'
  : (localStorage.getItem('eventbuddy.theme') || 'light');

export const useUiStore = create((set) => ({
  theme: storedTheme,
  sidebarOpen: true,
  clientId: 'tenant-northwind',
  setTheme: (theme) => {
    localStorage.setItem('eventbuddy.theme', theme);
    document.documentElement.dataset.theme = theme;
    set({ theme });
  },
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setClientId: (clientId) => set({ clientId }),
}));
