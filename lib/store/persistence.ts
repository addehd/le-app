import { Platform } from 'react-native';
import { StateStorage } from 'zustand/middleware';

// Web-compatible storage implementation
const createWebStorage = (): StateStorage => {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        return localStorage.getItem(name);
      } catch (error) {
        console.error('Error getting item from localStorage:', error);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        localStorage.setItem(name, value);
      } catch (error) {
        console.error('Error setting item in localStorage:', error);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        localStorage.removeItem(name);
      } catch (error) {
        console.error('Error removing item from localStorage:', error);
      }
    },
  };
};

// Native storage implementation
const createNativeStorage = (): StateStorage => {
  let AsyncStorage: any;
  try {
    AsyncStorage = require('@react-native-async-storage/async-storage').default;
  } catch (error) {
    console.warn('AsyncStorage not available, falling back to memory storage');
    // Fallback to in-memory storage
    const memoryStorage = new Map<string, string>();
    return {
      getItem: async (name: string) => memoryStorage.get(name) || null,
      setItem: async (name: string, value: string) => { memoryStorage.set(name, value); },
      removeItem: async (name: string) => { memoryStorage.delete(name); },
    };
  }

  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const value = await AsyncStorage.getItem(name);
        return value;
      } catch (error) {
        console.error('Error getting item from AsyncStorage:', error);
        return null;
      }
    },
    setItem: async (name: string, value: string): Promise<void> => {
      try {
        await AsyncStorage.setItem(name, value);
      } catch (error) {
        console.error('Error setting item in AsyncStorage:', error);
      }
    },
    removeItem: async (name: string): Promise<void> => {
      try {
        await AsyncStorage.removeItem(name);
      } catch (error) {
        console.error('Error removing item from AsyncStorage:', error);
      }
    },
  };
};

// Export the appropriate storage based on platform
export const asyncStorage: StateStorage = Platform.OS === 'web' 
  ? createWebStorage() 
  : createNativeStorage();

// Storage configuration factory
export const createStorageConfig = (name: string) => ({
  name,
  storage: asyncStorage,
  // Only persist specific slices of state
  partialize: (state: any) => {
    // Remove any functions, temp state, or computed values
    const { _hasHydrated, ...persistedState } = state;
    return persistedState;
  },
});

// Helper to clear all app storage (useful for debugging/reset)
export const clearAllStorage = async (): Promise<void> => {
  try {
    if (Platform.OS === 'web') {
      // Web implementation
      const keys = Object.keys(localStorage).filter(key => key.startsWith('app-'));
      keys.forEach(key => localStorage.removeItem(key));
      console.log('Cleared all app storage (web)');
    } else {
      // Native implementation
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('app-'));
      await AsyncStorage.multiRemove(appKeys);
      console.log('Cleared all app storage (native)');
    }
  } catch (error) {
    console.error('Error clearing storage:', error);
  }
};

// Helper to get storage usage info
export const getStorageInfo = async (): Promise<{ keys: string[]; totalSize: number }> => {
  try {
    if (Platform.OS === 'web') {
      // Web implementation
      const keys = Object.keys(localStorage).filter(key => key.startsWith('app-'));
      let totalSize = 0;
      for (const key of keys) {
        const value = localStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      return { keys, totalSize };
    } else {
      // Native implementation
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const keys = await AsyncStorage.getAllKeys();
      const appKeys = keys.filter(key => key.startsWith('app-'));
      
      let totalSize = 0;
      for (const key of appKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          totalSize += new Blob([value]).size;
        }
      }
      
      return { keys: appKeys, totalSize };
    }
  } catch (error) {
    console.error('Error getting storage info:', error);
    return { keys: [], totalSize: 0 };
  }
};
