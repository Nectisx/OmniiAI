'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Save, Trash2, User, Key, Palette, Bell } from 'lucide-react';
import { settingsApi } from '@/services/api.service';
import { useAuthStore } from '@/stores/auth.store';
import { useToast } from '@/hooks/useToast';
import { LLMProvider, Language, Theme } from '@omniai/types';
import { cn } from '@/lib/utils';

const SECTIONS = ['Profil', 'Clés API', 'Apparence', 'Notifications'];
const SECTION_ICONS = [User, Key, Palette, Bell];

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState('Profil');

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: settingsApi.getSettings,
  });

  // Profile form state
  const [profile, setProfile] = useState({
    prenom: user?.prenom || '',
    nom: user?.nom || '',
    company: user?.company || '',
  });

  // API keys state
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({ gemini: '', groq: '', openai: '' });
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});

  // Notifications state
  const [notifs, setNotifs] = useState({
    quotaAlerts: settings?.notifications?.quotaAlerts ?? true,
    weeklyReport: settings?.notifications?.weeklyReport ?? true,
    emailAlerts: settings?.notifications?.emailAlerts ?? false,
  });

  const updateProfileMutation = useMutation({
    mutationFn: settingsApi.updateProfile,
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      toast({ title: 'Profil mis à jour avec succès', variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast({ title: 'Erreur lors de la mise à jour', variant: 'destructive' }),
  });

  const upsertKeyMutation = useMutation({
    mutationFn: ({ provider, cle }: { provider: LLMProvider; cle: string }) =>
      settingsApi.upsertApiKey(provider, cle),
    onSuccess: (_, { provider }) => {
      toast({ title: `Clé ${provider} sauvegardée`, variant: 'success' });
      setApiKeys(prev => ({ ...prev, [provider]: '' }));
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast({ title: 'Erreur sauvegarde clé API', variant: 'destructive' }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: settingsApi.deleteApiKey,
    onSuccess: (_, provider) => {
      toast({ title: `Clé ${provider} supprimée` });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
  });

  const updateNotifsMutation = useMutation({
    mutationFn: settingsApi.updateNotifications,
    onSuccess: () => toast({ title: 'Notifications mises à jour', variant: 'success' }),
  });

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex gap-1"><span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" /></div>
      </div>
    );
  }

  // Merge live settings into notifs
  const mergedNotifs = {
    quotaAlerts: settings?.notifications?.quotaAlerts ?? notifs.quotaAlerts,
    weeklyReport: settings?.notifications?.weeklyReport ?? notifs.weeklyReport,
    emailAlerts: settings?.notifications?.emailAlerts ?? notifs.emailAlerts,
  };

  const API_KEY_CONFIGS = [
    { provider: LLMProvider.GEMINI, label: 'Gemini (Google AI Studio)', placeholder: 'AIzaSy...', hasKey: settings?.apiKeys?.gemini },
    { provider: LLMProvider.GROQ, label: 'Groq (Llama 3.3 70B)', placeholder: 'gsk_...', hasKey: settings?.apiKeys?.groq },
    { provider: LLMProvider.OPENAI, label: 'OpenAI / GitHub Models (GPT-4o)', placeholder: 'sk-... ou ghp_...', hasKey: settings?.apiKeys?.openai },
  ];

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={cn('w-10 h-6 rounded-full transition-colors relative flex-shrink-0', value ? 'bg-[var(--cyan)]' : 'bg-[var(--border)]')}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
        animate={{ left: value ? '1.25rem' : '0.25rem' }}
        transition={{ duration: 0.15 }}
      />
    </button>
  );

  return (
    <div className="h-full flex overflow-hidden">
      {/* Sidebar nav */}
      <div className="w-48 flex-shrink-0 border-r border-[var(--border)] p-3" style={{ background: 'var(--bg2)' }}>
        <div className="mb-4 px-2">
          <h1 className="text-base font-semibold text-[var(--text)]">Paramètres</h1>
          <p className="text-[11px] text-[var(--text3)] mt-0.5">Gérez votre compte</p>
        </div>
        <nav className="space-y-0.5">
          {SECTIONS.map((s, i) => {
            const Icon = SECTION_ICONS[i];
            return (
              <button
                key={s}
                onClick={() => setActiveSection(s)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors text-left',
                  activeSection === s
                    ? 'bg-[var(--bg4)] text-[var(--cyan)]'
                    : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]',
                )}
              >
                <Icon size={14} />
                {s}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="max-w-xl"
        >
          {/* ── Profil ─────────────────────────────────────── */}
          {activeSection === 'Profil' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">Profil</h2>
              <p className="text-[13px] text-[var(--text2)] mb-5">Mettez à jour vos informations personnelles</p>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--bg3)] border border-[var(--border)] rounded-xl">
                <div className="w-14 h-14 rounded-full bg-gradient-omni flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[var(--text)]">{user?.prenom} {user?.nom}</p>
                  <p className="text-[12px] text-[var(--text3)]">{user?.email}</p>
                  <button className="text-[11px] text-[var(--cyan)] mt-1 hover:text-[var(--cyan2)]">Changer l'avatar</button>
                </div>
              </div>

              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {([['Prénom', 'prenom', user?.prenom || ''], ['Nom', 'nom', user?.nom || '']] as const).map(([label, field]) => (
                    <div key={field}>
                      <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{label}</label>
                      <input
                        className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--cyan)] transition-colors"
                        value={profile[field as 'prenom' | 'nom']}
                        onChange={e => setProfile(p => ({ ...p, [field]: e.target.value }))}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">Email</label>
                  <input
                    className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-2 text-[13px] text-[var(--text3)] outline-none cursor-not-allowed"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">Entreprise</label>
                  <input
                    className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-2 text-[13px] text-[var(--text)] outline-none focus:border-[var(--cyan)] transition-colors"
                    value={profile.company}
                    onChange={e => setProfile(p => ({ ...p, company: e.target.value }))}
                    placeholder="Acme Inc."
                  />
                </div>
                <button
                  onClick={() => updateProfileMutation.mutate(profile)}
                  disabled={updateProfileMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--cyan)] text-[#0a1520] rounded-xl text-[13px] font-semibold hover:bg-[var(--cyan2)] transition-colors"
                >
                  <Save size={14} />
                  {updateProfileMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </div>
          )}

          {/* ── Clés API ───────────────────────────────────── */}
          {activeSection === 'Clés API' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">Clés API personnelles</h2>
              <p className="text-[13px] text-[var(--text2)] mb-2">
                Vos clés ont la priorité sur les clés serveur. Laissez vide pour utiliser les clés partagées.
              </p>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[12px] text-blue-300 mb-5">
                💡 Les clés sont chiffrées avant stockage et ne sont jamais affichées en clair.
              </div>

              <div className="space-y-4">
                {API_KEY_CONFIGS.map(({ provider, label, placeholder, hasKey }) => (
                  <div key={provider} className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <label className="text-[13px] font-medium text-[var(--text)]">{label}</label>
                      {hasKey && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">
                          ✓ Configurée
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showKeys[provider] ? 'text' : 'password'}
                          value={apiKeys[provider]}
                          onChange={e => setApiKeys(p => ({ ...p, [provider]: e.target.value }))}
                          placeholder={hasKey ? '••••••••••••••••••••' : placeholder}
                          className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-2 pr-9 text-[12px] text-[var(--text)] outline-none focus:border-[var(--cyan)] transition-colors font-mono"
                        />
                        <button
                          onClick={() => setShowKeys(p => ({ ...p, [provider]: !p[provider] }))}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)]"
                        >
                          {showKeys[provider] ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button
                        onClick={() => apiKeys[provider] && upsertKeyMutation.mutate({ provider, cle: apiKeys[provider] })}
                        disabled={!apiKeys[provider] || upsertKeyMutation.isPending}
                        className="px-3 py-2 rounded-xl bg-[var(--cyan)] text-[#0a1520] text-[12px] font-semibold hover:bg-[var(--cyan2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Save size={14} />
                      </button>
                      {hasKey && (
                        <button
                          onClick={() => deleteKeyMutation.mutate(provider)}
                          className="px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--danger)] text-[12px] hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Apparence ─────────────────────────────────── */}
          {activeSection === 'Apparence' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">Apparence & Langue</h2>
              <p className="text-[13px] text-[var(--text2)] mb-5">Personnalisez l'interface OmniAI</p>

              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 space-y-5">
                {/* Theme */}
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text2)] mb-3 uppercase tracking-wider">Thème</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['DARK', 'LIGHT', 'SYSTEM'] as const).map(t => (
                      <button
                        key={t}
                        onClick={() => updateProfileMutation.mutate({ theme: t as Theme })}
                        className={cn(
                          'p-3 rounded-xl border text-[12px] transition-all text-center',
                          user?.theme === t
                            ? 'border-[var(--cyan)] bg-[rgba(0,180,204,0.07)] text-[var(--cyan)]'
                            : 'border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)]',
                        )}
                      >
                        <div className="text-2xl mb-1.5">{t === 'DARK' ? '🌙' : t === 'LIGHT' ? '☀️' : '💻'}</div>
                        {t === 'DARK' ? 'Dark' : t === 'LIGHT' ? 'Light' : 'Système'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text2)] mb-3 uppercase tracking-wider">Langue</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['FR', 'EN'] as const).map(l => (
                      <button
                        key={l}
                        onClick={() => updateProfileMutation.mutate({ langue: l as Language })}
                        className={cn(
                          'p-3 rounded-xl border text-[13px] transition-all flex items-center gap-2.5',
                          user?.langue === l
                            ? 'border-[var(--cyan)] bg-[rgba(0,180,204,0.07)] text-[var(--cyan)]'
                            : 'border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)]',
                        )}
                      >
                        <span className="text-xl">{l === 'FR' ? '🇫🇷' : '🇬🇧'}</span>
                        {l === 'FR' ? 'Français' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ─────────────────────────────── */}
          {activeSection === 'Notifications' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">Notifications</h2>
              <p className="text-[13px] text-[var(--text2)] mb-5">Configurez vos alertes et rapports</p>

              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                {[
                  { key: 'quotaAlerts', label: 'Alertes de quota (80%)', desc: 'Notification quand un modèle atteint 80% de son quota journalier' },
                  { key: 'weeklyReport', label: 'Rapport hebdomadaire', desc: 'Résumé d\'utilisation envoyé chaque lundi matin' },
                  { key: 'emailAlerts', label: 'Alertes par email', desc: 'Recevez les alertes importantes par email' },
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between py-2 border-b border-[var(--border)] last:border-0">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--text)]">{label}</p>
                      <p className="text-[11px] text-[var(--text3)] mt-0.5">{desc}</p>
                    </div>
                    <Toggle
                      value={mergedNotifs[key as keyof typeof mergedNotifs]}
                      onChange={(v) => {
                        const updated = { ...mergedNotifs, [key]: v };
                        updateNotifsMutation.mutate(updated);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
