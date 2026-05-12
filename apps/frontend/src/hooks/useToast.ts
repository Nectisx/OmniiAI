'use client';

import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
}

// Simple global toast store
let toastListeners: Array<(toast: Toast) => void> = [];

export function useToast() {
  const toast = useCallback(({ title, description, variant = 'default' }: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    const newToast: Toast = { id, title, description, variant };
    toastListeners.forEach(fn => fn(newToast));
  }, []);

  return { toast };
}

export function useToastListener(callback: (toast: Toast) => void) {
  toastListeners.push(callback);
  return () => {
    toastListeners = toastListeners.filter(fn => fn !== callback);
  };
}

export type { Toast };
