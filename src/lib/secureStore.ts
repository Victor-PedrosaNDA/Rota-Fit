import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Fallback para web (SecureStore não funciona no browser)
const webFallback = {
  getItemAsync: async (key: string) => localStorage.getItem(key),
  setItemAsync: async (key: string, value: string) => localStorage.setItem(key, value),
  deleteItemAsync: async (key: string) => localStorage.removeItem(key),
};

const store = Platform.OS === 'web' ? webFallback : SecureStore;

export const getSecureItem    = (key: string) => store.getItemAsync(key);
export const setSecureItem    = (key: string, value: string) => store.setItemAsync(key, value);
export const deleteSecureItem = (key: string) => store.deleteItemAsync(key);
