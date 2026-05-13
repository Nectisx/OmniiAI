/**
 * i18n simple — dictionnaire de traductions FR / EN
 * Usage : const t = useT(); t('chat.newChat')
 */
import { useAuthStore } from '@/stores/auth.store';
import { Language } from '@omniai/types';

type TranslationKey =
  | 'common.save' | 'common.cancel' | 'common.delete' | 'common.confirm'
  | 'common.loading' | 'common.error' | 'common.success'
  | 'auth.login' | 'auth.logout' | 'auth.register' | 'auth.email'
  | 'auth.password' | 'auth.firstName' | 'auth.lastName' | 'auth.company'
  | 'auth.signIn' | 'auth.signUp' | 'auth.noAccount' | 'auth.haveAccount'
  | 'auth.signingIn' | 'auth.signingUp'
  | 'chat.newChat' | 'chat.recent' | 'chat.placeholder' | 'chat.send'
  | 'chat.fallback' | 'chat.quotaExhausted' | 'chat.welcome' | 'chat.welcomeSub'
  | 'chat.sessionInfo' | 'chat.tokensSession' | 'chat.messages' | 'chat.activeModel'
  | 'chat.dynamicRouting' | 'chat.quotas' | 'chat.refresh' | 'chat.hide'
  | 'nav.chat' | 'nav.dashboard' | 'nav.settings'
  | 'settings.title' | 'settings.subtitle' | 'settings.profile'
  | 'settings.apiKeys' | 'settings.appearance' | 'settings.notifications'
  | 'settings.theme' | 'settings.language' | 'settings.dark' | 'settings.light'
  | 'settings.system' | 'settings.updateProfile'
  | 'dashboard.title' | 'dashboard.subtitle' | 'dashboard.totalRequests'
  | 'dashboard.tokensUsed' | 'dashboard.activeModels' | 'dashboard.conversations'
  | 'dashboard.dailyRequests' | 'dashboard.quotaStatus' | 'dashboard.recentConv'
  | 'dashboard.noConv' | 'dashboard.refresh';

