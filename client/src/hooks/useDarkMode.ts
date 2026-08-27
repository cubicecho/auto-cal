import { storage } from '@/storage';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

/**
 * Dark mode is a `dark` class on `<html>` plus a `theme` entry in storage.
 *
 * Both layouts need it — the root layout covers the unauthenticated `/auth`
 * screens, the app layout owns the header toggle — and each had grown its own
 * copy of the preference lookup, which is how they ended up disagreeing about
 * whether merely reading the OS preference should persist it.
 *
 * It does not: `theme` is written only by `setDark`, so an untouched account
 * keeps following the OS. The two hook instances never need to agree at
 * runtime, because whichever one is mounted applies the same class.
 */
function getInitialDark(): boolean {
  if (Platform.OS !== 'web') return false;
  const stored = storage.getItem('theme');
  if (stored) return stored === 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function useDarkMode() {
  const [dark, setDarkState] = useState(getInitialDark);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  function setDark(next: boolean) {
    storage.setItem('theme', next ? 'dark' : 'light');
    setDarkState(next);
  }

  return [dark, setDark] as const;
}
