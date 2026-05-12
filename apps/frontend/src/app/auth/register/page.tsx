'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
  const { register, isRegistering, registerError } = useAuth();
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', company: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [errors, setErrors] = useState<Partial<typeof form>>({});

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const e: Partial<typeof form> = {};
    if (!form.prenom.trim()) e.prenom = 'Prénom requis';
    if (!form.nom.trim()) e.nom = 'Nom requis';
    if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    if (form.password.length < 8) e.password = '8 caractères minimum';
    else if (!/[A-Z]/.test(form.password)) e.password = 'Une majuscule requise';
    else if (!/[0-9]/.test(form.password)) e.password = 'Un chiffre requis';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    try {
      await register({ prenom: form.prenom, nom: form.nom, email: form.email, password: form.password, company: form.company || undefined });
    } catch { /* géré par hook */ }
  };

  const errorMsg = registerError ? ((registerError as any)?.response?.data?.error || 'Erreur lors de l\'inscription') : null;

  const Field = ({ label, field, type = 'text', placeholder }: { label: string; field: keyof typeof form; type?: string; placeholder?: string }) => (
    <div>
      <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{label}</label>
      <div className="relative">
        <input
          type={field === 'password' ? (showPwd ? 'text' : 'password') : type}
          value={form[field]}
          onChange={set(field)}
          placeholder={placeholder}
          className={cn(
            'w-full bg-[var(--bg3)] border rounded-xl px-3.5 py-2.5 text-[13px] text-[var(--text)] placeholder:text-[var(--text3)] outline-none transition-colors',
            field === 'password' && 'pr-10',
            errors[field] ? 'border-red-500' : 'border-[var(--border)] focus:border-[var(--cyan)]',
          )}
        />
        {field === 'password' && (
          <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text3)]">
            {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        )}
      </div>
      {errors[field] && <p className="text-[11px] text-red-400 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-5 blur-3xl bg-[var(--violet)]" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full opacity-5 blur-3xl bg-[var(--cyan)]" />
      </div>

      <motion.div className="w-full max-w-[400px]" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-omni flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-violet-500/20">O</div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Créer un compte</h1>
          <p className="text-sm text-[var(--text2)] mt-1">Rejoignez OmniAI gratuitement</p>
        </div>

        <div className="bg-[var(--bg2)] border border-[var(--border)] rounded-2xl p-6 shadow-2xl">
          {errorMsg && (
            <motion.div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-[13px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {errorMsg}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Prénom" field="prenom" placeholder="Jean" />
              <Field label="Nom" field="nom" placeholder="Dupont" />
            </div>
            <Field label="Email" field="email" type="email" placeholder="jean@company.com" />
            <Field label="Mot de passe" field="password" type="password" placeholder="••••••••" />
            <Field label="Entreprise (optionnel)" field="company" placeholder="Acme Inc." />

            <button
              type="submit"
              disabled={isRegistering}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-[13px] transition-all mt-2',
                isRegistering ? 'bg-[var(--bg4)] text-[var(--text3)] cursor-not-allowed' : 'bg-[var(--cyan)] text-[#0a1520] hover:bg-[var(--cyan2)]',
              )}
            >
              {isRegistering ? (
                <><div className="w-4 h-4 border-2 border-[var(--text3)] border-t-transparent rounded-full animate-spin" />Inscription...</>
              ) : (
                <>Créer mon compte<ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-[var(--border)] text-center">
            <p className="text-[12px] text-[var(--text3)]">
              Déjà un compte ?{' '}
              <Link href="/auth/login" className="text-[var(--cyan)] hover:text-[var(--cyan2)] font-medium">Se connecter</Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
