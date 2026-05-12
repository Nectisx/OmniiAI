'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToastListener, type Toast } from '@/hooks/useToast';
import { cn } from '@/lib/utils';

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = useToastListener((toast) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map(toast => (
          <motion.div
            key={toast.id}
            className={cn(
              'pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border shadow-xl max-w-[320px]',
              'bg-[var(--bg4)] border-[var(--border2)]',
            )}
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            {toast.variant === 'destructive' ? (
              <AlertCircle size={16} className="text-red-400 mt-0.5 flex-shrink-0" />
            ) : toast.variant === 'success' ? (
              <CheckCircle size={16} className="text-green-400 mt-0.5 flex-shrink-0" />
            ) : (
              <Info size={16} className="text-[var(--cyan)] mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-medium text-[var(--text)] leading-snug">{toast.title}</p>
              {toast.description && (
                <p className="text-[11px] text-[var(--text3)] mt-0.5">{toast.description}</p>
              )}
            </div>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-[var(--text3)] hover:text-[var(--text)] flex-shrink-0"
            >
              <X size={14} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
