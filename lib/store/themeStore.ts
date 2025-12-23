import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDark: boolean;
  setIsDark: (isDark: boolean) => void;
}

const webStorage = {
  getItem: async (name: string) => {
    try {
      return localStorage.getItem(name);
    } catch (error) {
      console.error('Error getting item from localStorage:', error);
      return null;
    }
  },
  setItem: async (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
    } catch (error) {
      console.error('Error setting item in localStorage:', error);
    }
  },
  removeItem: async (name: string) => {
    try {
      localStorage.removeItem(name);
    } catch (error) {
      console.error('Error removing item from localStorage:', error);
    }
  },
};

const isWeb = Platform.OS === 'web';

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      isDark: true,
      setMode: (mode) => {
        set({ mode });
        // Apply theme to DOM on web
        if (isWeb && typeof document !== 'undefined') {
          try {
            const html = document.documentElement;
            const isDark = mode === 'dark' || 
              (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            
            if (isDark) {
              html.classList.add('dark');
            } else {
              html.classList.remove('dark');
            }
            set({ isDark });
          } catch (error) {
            console.warn('Error setting theme:', error);
          }
        }
      },
      setIsDark: (isDark) => set({ isDark }),
    }),
    {
      name: 'app-theme',
      storage: isWeb ? webStorage : AsyncStorage,
      partialize: (state) => ({ mode: state.mode }),
    }
  )
);

// Watch system color scheme changes on web
if (isWeb && typeof window !== 'undefined') {
  try {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      const state = useThemeStore.getState();
      if (state.mode === 'system') {
        state.setMode('system');
      }
    });
  } catch (error) {
    console.warn('Could not initialize media query listener:', error);
  }
}
