'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export default function RegisterPage() {
  const t = useT();
  const { register, isRegistering, registerError } = useAuth();
  const [prenom, setPrenom] = useState('');
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [company, setCompany] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<{
    prenom?: string; nom?: string; email?: string; password?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!prenom.trim()) e.prenom = t('auth.firstNameRequired');
    if (!nom.trim()) e.nom = t('auth.lastNameRequired');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('auth.invalidEmail');
    if (password.length < 8) e.password = t('auth.passwordMin');
    else if (!/[A-Z]/.test(password)) e.password = t('auth.passwordUpper');
    else if (!/[0-9]/.test(password)) e.password = t('auth.passwordDigit');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await register({
        prenom,
        nom,
        email,
        password,
        company: company || undefined,
      });
    } catch { /* géré par hook */ }
  };

  const errorMsg = registerError
    ? ((registerError as any)?.response?.data?.error || "Erreur lors de l'inscription")
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl bg-[var(--violet)]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl bg-[var(--cyan)]" />
      </div>

      <motion.div className="w-full max-w-[400px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-omni flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-violet-500/20">O</div>
          <h1 className="text-2xl font-bold text-[var(--text)]">{t('auth.welcomeTitle')}</h1>
          <p className="text-sm text-[var(--text2)] mt-1">{t('auth.welcomeSub')}</p>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
          {errorMsg && (
            <motion.div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[13px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Prénom + Nom */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{t('auth.firstName')}</label>
                <input
                  type="text"
                  value={prenom}
                  onChange={(e) => { setPrenom(e.target.value); setErrors(p => ({ ...p, prenom: undefined })); }}
                  placeholder="Jean"
                  autoComplete="given-name"
                  className={cn(
                    'w-full bg-[var(--bg3)] border rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors',
                    errors.prenom ? 'border-red-500' : 'border-[var(--border)] focus:border-[var(--cyan)]',
                  )}
                />
                {errors.prenom && <p className="text-[11px] text-red-400 mt-1">{errors.prenom}</p>}
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{t('auth.lastName')}</label>
                <input
                  type="text"
                  value={nom}
                  onChange={(e) => { setNom(e.target.value); setErrors(p => ({ ...p, nom: undefined })); }}
                  placeholder="Dupont"
                  autoComplete="family-name"
                  className={cn(
                    'w-full bg-[var(--bg3)] border rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors',
                    errors.nom ? 'border-red-500' : 'border-[var(--border)] focus:border-[var(--cyan)]',
                  )}
                />
                {errors.nom && <p className="text-[11px] text-red-400 mt-1">{errors.nom}</p>}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{t('auth.email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined })); }}
                placeholder="jean@company.com"
                autoComplete="email"
                className={cn(
                  'w-full bg-[var(--bg3)] border rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors',
                  errors.email ? 'border-red-500' : 'border-[var(--border)] focus:border-[var(--cyan)]',
                )}
              />
              {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{t('auth.password')}</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined })); }}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={cn(
                    'w-full bg-[var(--bg3)] border rounded-xl px-3.5 py-2.5 pr-10 text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors',
                    errors.password ? 'border-red-500' : 'border-[var(--border)] focus:border-[var(--cyan)]',
                  )}
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)]">
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && <p className="text-[11px] text-red-400 mt-1">{errors.password}</p>}
              <p className="text-[10px] text-[var(--text3)] mt-1">{t('auth.passwordHint')}</p>
            </div>

            {/* Entreprise */}
            <div>
              <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{t('auth.company')} ({t('common.optional')})</label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Inc."
                autoComplete="organization"
                className="w-full bg-[var(--bg3)] border border-[var(--border)] focus:border-[var(--cyan)] rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isRegistering}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] transition-all mt-2',
                isRegistering ? 'bg-[var(--bg4)] text-[var(--text3)] cursor-not-allowed' : 'bg-[var(--cyan)] text-[#0a1520] hover:bg-[var(--cyan2)]',
              )}
            >
              {isRegistering ? (
                <><div className="w-4 h-4 border-2 border-[var(--text3)] border-t-transparent rounded-full animate-spin" />{t('auth.signingUp')}</>
              ) : (
                <>{t('auth.signUp')}<ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[var(--border)] text-center">
            <p className="text-[12px] text-[var(--text3)]">
              {t('auth.haveAccount')}{' '}
              <Link href="/auth/login" className="text-[var(--cyan)] hover:text-[var(--cyan2)] font-medium">{t('auth.toLogin')}</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
