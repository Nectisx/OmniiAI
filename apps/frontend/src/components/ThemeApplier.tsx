'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Theme } from '@omniai/types';

/**
 * Applique le thème de l'utilisateur (DARK / LIGHT / SYSTEM)
 * sur l'élément <html> en ajoutant la classe correspondante.
 * Doit être monté au top du tree (dans Providers).
 */
export function ThemeApplier() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const root = document.documentElement;
    const themePref: Theme = (user?.theme as Theme) ?? Theme.DARK;

    const apply = (theme: 'dark' | 'light') => {
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
      root.setAttribute('data-theme', theme);
    };

    if (themePref === Theme.SYSTEM) {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      apply(mq.matches ? 'dark' : 'light');
      const handler = (e: MediaQueryListEvent) => apply(e.matches ? 'dark' : 'light');
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else if (themePref === Theme.LIGHT) {
      apply('light');
    } else {
      apply('dark');
    }
  }, [user?.theme]);

  return null;
}
