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
import { useT } from '@/lib/i18n';

const SECTION_ICONS = [User, Key, Palette, Bell];
const SECTION_KEYS = ['profile', 'apiKeys', 'appearance', 'notifications'] as const;
type SectionKey = typeof SECTION_KEYS[number];

export default function SettingsPage() {
  const t = useT();
  const queryClient = useQueryClient();
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SectionKey>('profile');

  const SECTION_LABELS: Record<SectionKey, string> = {
    profile: t('settings.profile'),
    apiKeys: t('settings.apiKeys'),
    appearance: t('settings.appearance'),
    notifications: t('settings.notifications'),
  };

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
      toast({ title: t('settings.profileUpdated'), variant: 'success' });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  const upsertKeyMutation = useMutation({
    mutationFn: ({ provider, cle }: { provider: LLMProvider; cle: string }) =>
      settingsApi.upsertApiKey(provider, cle),
    onSuccess: (_, { provider }) => {
      toast({ title: t('settings.keySaved'), variant: 'success' });
      setApiKeys(prev => ({ ...prev, [provider]: '' }));
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['quotas'] });
    },
    onError: () => toast({ title: t('common.error'), variant: 'destructive' }),
  });

  const deleteKeyMutation = useMutation({
    mutationFn: settingsApi.deleteApiKey,
    onSuccess: () => {
      toast({ title: t('settings.keyDeleted') });
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      queryClient.invalidateQueries({ queryKey: ['quotas'] });
    },
  });

  const updateNotifsMutation = useMutation({
    mutationFn: settingsApi.updateNotifications,
    onSuccess: () => toast({ title: t('common.success'), variant: 'success' }),
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
    { provider: LLMProvider.GEMINI, label: 'Gemini (Google AI Studio)', placeholder: 'AIzaSy...', hasKey: settings?.apiKeys?.gemini, prefix: 'AIzaSy' },
    { provider: LLMProvider.GROQ, label: 'Groq (Llama 3.3 70B)', placeholder: 'gsk_...', hasKey: settings?.apiKeys?.groq, prefix: 'gsk_' },
    { provider: LLMProvider.OPENAI, label: 'OpenAI / GitHub Models (GPT-4o)', placeholder: 'sk-... ou ghp_...', hasKey: settings?.apiKeys?.openai, prefix: '' },
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
          <h1 className="text-base font-semibold text-[var(--text)]">{t('settings.title')}</h1>
          <p className="text-[11px] text-[var(--text3)] mt-0.5">{t('settings.subtitle')}</p>
        </div>
        <nav className="space-y-0.5">
          {SECTION_KEYS.map((key, i) => {
            const Icon = SECTION_ICONS[i];
            return (
              <button
                key={key}
                onClick={() => setActiveSection(key)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-colors text-left',
                  activeSection === key
                    ? 'bg-[var(--bg4)] text-[var(--cyan)]'
                    : 'text-[var(--text2)] hover:bg-[var(--bg3)] hover:text-[var(--text)]',
                )}
              >
                <Icon size={14} />
                {SECTION_LABELS[key]}
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
          {activeSection === 'profile' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">{t('settings.profile')}</h2>
              <p className="text-[13px] text-[var(--text2)] mb-5">{t('settings.profileSub')}</p>

              {/* Avatar */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-[var(--bg3)] border border-[var(--border)] rounded-xl">
                <div className="w-14 h-14 rounded-full bg-gradient-omni flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {user?.prenom?.[0]}{user?.nom?.[0]}
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[var(--text)]">{user?.prenom} {user?.nom}</p>
                  <p className="text-[12px] text-[var(--text3)]">{user?.email}</p>
                  <button className="text-[11px] text-[var(--cyan)] mt-1 hover:text-[var(--cyan2)]">{t('settings.changeAvatar')}</button>
                </div>
              </div>

              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {([[t('auth.firstName'), 'prenom', user?.prenom || ''], [t('auth.lastName'), 'nom', user?.nom || '']] as const).map(([label, field]) => (
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
                  <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{t('auth.email')}</label>
                  <input
                    className="w-full bg-[var(--bg4)] border border-[var(--border)] rounded-xl px-3 py-2 text-[13px] text-[var(--text3)] outline-none cursor-not-allowed"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[var(--text2)] mb-1.5">{t('auth.company')}</label>
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
                  {updateProfileMutation.isPending ? t('common.loading') : t('common.save')}
                </button>
              </div>
            </div>
          )}

          {/* ── Clés API ───────────────────────────────────── */}
          {activeSection === 'apiKeys' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">{t('settings.apiKeysTitle')}</h2>
              <p className="text-[13px] text-[var(--text2)] mb-2">
                {t('settings.apiKeysSub')}
              </p>
              <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[12px] text-blue-300 mb-5">
                💡 {t('settings.apiKeysSecure')}
              </div>

              <div className="space-y-4">
                {API_KEY_CONFIGS.map(({ provider, label, placeholder, hasKey, prefix }) => {
                  const currentValue = apiKeys[provider] || '';
                  const isValidFormat = !prefix || currentValue.startsWith(prefix);
                  return (
                    <div key={provider} className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-[13px] font-medium text-[var(--text)]">{label}</label>
                        {hasKey && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 font-semibold">
                            ✓ {t('settings.apiKeyConfigured')}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type={showKeys[provider] ? 'text' : 'password'}
                            value={currentValue}
                            onChange={e => setApiKeys(p => ({ ...p, [provider]: e.target.value }))}
                            placeholder={hasKey ? '••••••••••••••••••••' : placeholder}
                            className={cn(
                              'w-full bg-[var(--bg4)] border rounded-xl px-3 py-2 pr-9 text-[12px] text-[var(--text)] outline-none transition-colors font-mono',
                              currentValue && !isValidFormat
                                ? 'border-yellow-500 focus:border-yellow-400'
                                : 'border-[var(--border)] focus:border-[var(--cyan)]',
                            )}
                          />
                          <button
                            onClick={() => setShowKeys(p => ({ ...p, [provider]: !p[provider] }))}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text3)] hover:text-[var(--text)]"
                          >
                            {showKeys[provider] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                        <button
                          onClick={() => currentValue && upsertKeyMutation.mutate({ provider, cle: currentValue })}
                          disabled={!currentValue || upsertKeyMutation.isPending}
                          title={t('common.save')}
                          className="px-3 py-2 rounded-xl bg-[var(--cyan)] text-[#0a1520] text-[12px] font-semibold hover:bg-[var(--cyan2)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          <Save size={14} />
                        </button>
                        {hasKey && (
                          <button
                            onClick={() => deleteKeyMutation.mutate(provider)}
                            title={t('common.delete')}
                            className="px-3 py-2 rounded-xl border border-[var(--border)] text-[var(--danger)] text-[12px] hover:bg-red-500/10 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                      {currentValue && !isValidFormat && (
                        <p className="text-[11px] text-yellow-400 mt-1.5">
                          ⚠️ {`Format inattendu. Attendu : ${prefix}...`}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Apparence ─────────────────────────────────── */}
          {activeSection === 'appearance' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">{t('settings.appearance')}</h2>
              <p className="text-[13px] text-[var(--text2)] mb-5">{t('settings.appearanceSub')}</p>

              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 space-y-5">
                {/* Theme */}
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text2)] mb-3 uppercase tracking-wider">{t('settings.theme')}</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {(['DARK', 'LIGHT', 'SYSTEM'] as const).map(themeOpt => {
                      const themeLabel = themeOpt === 'DARK' ? t('settings.dark') : themeOpt === 'LIGHT' ? t('settings.light') : t('settings.system');
                      return (
                        <button
                          key={themeOpt}
                          onClick={() => updateProfileMutation.mutate({ theme: themeOpt as Theme })}
                          className={cn(
                            'p-3 rounded-xl border text-[12px] transition-all text-center',
                            user?.theme === themeOpt
                              ? 'border-[var(--cyan)] bg-[rgba(0,180,204,0.07)] text-[var(--cyan)]'
                              : 'border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)]',
                          )}
                        >
                          <div className="text-2xl mb-1.5">{themeOpt === 'DARK' ? '🌙' : themeOpt === 'LIGHT' ? '☀️' : '💻'}</div>
                          {themeLabel}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-[12px] font-semibold text-[var(--text2)] mb-3 uppercase tracking-wider">{t('settings.language')}</label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {(['FR', 'EN'] as const).map(langOpt => (
                      <button
                        key={langOpt}
                        onClick={() => updateProfileMutation.mutate({ langue: langOpt as Language })}
                        className={cn(
                          'p-3 rounded-xl border text-[13px] transition-all flex items-center gap-2.5',
                          user?.langue === langOpt
                            ? 'border-[var(--cyan)] bg-[rgba(0,180,204,0.07)] text-[var(--cyan)]'
                            : 'border-[var(--border)] text-[var(--text2)] hover:border-[var(--border2)]',
                        )}
                      >
                        <span className="text-xl">{langOpt === 'FR' ? '🇫🇷' : '🇬🇧'}</span>
                        {langOpt === 'FR' ? 'Français' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Notifications ─────────────────────────────── */}
          {activeSection === 'notifications' && (
            <div>
              <h2 className="text-base font-semibold text-[var(--text)] mb-1">{t('settings.notifications')}</h2>
              <p className="text-[13px] text-[var(--text2)] mb-5">{t('settings.notificationsSub')}</p>

              <div className="bg-[var(--bg3)] border border-[var(--border)] rounded-xl p-5 space-y-4">
                {[
                  { key: 'quotaAlerts', label: t('settings.quotaAlerts'), desc: t('settings.quotaAlertsDesc') },
                  { key: 'weeklyReport', label: t('settings.weeklyReport'), desc: t('settings.weeklyReportDesc') },
                  { key: 'emailAlerts', label: t('settings.emailAlerts'), desc: t('settings.emailAlertsDesc') },
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
