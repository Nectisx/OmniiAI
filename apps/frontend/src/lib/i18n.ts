/**
 * i18n simple — dictionnaire de traductions FR / EN
 * Usage : const t = useT(); t('chat.newChat')
 */
import { useAuthStore } from '@/stores/auth.store';
import { Language } from '@omniai/types';

const dict = {
  // Common
  'common.save': { fr: 'Enregistrer', en: 'Save' },
  'common.cancel': { fr: 'Annuler', en: 'Cancel' },
  'common.delete': { fr: 'Supprimer', en: 'Delete' },
  'common.confirm': { fr: 'Confirmer', en: 'Confirm' },
  'common.confirmSelection': { fr: 'Confirmer la sélection', en: 'Confirm selection' },
  'common.loading': { fr: 'Chargement...', en: 'Loading...' },
  'common.error': { fr: 'Erreur', en: 'Error' },
  'common.success': { fr: 'Succès', en: 'Success' },
  'common.optional': { fr: 'optionnel', en: 'optional' },
  'common.test': { fr: 'Tester', en: 'Test' },

  // Auth
  'auth.signIn': { fr: 'Se connecter', en: 'Sign in' },
  'auth.signingIn': { fr: 'Connexion...', en: 'Signing in...' },
  'auth.signUp': { fr: 'Créer mon compte', en: 'Create my account' },
  'auth.signingUp': { fr: 'Inscription...', en: 'Signing up...' },
  'auth.logout': { fr: 'Déconnexion', en: 'Sign out' },
  'auth.email': { fr: 'Email', en: 'Email' },
  'auth.password': { fr: 'Mot de passe', en: 'Password' },
  'auth.firstName': { fr: 'Prénom', en: 'First name' },
  'auth.lastName': { fr: 'Nom', en: 'Last name' },
  'auth.company': { fr: 'Entreprise', en: 'Company' },
  'auth.noAccount': { fr: 'Pas encore de compte ?', en: 'No account yet?' },
  'auth.haveAccount': { fr: 'Déjà un compte ?', en: 'Already have an account?' },
  'auth.toRegister': { fr: "S'inscrire", en: 'Sign up' },
  'auth.toLogin': { fr: 'Se connecter', en: 'Sign in' },
  'auth.welcomeTitle': { fr: 'Créer un compte', en: 'Create an account' },
  'auth.welcomeSub': { fr: 'Rejoignez OmniAI gratuitement', en: 'Join OmniAI for free' },
  'auth.tagline': { fr: 'Votre hub IA centralisé', en: 'Your centralized AI hub' },
  'auth.loginTitle': { fr: 'Se connecter', en: 'Sign in' },
  'auth.invalidEmail': { fr: 'Email invalide', en: 'Invalid email' },
  'auth.passwordRequired': { fr: 'Mot de passe requis', en: 'Password required' },
  'auth.firstNameRequired': { fr: 'Prénom requis', en: 'First name required' },
  'auth.lastNameRequired': { fr: 'Nom requis', en: 'Last name required' },
  'auth.passwordMin': { fr: '8 caractères minimum', en: '8 characters minimum' },
  'auth.passwordUpper': { fr: 'Une majuscule requise', en: 'One uppercase required' },
  'auth.passwordDigit': { fr: 'Un chiffre requis', en: 'One digit required' },
  'auth.passwordHint': {
    fr: '8 caractères min, 1 majuscule, 1 chiffre',
    en: '8 chars min, 1 uppercase, 1 digit',
  },

  // Chat
  'chat.newChat': { fr: 'Nouveau chat', en: 'New chat' },
  'chat.recent': { fr: 'Récent', en: 'Recent' },
  'chat.placeholder': {
    fr: 'Écrivez votre message... (Shift+Enter pour saut de ligne)',
    en: 'Type your message... (Shift+Enter for new line)',
  },
  'chat.send': { fr: 'Envoyer', en: 'Send' },
  'chat.fallback': { fr: 'Fallback', en: 'Fallback' },
  'chat.fallbackOn': { fr: 'Fallback: ON', en: 'Fallback: ON' },
  'chat.fallbackOff': { fr: 'Fallback: OFF', en: 'Fallback: OFF' },
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
  'chat.disclaimer': {
    fr: 'OmniAI peut faire des erreurs. Vérifiez les informations importantes.',
    en: 'OmniAI can make mistakes. Verify important information.',
  },
  'chat.scrollDown': { fr: 'Défiler vers le bas', en: 'Scroll to bottom' },
  'chat.assistant': { fr: 'Assistant', en: 'Assistant' },
  'chat.you': { fr: 'Vous', en: 'You' },
  'chat.charCount': { fr: '/ 50 000', en: '/ 50,000' },
  'chat.usingPersonalKey': { fr: 'Clé perso', en: 'Personal key' },
  'chat.usingServerKey': { fr: 'Clé serveur', en: 'Server key' },
  'chat.fallbackActivated': { fr: 'Fallback activé', en: 'Fallback activated' },

  // Welcome suggestions
  'welcome.codeReview.title': { fr: 'Code Review', en: 'Code Review' },
  'welcome.codeReview.desc': { fr: 'Analyser et améliorer du code', en: 'Analyze and improve code' },
  'welcome.codeReview.prompt': {
    fr: 'Analyse ce code Python et suggère des optimisations de performance et de lisibilité.',
    en: 'Analyze this Python code and suggest performance and readability improvements.',
  },
  'welcome.email.title': { fr: 'Email Pro', en: 'Pro Email' },
  'welcome.email.desc': { fr: 'Rédiger une communication', en: 'Write a communication' },
  'welcome.email.prompt': {
    fr: 'Rédige un email professionnel pour demander un report de délai sur un projet client.',
    en: 'Write a professional email to request a deadline extension on a client project.',
  },
  'welcome.learn.title': { fr: 'Apprentissage', en: 'Learning' },
  'welcome.learn.desc': { fr: 'Expliquer un concept complexe', en: 'Explain a complex concept' },
  'welcome.learn.prompt': {
    fr: 'Explique le concept de machine learning de façon simple avec des exemples concrets.',
    en: 'Explain machine learning in a simple way with concrete examples.',
  },
  'welcome.arch.title': { fr: 'Architecture', en: 'Architecture' },
  'welcome.arch.desc': { fr: 'Concevoir une solution technique', en: 'Design a technical solution' },
  'welcome.arch.prompt': {
    fr: 'Génère un schéma de base de données complet pour une application e-commerce avec users, produits, commandes.',
    en: 'Generate a complete database schema for an e-commerce app with users, products, orders.',
  },

  // Model modal
  'model.choose': { fr: 'Choisir votre modèle IA', en: 'Choose your AI model' },
  'model.chooseSub': {
    fr: 'Sélectionnez le modèle pour cette conversation',
    en: 'Select the model for this conversation',
  },
  'model.principal': { fr: 'Principal', en: 'Primary' },
  'model.ultrafast': { fr: 'Ultra-rapide', en: 'Ultra-fast' },
  'model.fallback': { fr: 'Fallback', en: 'Fallback' },
  'model.dynamicRoutingDesc': {
    fr: 'Bascule auto si quota dépassé (Gemini → Llama → GPT-4o)',
    en: 'Auto-switch if quota exceeded (Gemini → Llama → GPT-4o)',
  },

  // Nav
  'nav.chat': { fr: 'Chat', en: 'Chat' },
  'nav.dashboard': { fr: 'Dashboard', en: 'Dashboard' },
  'nav.settings': { fr: 'Paramètres', en: 'Settings' },

  // Settings
  'settings.title': { fr: 'Paramètres', en: 'Settings' },
  'settings.subtitle': { fr: 'Gérez votre compte', en: 'Manage your account' },
  'settings.profile': { fr: 'Profil', en: 'Profile' },
  'settings.profileSub': {
    fr: 'Mettez à jour vos informations personnelles',
    en: 'Update your personal information',
  },
  'settings.apiKeys': { fr: 'Clés API', en: 'API Keys' },
  'settings.apiKeysTitle': { fr: 'Clés API personnelles', en: 'Personal API Keys' },
  'settings.apiKeysSub': {
    fr: 'Vos clés ont la priorité sur les clés serveur. Laissez vide pour utiliser les clés partagées.',
    en: 'Your keys take priority over server keys. Leave empty to use shared keys.',
  },
  'settings.apiKeysSecure': {
    fr: 'Les clés sont chiffrées avant stockage et ne sont jamais affichées en clair.',
    en: 'Keys are encrypted before storage and never displayed in plain text.',
  },
  'settings.apiKeyConfigured': { fr: 'Configurée', en: 'Configured' },
  'settings.apiKeyTested': { fr: 'Testée avec succès', en: 'Tested successfully' },
  'settings.appearance': { fr: 'Apparence', en: 'Appearance' },
  'settings.appearanceSub': {
    fr: "Personnalisez l'interface OmniAI",
    en: 'Customize the OmniAI interface',
  },
  'settings.notifications': { fr: 'Notifications', en: 'Notifications' },
  'settings.notificationsSub': {
    fr: 'Configurez vos alertes et rapports',
    en: 'Configure your alerts and reports',
  },
  'settings.theme': { fr: 'Thème', en: 'Theme' },
  'settings.language': { fr: 'Langue', en: 'Language' },
  'settings.dark': { fr: 'Sombre', en: 'Dark' },
  'settings.light': { fr: 'Clair', en: 'Light' },
  'settings.system': { fr: 'Système', en: 'System' },
  'settings.changeAvatar': { fr: "Changer l'avatar", en: 'Change avatar' },
  'settings.avatarHelp': { fr: 'Choisissez un emoji ou collez une URL d\'image', en: 'Choose an emoji or paste an image URL' },
  'settings.avatarEmoji': { fr: 'Emoji', en: 'Emoji' },
  'settings.avatarUrl': { fr: "URL d'image", en: 'Image URL' },
  'settings.avatarReset': { fr: 'Réinitialiser', en: 'Reset' },
  'settings.quotaAlerts': { fr: 'Alertes de quota (80%)', en: 'Quota alerts (80%)' },
  'settings.quotaAlertsDesc': {
    fr: "Notification quand un modèle atteint 80% de son quota journalier",
    en: 'Notification when a model reaches 80% of its daily quota',
  },
  'settings.weeklyReport': { fr: 'Rapport hebdomadaire', en: 'Weekly report' },
  'settings.weeklyReportDesc': {
    fr: "Résumé d'utilisation envoyé chaque lundi matin",
    en: 'Usage summary sent every Monday morning',
  },
  'settings.emailAlerts': { fr: 'Alertes par email', en: 'Email alerts' },
  'settings.emailAlertsDesc': {
    fr: "Recevez les alertes importantes par email",
    en: 'Receive important alerts by email',
  },
  'settings.profileUpdated': { fr: 'Profil mis à jour', en: 'Profile updated' },
  'settings.keySaved': { fr: 'Clé API sauvegardée', en: 'API key saved' },
  'settings.keyDeleted': { fr: 'Clé API supprimée', en: 'API key deleted' },
  'settings.keyTested': { fr: 'Clé valide', en: 'Key is valid' },
  'settings.keyTestFailed': { fr: 'Clé invalide ou non autorisée', en: 'Invalid or unauthorized key' },

  // Dashboard
  'dashboard.title': { fr: 'Tableau de bord', en: 'Dashboard' },
  'dashboard.subtitle': {
    fr: "Monitorer l'utilisation des modèles IA — 7 derniers jours",
    en: 'Monitor AI model usage — last 7 days',
  },
  'dashboard.totalRequests': { fr: 'Total Requêtes', en: 'Total Requests' },
  'dashboard.tokensUsed': { fr: 'Tokens utilisés', en: 'Tokens used' },
  'dashboard.activeModels': { fr: 'Modèles actifs', en: 'Active models' },
  'dashboard.conversations': { fr: 'Conversations', en: 'Conversations' },
  'dashboard.vsLastWeek': { fr: 'vs semaine dernière', en: 'vs last week' },
  'dashboard.dailyRequests': {
    fr: 'Requêtes quotidiennes par modèle',
    en: 'Daily requests per model',
  },
  'dashboard.quotaStatus': { fr: 'État des quotas', en: 'Quota Status' },
  'dashboard.active': { fr: 'Active', en: 'Active' },
  'dashboard.limited': { fr: 'Limitée', en: 'Limited' },
  'dashboard.recentConv': { fr: 'Conversations récentes', en: 'Recent conversations' },
  'dashboard.noConv': { fr: 'Aucune conversation récente', en: 'No recent conversation' },
  'dashboard.refresh': { fr: 'Actualiser', en: 'Refresh' },
} as const;

export type TranslationKey = keyof typeof dict;

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
