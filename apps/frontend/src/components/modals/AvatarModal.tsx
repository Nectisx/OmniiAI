'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Link as LinkIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

interface AvatarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string | null;
  initials: string;
  onSave: (avatar: string | null) => void;
}

// 12 emojis-avatars proposés
const PRESET_EMOJIS = ['🦊', '🐱', '🐼', '🐧', '🦁', '🐯', '🐸', '🦉', '🐺', '🦄', '🤖', '👾'];

export function AvatarModal({ isOpen, onClose, currentAvatar, initials, onSave }: AvatarModalProps) {
  const t = useT();
  const [customUrl, setCustomUrl] = useState('');
  const [selected, setSelected] = useState<string | null>(currentAvatar ?? null);

  const isEmoji = selected && [...selected].length <= 4 && !selected.startsWith('http');

  const handleSave = () => {
    onSave(selected);
    onClose();
  };

  const handleSelectEmoji = (emoji: string) => {
    setSelected(emoji);
    setCustomUrl('');
  };

  const handleSelectUrl = () => {
    if (customUrl.trim()) {
      setSelected(customUrl.trim());
    }
  };

  const handleClear = () => {
    setSelected(null);
    setCustomUrl('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          <motion.div
            className="relative w-[420px] rounded-2xl border border-[var(--border2)] p-5 shadow-2xl"
            style={{ background: 'var(--bg2)' }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[var(--text)]">{t('settings.changeAvatar')}</h2>
                <p className="text-xs text-[var(--text3)] mt-0.5">{t('settings.avatarHelp')}</p>
              </div>
              <button onClick={onClose} className="text-[var(--text3)] hover:text-[var(--text)] transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Preview */}
            <div className="flex items-center justify-center mb-5 p-4 bg-[var(--bg3)] border border-[var(--border)] rounded-xl">
              <div className="w-20 h-20 rounded-full bg-gradient-omni flex items-center justify-center text-white font-bold text-3xl overflow-hidden">
                {selected ? (
                  isEmoji ? (
                    <span className="text-4xl">{selected}</span>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={selected} alt="avatar" className="w-full h-full object-cover" onError={() => setSelected(null)} />
                  )
                ) : (
                  initials
                )}
              </div>
            </div>

            {/* Preset emojis */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-[var(--text2)] mb-2 uppercase tracking-wider">
                {t('settings.avatarEmoji')}
              </label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleSelectEmoji(emoji)}
                    className={cn(
                      'aspect-square rounded-xl border-2 text-2xl flex items-center justify-center transition-all',
                      selected === emoji
                        ? 'border-[var(--cyan)] bg-[rgba(0,180,204,0.07)]'
                        : 'border-[var(--border)] hover:border-[var(--border2)]',
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL */}
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-[var(--text2)] mb-2 uppercase tracking-wider">
                {t('settings.avatarUrl')}
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text3)]" />
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://example.com/avatar.png"
                    className="w-full bg-[var(--bg3)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-[12px] text-[var(--text)] outline-none focus:border-[var(--cyan)] transition-colors"
                  />
                </div>
                <button
                  onClick={handleSelectUrl}
                  disabled={!customUrl.trim()}
                  className="px-3 py-2 rounded-xl bg-[var(--cyan)] text-[#0a1520] text-[12px] font-semibold hover:bg-[var(--cyan2)] transition-colors disabled:opacity-40"
                >
                  <Check size={14} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-[var(--border)]">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--border)] text-[12px] text-[var(--danger)] hover:bg-red-500/10 transition-colors"
              >
                <Trash2 size={13} />
                {t('settings.avatarReset')}
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-3 py-2 rounded-xl border border-[var(--border)] text-[12px] text-[var(--text2)] hover:border-[var(--border2)] hover:text-[var(--text)] transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-[var(--cyan)] text-[#0a1520] text-[12px] font-semibold hover:bg-[var(--cyan2)] transition-colors"
              >
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
