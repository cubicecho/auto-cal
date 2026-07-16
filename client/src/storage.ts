import { Platform } from 'react-native';

// Synchronous wrapper on web (localStorage); async storage swap point for native.
// TODO: replace the native stubs with AsyncStorage when adding native support.
export const storage = {
  getItem(key: string): string | null {
    if (Platform.OS === 'web') return window.localStorage.getItem(key);
    return null;
  },
  setItem(key: string, value: string): void {
    if (Platform.OS === 'web') window.localStorage.setItem(key, value);
  },
  removeItem(key: string): void {
    if (Platform.OS === 'web') window.localStorage.removeItem(key);
  },
};
