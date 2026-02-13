import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Universal storage adapter for web + native platforms
 * - Web: Uses localStorage
 * - Native: Uses AsyncStorage
 */
export const clientStorage = Platform.OS === 'web'
  ? {
      getItem: (key: string) => {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    }
  : {
      getItem: AsyncStorage.getItem,
      setItem: AsyncStorage.setItem,
      removeItem: AsyncStorage.removeItem,
    };
