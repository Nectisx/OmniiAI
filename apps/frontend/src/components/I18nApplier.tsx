'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Language } from '@omniai/types';

/**
 * Applique l'attribut lang sur <html> en fonction du user.langue
 */
export function I18nApplier() {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const lang = user?.langue === Language.EN ? 'en' : 'fr';
    document.documentElement.setAttribute('lang', lang);
  }, [user?.langue]);

  return null;
}
