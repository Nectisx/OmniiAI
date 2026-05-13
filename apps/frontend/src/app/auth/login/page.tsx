'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function LoginPage() {
  const t = useT();
  const { login, isLoggingIn, loginError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = t('auth.invalidEmail');
    }
    if (!password) {
      newErrors.password = t('auth.passwordRequired');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await login({ email, password });
    } catch {
      // Géré par le hook
    }
  };

  const errorMessage = loginError
    ? ((loginError as any)?.response?.data?.error || 'Identifiants incorrects')
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl bg-[var(--cyan)]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl bg-[var(--violet)]" />
      </div>

      <motion.div
        className="w-full max-w-[380px]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-omni flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-cyan-500/20">
            O
          </div>
          <h1 className="text-2xl font-bold text-[var(--text)]">OmniAI</h1>
          <p className="text-sm text-[var(--text2)] mt-1">{t('auth.tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
          <h2 className="text-base font-semibold text-[var(--text)] mb-5">{t('auth.loginTitle')}</h2>

          {/* Global error */}
          {errorMessage && (
            <motion.div
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[13px]"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {errorMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                placeholder="votre@email.com"
                autoComplete="email"
                className={cn(
                  'w-full bg-[var(--bg3)] border rounded-xl px-3.5 py-2.5 text-[13px]',
                  'text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors',
                  errors.email
                    ? 'border-red-500 focus:border-red-400'
                    : 'border-[var(--border)] focus:border-[var(--cyan)]',
                )}
              />
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    'w-full bg-[var(--bg3)] border rounded-xl px-3.5 py-2.5 pr-10 text-[13px]',
                    'text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors',
                    errors.password
                      ? 'border-red-500 focus:border-red-400'
                      : 'border-[var(--border)] focus:border-[var(--cyan)]',
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)]"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] transition-all',
                isLoggingIn
                  ? 'bg-[var(--bg4)] text-[var(--text3)] cursor-not-allowed'
                  : 'bg-[var(--cyan)] text-[#0a1520] hover:bg-[var(--cyan2)]',
              )}
            >
              {isLoggingIn ? (
                <>
                  <div className="w-4 h-4 border-2 border-[var(--text3)] border-t-transparent rounded-full animate-spin" />
                  {t('auth.signingIn')}
                </>
              ) : (
                <>
                  {t('auth.signIn')}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[var(--border)] text-center">
            <p className="text-[12px] text-[var(--text3)]">
              {t('auth.noAccount')}{' '}
              <Link href="/auth/register" className="text-[var(--cyan)] hover:text-[var(--cyan2)] font-medium">
                {t('auth.toRegister')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-[var(--text3)] mt-6">
          OmniAI v1.0 — CNAM USAL59 — 2025-2026
        </p>
      </motion.div>
    </div>
  );
}