const dict: Record<TranslationKey, { fr: string; en: string }> = {
  // Common
  'common.save': { fr: 'Enregistrer', en: 'Save' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel' },
  'common.delete': { fr: 'Supprimer', en: 'Delete' },
  'common.confirm': { fr: 'Confirmer', en: 'Confirm' },
  'common.loading': { fr: 'Chargement...', en: 'Loading...' },
  'common.error': { fr: 'Erreur', en: 'Error' },
  'common.success': { fr: 'Succès', en: 'Success' },

  // Auth
  'auth.login': { fr: 'Se connecter', en: 'Sign in' },
  'auth.logout': { fr: 'Déconnexion', en: 'Sign out' },
  'auth.register': { fr: "S'inscrire", en: 'Sign up' },
  'auth.email': { fr: 'Email', en: 'Email' },
  'auth.password': { fr: 'Mot de passe', en: 'Password' },
  'auth.firstName': { fr: 'Prénom', en: 'First name' },
  'auth.lastName': { fr: 'Nom', en: 'Last name' },
  'auth.company': { fr: 'Entreprise', en: 'Company' },
  'auth.signIn': { fr: 'Se connecter', en: 'Sign in' },
  'auth.signUp': { fr: 'Créer mon compte', en: 'Create account' },
  'auth.noAccount': { fr: 'Pas encore de compte ?', en: 'No account yet?' },
  'auth.haveAccount': { fr: 'Déjà un compte ?', en: 'Already have an account?' },
  'auth.signingIn': { fr: 'Connexion...', en: 'Signing in...' },
  'auth.signingUp': { fr: 'Inscription...', en: 'Signing up...' },

  // Chat
  'chat.newChat': { fr: 'Nouveau chat', en: 'New chat' },
  'chat.recent': { fr: 'Récent', en: 'Recent' },
  'chat.placeholder': { fr: 'Écrivez votre message... (Shift+Enter pour saut de ligne)', en: 'Type your message... (Shift+Enter for new line)' },
  'chat.send': { fr: 'Envoyer', en: 'Send' },
  'chat.fallback': { fr: 'Fallback', en: 'Fallback' },
  'chat.quotaExhausted': { fr: 'Quota épuisé', en: 'Quota exhausted' },
  'chat.welcome': { fr: 'Bienvenue sur OmniAI', en: 'Welcome to OmniAI' },
  'chat.welcomeSub': {
    fr: 'Votre hub IA centralisé. Gemini, Llama et GPT-4o depuis une interface unique avec fallback automatique.',
    en: 'Your centralized AI hub. Gemini, Llama and GPT-4o from a single interface with automatic fallback.',
  },
  'chat.sessionInfo': { fr: 'Session Info', en: 'Session Info' },
  'chat.tokensSession': { fr: 'Tokens session', en: 'Session tokens' },
  'chat.messages': { fr: 'Messages', en: 'Messages' },
  'chat.activeModel': { fr: 'Modèle actif', en: 'Active model' },
  'chat.dynamicRouting': { fr: 'Routage dynamique', en: 'Dynamic routing' },
  'chat.quotas': { fr: 'Quotas API', en: 'API Quotas' },
  'chat.refresh': { fr: 'Actualiser', en: 'Refresh' },
  'chat.hide': { fr: 'Masquer', en: 'Hide' },

  // Nav
  'nav.chat': { fr: 'Chat', en: 'Chat' },
  'nav.dashboard': { fr: 'Dashboard', en: 'Dashboard' },
  'nav.settings': { fr: 'Paramètres', en: 'Settings' },

  // Settings
  'settings.title': { fr: 'Paramètres', en: 'Settings' },
  'settings.subtitle': { fr: 'Gérez votre compte', en: 'Manage your account' },
  'settings.profile': { fr: 'Profil', en: 'Profile' },
  'settings.apiKeys': { fr: 'Clés API', en: 'API Keys' },
  'settings.appearance': { fr: 'Apparence', en: 'Appearance' },
  'settings.notifications': { fr: 'Notifications', en: 'Notifications' },
  'settings.theme': { fr: 'Thème', en: 'Theme' },
  'settings.language': { fr: 'Langue', en: 'Language' },
  'settings.dark': { fr: 'Sombre', en: 'Dark' },
  'settings.light': { fr: 'Clair', en: 'Light' },
  'settings.system': { fr: 'Système', en: 'System' },
  'settings.updateProfile': { fr: 'Mettez à jour vos informations', en: 'Update your information' },

  // Dashboard
  'dashboard.title': { fr: 'Tableau de bord', en: 'Dashboard' },
  'dashboard.subtitle': { fr: 'Monitorer l\'utilisation des modèles IA', en: 'Monitor AI model usage' },
  'dashboard.totalRequests': { fr: 'Total Requêtes', en: 'Total Requests' },
  'dashboard.tokensUsed': { fr: 'Tokens utilisés', en: 'Tokens used' },
  'dashboard.activeModels': { fr: 'Modèles actifs', en: 'Active models' },
  'dashboard.conversations': { fr: 'Conversations', en: 'Conversations' },
  'dashboard.dailyRequests': { fr: 'Requêtes quotidiennes par modèle', en: 'Daily requests per model' },
  'dashboard.quotaStatus': { fr: 'État des quotas', en: 'Quota Status' },
  'dashboard.recentConv': { fr: 'Conversations récentes', en: 'Recent conversations' },
  'dashboard.noConv': { fr: 'Aucune conversation', en: 'No conversation' },
  'dashboard.refresh': { fr: 'Actualiser', en: 'Refresh' },
};

export function useT() {
  const lang = useAuthStore((s) => s.user?.langue ?? Language.FR);
  return (key: TranslationKey): string => {
    const entry = dict[key];
    if (!entry) return key;
    return lang === Language.EN ? entry.en : entry.fr;
  };
}

export function getT(lang: Language) {
  return (key: TranslationKey): string => {
    const entry = dict[key];
    if (!entry) return key;
    return lang === Language.EN ? entry.en : entry.fr;
  };
}
