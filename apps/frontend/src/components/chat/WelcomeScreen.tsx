'use client';

import { motion } from 'framer-motion';
import { Code2, Mail, Brain, Database } from 'lucide-react';
import { useT } from '@/lib/i18n';

interface WelcomeScreenProps {
  onSuggestionClick: (text: string) => void;
}

export function WelcomeScreen({ onSuggestionClick }: WelcomeScreenProps) {
  const t = useT();

  const SUGGESTIONS = [
    {
      icon: Code2,
      title: t('welcome.codeReview.title'),
      description: t('welcome.codeReview.desc'),
      prompt: t('welcome.codeReview.prompt'),
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      icon: Mail,
      title: t('welcome.email.title'),
      description: t('welcome.email.desc'),
      prompt: t('welcome.email.prompt'),
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      icon: Brain,
      title: t('welcome.learn.title'),
      description: t('welcome.learn.desc'),
      prompt: t('welcome.learn.prompt'),
      color: 'text-violet-400',
      bg: 'bg-violet-500/10',
    },
    {
      icon: Database,
      title: t('welcome.arch.title'),
      description: t('welcome.arch.desc'),
      prompt: t('welcome.arch.prompt'),
      color: 'text-cyan-400',
      bg: 'bg-cyan-500/10',
    },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
      <motion.div
        className="text-center max-w-md w-full"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-omni flex items-center justify-center text-white font-bold text-2xl mx-auto mb-5 shadow-lg shadow-cyan-500/20">
          O
        </div>

        <h2 className="text-xl font-semibold text-[var(--text)] mb-2">
          {t('chat.welcome')}
        </h2>
        <p className="text-sm text-[var(--text2)] leading-relaxed mb-8">
          {t('chat.welcomeSub')}
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {SUGGESTIONS.map((s, i) => (
            <motion.button
              key={i}
              onClick={() => onSuggestionClick(s.prompt)}
              className="text-left p-3 rounded-xl border border-[var(--border)] bg-[var(--bg3)] hover:border-[var(--border2)] hover:bg-[var(--bg4)] transition-all group"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 + 0.2 }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className={`w-7 h-7 rounded-lg ${s.bg} flex items-center justify-center mb-2`}>
                <s.icon size={14} className={s.color} />
              </div>
              <div className="text-[13px] font-medium text-[var(--text)] mb-0.5">{s.title}</div>
              <div className="text-[11px] text-[var(--text3)]">{s.description}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
