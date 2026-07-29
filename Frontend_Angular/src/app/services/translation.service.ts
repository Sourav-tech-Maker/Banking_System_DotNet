import { Injectable, signal } from '@angular/core';

export type SupportedLanguage = 'en' | 'hi' | 'fr' | 'de' | 'es';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
}

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  public static readonly LANGUAGES: LanguageOption[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' }
  ];

  public readonly currentLang = signal<SupportedLanguage>('en');

  private readonly translations: Record<SupportedLanguage, Record<string, string>> = {
    en: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.transactions': 'Transactions',
      'nav.openAccount': 'Open Account',
      'nav.kyc': 'KYC Verification',
      'nav.beneficiaries': 'Beneficiaries',
      'nav.goals': 'Savings Goals',
      'nav.profile': 'My Profile',
      'nav.settings': 'Settings',
      'nav.admin': 'Admin Panel',
      'nav.systemConsole': 'System Console',
      'nav.logout': 'Log Out',

      // Dashboard
      'dashboard.greetingMorning': 'Good Morning',
      'dashboard.greetingAfternoon': 'Good Afternoon',
      'dashboard.greetingEvening': 'Good Evening',
      'dashboard.welcomeBack': 'Welcome back',
      'dashboard.welcomeSubtitle': 'Here is your financial summary and real-time ledger status.',
      'dashboard.overview': 'Overview',
      'dashboard.totalBalance': 'Total Balance',
      'dashboard.monthlyCredit': 'Monthly Credit',
      'dashboard.monthlyOutflow': 'Monthly Outflow',
      'dashboard.yonoRewards': 'YONO Rewards',
      'dashboard.liveReserve': 'Live Verified Reserve',
      'dashboard.incomingTransfers': 'Incoming Transfers',
      'dashboard.outgoingPayments': 'Outgoing Payments',
      'dashboard.redeemablePerks': 'Redeemable Perks',
      'dashboard.recentTransactions': 'Recent Transactions',
      'dashboard.recentTxSubtitle': 'Your latest real-time account movements',
      'dashboard.viewAll': 'View All →',
      'dashboard.aiInsights': 'AI Financial Insights',
      'dashboard.aiSubtitle': 'Personalized analytics and advice',
      'dashboard.sendMoneyBtn': 'Send Money',

      // Recent Transactions Table
      'tx.description': 'Description',
      'tx.category': 'Category',
      'tx.date': 'Date',
      'tx.amount': 'Amount',
      'tx.status': 'Status',
      'tx.completed': 'COMPLETED',
      'tx.pending': 'PENDING',
      'tx.failed': 'FAILED',
      'tx.noTransactions': 'No recent transactions found.',

      // KYC
      'kyc.headerTitle': 'KYC Verification',
      'kyc.headerSubtitle': 'Identity audit and compliance dashboard',
      'kyc.step1': 'STEP 1: SUBMITTED',
      'kyc.step2': 'STEP 2: AUDIT REVIEW',
      'kyc.step3': 'STEP 3: ACTIVATION',
      'kyc.verifiedBanner': 'Identity & CIF Fully Verified',
      'kyc.verifiedSubtitle': 'Congratulations! Your identity has been verified in compliance with banking regulations. You can now open savings or current accounts.',
      'kyc.openAccountBtn': 'Open Bank Account →',
      'kyc.part1Filed': 'Part-I CIF Form Filed',
      'kyc.docCheck': 'Document & Identity Check',
      'kyc.fullRights': 'Unlocked! Full banking rights enabled',

      // Profile
      'profile.headerTitle': 'My Profile & Settings',
      'profile.headerSubtitle': 'Manage your user registration, credentials, accounts, and KYC verification status',
      'profile.regDetails': 'Registration Details',
      'profile.username': 'USERNAME',
      'profile.email': 'EMAIL',
      'profile.accountStatus': 'ACCOUNT STATUS',
      'profile.kycStatusTitle': 'KYC Status',

      // Settings Header
      'settings.title': 'App Settings',
      'settings.subtitle': 'Configure application display, security, and notification preferences',
      'settings.saveBtn': 'Save All Preferences',
      'settings.resetBtn': 'Reset to Defaults',
      'settings.savedSuccess': 'Settings saved successfully!',

      // Sections
      'settings.appearance.title': 'Appearance & Display',
      'settings.appearance.subtitle': 'Customize how YONO App looks on your screen',
      'settings.darkMode': 'Dark Mode',
      'settings.darkModeDesc': 'Switch to dark theme for night comfort and reduced eye strain',
      'settings.compactView': 'Compact View',
      'settings.compactViewDesc': 'Reduce spacing and padding to fit more data on screen',
      'settings.highContrast': 'High Contrast Mode',
      'settings.highContrastDesc': 'Enhance text contrast for better legibility',

      'settings.language.title': 'Language & Regional',
      'settings.language.subtitle': 'Choose your preferred language and display formats',
      'settings.displayLanguage': 'Display Language',
      'settings.displayLanguageDesc': 'Select system language for application UI',
      'settings.currency': 'Default Currency',
      'settings.currencyDesc': 'Primary currency symbol displayed across transactions',
      'settings.dateFormat': 'Date Format',
      'settings.dateFormatDesc': 'Format for timestamps and transaction history',

      'settings.security.title': 'Security & Privacy',
      'settings.security.subtitle': 'Manage account security and data privacy controls',
      'settings.twoFactor': 'Two-Factor Authentication (2FA)',
      'settings.twoFactorDesc': 'Require OTP confirmation for sensitive actions and logins',
      'settings.sessionTimeout': 'Auto Session Timeout',
      'settings.sessionTimeoutDesc': 'Automatically log out after inactivity',
      'settings.maskBalance': 'Mask Account Balance',
      'settings.maskBalanceDesc': 'Hide sensitive account numbers and balances on dashboard',

      'settings.notifications.title': 'Notifications & Alerts',
      'settings.notifications.subtitle': 'Control how and when YONO App alerts you',
      'settings.emailAlerts': 'Email Notifications',
      'settings.emailAlertsDesc': 'Receive instant email receipts for transactions and logins',
      'settings.pushAlerts': 'Push & SMS Alerts',
      'settings.pushAlertsDesc': 'Receive instant SMS alerts on registered mobile number',
      'settings.largeTxThreshold': 'Large Transaction Alert Threshold',
      'settings.largeTxThresholdDesc': 'Notify immediately when a transaction exceeds this amount'
    },
    hi: {
      // Navigation
      'nav.dashboard': 'डैशबोर्ड',
      'nav.transactions': 'लेन-देन इतिहास',
      'nav.openAccount': 'खाता खोलें',
      'nav.kyc': 'केवाईसी सत्यापन',
      'nav.beneficiaries': 'लाभार्थी प्रबंधन',
      'nav.goals': 'बचत लक्ष्य',
      'nav.profile': 'मेरी प्रोफ़ाइल',
      'nav.settings': 'ऐप सेटिंग्स',
      'nav.admin': 'एडमिन पैनल',
      'nav.systemConsole': 'सिस्टम कंसोल',
      'nav.logout': 'लॉग आउट',

      // Dashboard
      'dashboard.greetingMorning': 'शुभ प्रभात',
      'dashboard.greetingAfternoon': 'शुभ अपराह्न',
      'dashboard.greetingEvening': 'शुभ संध्या',
      'dashboard.welcomeBack': 'वापसी पर स्वागत है',
      'dashboard.welcomeSubtitle': 'यहाँ आपका वित्तीय सारांश और वास्तविक समय खाता स्थिति है।',
      'dashboard.overview': 'अवलोकन',
      'dashboard.totalBalance': 'कुल शेष',
      'dashboard.monthlyCredit': 'मासिक क्रेडिट',
      'dashboard.monthlyOutflow': 'मासिक डेबिट',
      'dashboard.yonoRewards': 'YONO पुरस्कार',
      'dashboard.liveReserve': 'लाइव सत्यापित रिज़र्व',
      'dashboard.incomingTransfers': 'आवक स्थानान्तरण',
      'dashboard.outgoingPayments': 'जावक भुगतान',
      'dashboard.redeemablePerks': 'रिडीम योग्य लाभ',
      'dashboard.recentTransactions': 'हाल के लेन-देन',
      'dashboard.recentTxSubtitle': 'आपकी नवीनतम वास्तविक समय खाता गतिविधियां',
      'dashboard.viewAll': 'सभी देखें →',
      'dashboard.aiInsights': 'एआई वित्तीय अंतर्दृष्टि',
      'dashboard.aiSubtitle': 'व्यक्तिगत विश्लेषण और सलाह',
      'dashboard.sendMoneyBtn': 'पैसे भेजें',

      // Recent Transactions Table
      'tx.description': 'विवरण',
      'tx.category': 'श्रेणी',
      'tx.date': 'तिथि',
      'tx.amount': 'राशि',
      'tx.status': 'स्थिति',
      'tx.completed': 'पूर्ण',
      'tx.pending': 'लंबित',
      'tx.failed': 'विफल',
      'tx.noTransactions': 'कोई हाल का लेन-देन नहीं मिला।',

      // KYC
      'kyc.headerTitle': 'केवाईसी सत्यापन',
      'kyc.headerSubtitle': 'पहचान ऑडिट और अनुपालन डैशबोर्ड',
      'kyc.step1': 'चरण 1: जमा किया गया',
      'kyc.step2': 'चरण 2: ऑडिट समीक्षा',
      'kyc.step3': 'चरण 3: सक्रियण',
      'kyc.verifiedBanner': 'पहचान और सीआईएफ पूरी तरह सत्यापित',
      'kyc.verifiedSubtitle': 'बधाई हो! बैंकिंग नियमों के अनुपालन में आपकी पहचान सत्यापित की गई है। अब आप बचत या चालू खाता खोल सकते हैं।',
      'kyc.openAccountBtn': 'बैंक खाता खोलें →',
      'kyc.part1Filed': 'भाग-I सीआईएफ फॉर्म भरा गया',
      'kyc.docCheck': 'दस्तावेज़ एवं पहचान जांच',
      'kyc.fullRights': 'सक्रिय! पूर्ण बैंकिंग अधिकार सक्षम',

      // Profile
      'profile.headerTitle': 'मेरी प्रोफ़ाइल एवं सेटिंग्स',
      'profile.headerSubtitle': 'अपने उपयोगकर्ता पंजीकरण, क्रेडेंशियल, खाते और केवाईसी स्थिति प्रबंधित करें',
      'profile.regDetails': 'पंजीकरण विवरण',
      'profile.username': 'उपयोगकर्ता नाम',
      'profile.email': 'ईमेल',
      'profile.accountStatus': 'खाता स्थिति',
      'profile.kycStatusTitle': 'केवाईसी स्थिति',

      // Settings Header
      'settings.title': 'ऐप सेटिंग्स',
      'settings.subtitle': 'एप्लिकेशन प्रदर्शन, सुरक्षा और अधिसूचना प्राथमिकताएं कॉन्फ़िगर करें',
      'settings.saveBtn': 'सभी प्राथमिकताएं सहेजें',
      'settings.resetBtn': 'डिफ़ॉल्ट पर रीसेट करें',
      'settings.savedSuccess': 'सेटिंग्स सफलतापूर्वक सहेजी गईं!',

      // Sections
      'settings.appearance.title': 'उपस्थिति एवं प्रदर्शन',
      'settings.appearance.subtitle': 'अनुकूलित करें कि YONO ऐप आपकी स्क्रीन पर कैसा दिखता है',
      'settings.darkMode': 'डार्क मोड',
      'settings.darkModeDesc': 'रात में आंखों के आराम के लिए डार्क थीम चालू करें',
      'settings.compactView': 'कंपैक्ट व्यू',
      'settings.compactViewDesc': 'स्क्रीन पर अधिक डेटा देखने के लिए रिक्ति कम करें',
      'settings.highContrast': 'उच्च कंट्रास्ट मोड',
      'settings.highContrastDesc': 'बेहतर पठनीयता के लिए टेक्स्ट कंट्रास्ट बढ़ाएं',

      'settings.language.title': 'भाषा एवं क्षेत्रीय सेटिंग्स',
      'settings.language.subtitle': 'अपनी पसंदीदा भाषा और प्रदर्शन प्रारूप चुनें',
      'settings.displayLanguage': 'प्रदर्शन भाषा',
      'settings.displayLanguageDesc': 'एप्लिकेशन के लिए अपनी पसंदीदा भाषा चुनें',
      'settings.currency': 'डिफ़ॉल्ट मुद्रा',
      'settings.currencyDesc': 'लेन-देन में प्रदर्शित प्राथमिक मुद्रा प्रतीक',
      'settings.dateFormat': 'दिनांक प्रारूप',
      'settings.dateFormatDesc': 'समय-छाप और इतिहास के लिए तिथि प्रारूप',

      'settings.security.title': 'सुरक्षा एवं गोपनीयता',
      'settings.security.subtitle': 'खाता सुरक्षा और डेटा गोपनीयता नियंत्रण प्रबंधित करें',
      'settings.twoFactor': 'दो-कारक प्रमाणीकरण (2FA)',
      'settings.twoFactorDesc': 'संवेदनशील कार्यों और लॉगिन के लिए OTP सत्यापन अनिवार्य करें',
      'settings.sessionTimeout': 'ऑटो सत्र टाइमआउट',
      'settings.sessionTimeoutDesc': 'निष्क्रियता के बाद स्वतः लॉग आउट करें',
      'settings.maskBalance': 'खाता शेष छिपाएं (Mask)',
      'settings.maskBalanceDesc': 'डैशबोर्ड पर संवेदनशील खाता संख्या और शेष राशि छिपाएं',

      'settings.notifications.title': 'अधिसूचनाएं एवं अलर्ट',
      'settings.notifications.subtitle': 'नियंत्रित करें कि YONO ऐप आपको कब अलर्ट करता है',
      'settings.emailAlerts': 'ईमेल सूचनाएं',
      'settings.emailAlertsDesc': 'लेन-देन और लॉगिन के लिए तुरंत ईमेल प्राप्त करें',
      'settings.pushAlerts': 'पुश एवं एसएमएस अलर्ट',
      'settings.pushAlertsDesc': 'पंजीकृत मोबाइल नंबर पर तुरंत एसएमएस प्राप्त करें',
      'settings.largeTxThreshold': 'बड़े लेन-देन अलर्ट सीमा',
      'settings.largeTxThresholdDesc': 'इस राशि से अधिक के लेन-देन पर तुरंत सूचित करें'
    },
    fr: {
      // Navigation
      'nav.dashboard': 'Tableau de bord',
      'nav.transactions': 'Historique des transactions',
      'nav.openAccount': 'Ouvrir un compte',
      'nav.kyc': 'Vérification KYC',
      'nav.beneficiaries': 'Gérer les bénéficiaires',
      'nav.goals': "Objectifs d'épargne",
      'nav.profile': 'Mon profil',
      'nav.settings': 'Paramètres',
      'nav.admin': 'Panneau administration',
      'nav.systemConsole': 'Console système',
      'nav.logout': 'Se déconnecter',

      // Dashboard
      'dashboard.greetingMorning': 'Bonjour',
      'dashboard.greetingAfternoon': 'Bon après-midi',
      'dashboard.greetingEvening': 'Bonsoir',
      'dashboard.welcomeBack': 'Bon retour',
      'dashboard.welcomeSubtitle': 'Voici votre résumé financier et l’état du compte en temps réel.',
      'dashboard.overview': 'Aperçu',
      'dashboard.totalBalance': 'Solde Total',
      'dashboard.monthlyCredit': 'Crédit Mensuel',
      'dashboard.monthlyOutflow': 'Dépenses Mensuelles',
      'dashboard.yonoRewards': 'Récompenses YONO',
      'dashboard.liveReserve': 'Réserve vérifiée en direct',
      'dashboard.incomingTransfers': 'Transferts entrants',
      'dashboard.outgoingPayments': 'Paiements sortants',
      'dashboard.redeemablePerks': 'Avantages échangeables',
      'dashboard.recentTransactions': 'Transactions Récents',
      'dashboard.recentTxSubtitle': 'Vos derniers mouvements de compte en temps réel',
      'dashboard.viewAll': 'Voir tout →',
      'dashboard.aiInsights': 'Analyses Financières IA',
      'dashboard.aiSubtitle': 'Analyses et conseils personnalisés',
      'dashboard.sendMoneyBtn': 'Envoyer de l’argent',

      // Recent Transactions Table
      'tx.description': 'Description',
      'tx.category': 'Catégorie',
      'tx.date': 'Date',
      'tx.amount': 'Montant',
      'tx.status': 'Statut',
      'tx.completed': 'TERMINÉ',
      'tx.pending': 'EN ATTENTE',
      'tx.failed': 'ÉCHOUÉ',
      'tx.noTransactions': 'Aucune transaction récente trouvée.',

      // KYC
      'kyc.headerTitle': 'Vérification KYC',
      'kyc.headerSubtitle': 'Tableau de bord de conformité et d’audit d’identité',
      'kyc.step1': 'ÉTAPE 1 : SOUMIS',
      'kyc.step2': 'ÉTAPE 2 : EXAMEN D’AUDIT',
      'kyc.step3': 'ÉTAPE 3 : ACTIVATION',
      'kyc.verifiedBanner': 'Identité & CIF entièrement vérifiés',
      'kyc.verifiedSubtitle': 'Félicitations ! Votre identité a été vérifiée conformément aux réglementations bancaires.',
      'kyc.openAccountBtn': 'Ouvrir un compte bancaire →',
      'kyc.part1Filed': 'Formulaire CIF Partie-I rempli',
      'kyc.docCheck': 'Vérification des documents',
      'kyc.fullRights': 'Activé ! Droits bancaires complets',

      // Profile
      'profile.headerTitle': 'Mon profil et paramètres',
      'profile.headerSubtitle': 'Gérez vos identifiants, vos comptes et le statut KYC',
      'profile.regDetails': 'Détails d’inscription',
      'profile.username': 'NOM D’UTILISATEUR',
      'profile.email': 'E-MAIL',
      'profile.accountStatus': 'STATUT DU COMPTE',
      'profile.kycStatusTitle': 'Statut KYC',

      // Settings Header
      'settings.title': "Paramètres de l'application",
      'settings.subtitle': "Configurez l'affichage, la sécurité et les préférences de notification",
      'settings.saveBtn': 'Enregistrer les préférences',
      'settings.resetBtn': 'Réinitialiser',
      'settings.savedSuccess': 'Paramètres enregistrés avec succès !',

      // Sections
      'settings.appearance.title': 'Apparence et affichage',
      'settings.appearance.subtitle': "Personnalisez l'apparence de l'application YONO",
      'settings.darkMode': 'Mode Sombre',
      'settings.darkModeDesc': 'Passez au thème sombre pour le confort nocturne',
      'settings.compactView': 'Vue compacte',
      'settings.compactViewDesc': "Réduisez l'espacement pour afficher plus de données",
      'settings.highContrast': 'Contraste élevé',
      'settings.highContrastDesc': 'Améliorez la lisibilité des textes',

      'settings.language.title': 'Langue et région',
      'settings.language.subtitle': 'Choisissez votre langue et vos formats préférés',
      'settings.displayLanguage': "Langue d'affichage",
      'settings.displayLanguageDesc': "Sélectionnez la langue de l'interface utilisateur",
      'settings.currency': 'Devise par défaut',
      'settings.currencyDesc': 'Symbole de devise affiché pour vos comptes',
      'settings.dateFormat': 'Format de date',
      'settings.dateFormatDesc': 'Format des dates et horodatages',

      'settings.security.title': 'Sécurité et confidentialité',
      'settings.security.subtitle': 'Gérez la sécurité du compte et la confidentialité',
      'settings.twoFactor': 'Authentification à deux facteurs (2FA)',
      'settings.twoFactorDesc': 'Exiger un code OTP pour les actions sensibles',
      'settings.sessionTimeout': 'Délai d’expiration de session',
      'settings.sessionTimeoutDesc': 'Déconnexion automatique après inactivité',
      'settings.maskBalance': 'Masquer les soldes',
      'settings.maskBalanceDesc': 'Masquer les numéros de compte et soldes sensibles',

      'settings.notifications.title': 'Notifications et alertes',
      'settings.notifications.subtitle': 'Contrôlez quand et comment vous recevez des alertes',
      'settings.emailAlerts': 'Notifications par e-mail',
      'settings.emailAlertsDesc': 'Recevez des reçus par e-mail pour les transactions',
      'settings.pushAlerts': 'Alertes SMS et Push',
      'settings.pushAlertsDesc': 'Recevez des SMS sur votre numéro enregistré',
      'settings.largeTxThreshold': 'Seuil de grande transaction',
      'settings.largeTxThresholdDesc': 'Alerter si une transaction dépasse ce montant'
    },
    de: {
      // Navigation
      'nav.dashboard': 'Dashboard',
      'nav.transactions': 'Transaktionsverlauf',
      'nav.openAccount': 'Konto eröffnen',
      'nav.kyc': 'KYC-Verifizierung',
      'nav.beneficiaries': 'Empfänger verwalten',
      'nav.goals': 'Sparziele',
      'nav.profile': 'Mein Profil',
      'nav.settings': 'Einstellungen',
      'nav.admin': 'Admin-Bereich',
      'nav.systemConsole': 'Systemkonsole',
      'nav.logout': 'Abmelden',

      // Dashboard
      'dashboard.greetingMorning': 'Guten Morgen',
      'dashboard.greetingAfternoon': 'Guten Tag',
      'dashboard.greetingEvening': 'Guten Abend',
      'dashboard.welcomeBack': 'Willkommen zurück',
      'dashboard.welcomeSubtitle': 'Hier ist Ihre Finanzübersicht und der Echtzeit-Kontostatus.',
      'dashboard.overview': 'Übersicht',
      'dashboard.totalBalance': 'Gesamtsaldo',
      'dashboard.monthlyCredit': 'Monatlicher Eingang',
      'dashboard.monthlyOutflow': 'Monatlicher Ausgang',
      'dashboard.yonoRewards': 'YONO Belohnungen',
      'dashboard.liveReserve': 'Live verifizierte Reserve',
      'dashboard.incomingTransfers': 'Eingehende Überweisungen',
      'dashboard.outgoingPayments': 'Ausgehende Zahlungen',
      'dashboard.redeemablePerks': 'Einlösbare Vorteile',
      'dashboard.recentTransactions': 'Neueste Transaktionen',
      'dashboard.recentTxSubtitle': 'Ihre neuesten Echtzeit-Kontobewegungen',
      'dashboard.viewAll': 'Alle anzeigen →',
      'dashboard.aiInsights': 'KI-Finanzanalysen',
      'dashboard.aiSubtitle': 'Personalisierte Analysen und Ratschläge',
      'dashboard.sendMoneyBtn': 'Geld senden',

      // Recent Transactions Table
      'tx.description': 'Beschreibung',
      'tx.category': 'Kategorie',
      'tx.date': 'Datum',
      'tx.amount': 'Betrag',
      'tx.status': 'Status',
      'tx.completed': 'ABGESCHLOSSEN',
      'tx.pending': 'AUSSTEHEND',
      'tx.failed': 'FEHLGESCHLAGEN',
      'tx.noTransactions': 'Keine neuen Transaktionen gefunden.',

      // KYC
      'kyc.headerTitle': 'KYC-Verifizierung',
      'kyc.headerSubtitle': 'Identitätsprüfung und Compliance-Dashboard',
      'kyc.step1': 'SCHRITT 1: EINGEREICHT',
      'kyc.step2': 'SCHRITT 2: AUDIT-PRÜFUNG',
      'kyc.step3': 'SCHRITT 3: AKTIVIERUNG',
      'kyc.verifiedBanner': 'Identität & CIF vollständig verifiziert',
      'kyc.verifiedSubtitle': 'Herzlichen Glückwunsch! Ihre Identität wurde gemäß den Bankvorschriften verifiziert.',
      'kyc.openAccountBtn': 'Bankkonto eröffnen →',
      'kyc.part1Filed': 'Teil-I CIF Formular eingereicht',
      'kyc.docCheck': 'Dokumenten- & Identitätsprüfung',
      'kyc.fullRights': 'Aktiviert! Volle Bankrechte freigeschaltet',

      // Profile
      'profile.headerTitle': 'Mein Profil & Einstellungen',
      'profile.headerSubtitle': 'Verwalten Sie Ihre Registrierung, Konten und den KYC-Status',
      'profile.regDetails': 'Registrierungsdetails',
      'profile.username': 'BENUTZERNAME',
      'profile.email': 'E-MAIL',
      'profile.accountStatus': 'KONTOSTATUS',
      'profile.kycStatusTitle': 'KYC-Status',

      // Settings Header
      'settings.title': 'App-Einstellungen',
      'settings.subtitle': 'Konfigurieren Sie Anzeige, Sicherheit und Benachrichtigungen',
      'settings.saveBtn': 'Einstellungen speichern',
      'settings.resetBtn': 'Zurücksetzen',
      'settings.savedSuccess': 'Einstellungen erfolgreich gespeichert!',

      // Sections
      'settings.appearance.title': 'Erscheinungsbild',
      'settings.appearance.subtitle': 'Passen Sie das Erscheinungsbild der YONO-App an',
      'settings.darkMode': 'Dunkelmodus',
      'settings.darkModeDesc': 'Wechseln Sie zum dunklen Design für die Nacht',
      'settings.compactView': 'Kompakte Ansicht',
      'settings.compactViewDesc': 'Abstände verringern, um mehr Daten anzuzeigen',
      'settings.highContrast': 'Hoher Kontrast',
      'settings.highContrastDesc': 'Textkontrast für bessere Lesbarkeit erhöhen',

      'settings.language.title': 'Sprache & Region',
      'settings.language.subtitle': 'Wählen Sie Ihre bevorzugte Sprache und Formate',
      'settings.displayLanguage': 'Anzeigesprache',
      'settings.displayLanguageDesc': 'Wählen Sie die Sprache der Benutzeroberfläche',
      'settings.currency': 'Standardwährung',
      'settings.currencyDesc': 'Angezeigtes Währungssymbol für Transaktionen',
      'settings.dateFormat': 'Datumsformat',
      'settings.dateFormatDesc': 'Format für Datumsangaben',

      'settings.security.title': 'Sicherheit & Datenschutz',
      'settings.security.subtitle': 'Verwalten Sie Kontosicherheit und Datenschutz',
      'settings.twoFactor': 'Zwei-Faktor-Authentifizierung (2FA)',
      'settings.twoFactorDesc': 'OTP-Bestätigung für vertrauliche Aktionen verlangen',
      'settings.sessionTimeout': 'Automatisches Sitzungs-Time-Out',
      'settings.sessionTimeoutDesc': 'Automatisch abmelden nach Inaktivität',
      'settings.maskBalance': 'Kontostand ausblenden',
      'settings.maskBalanceDesc': 'Sensible Kontonummern und Salden ausblenden',

      'settings.notifications.title': 'Benachrichtigungen & Alarme',
      'settings.notifications.subtitle': 'Steuern Sie, wann und wie Sie Alarme erhalten',
      'settings.emailAlerts': 'E-Mail-Benachrichtigungen',
      'settings.emailAlertsDesc': 'E-Mail-Bestätigungen für Transaktionen erhalten',
      'settings.pushAlerts': 'Push- & SMS-Alarme',
      'settings.pushAlertsDesc': 'Sofortige SMS an Ihre Mobilnummer erhalten',
      'settings.largeTxThreshold': 'Limit für große Transaktionen',
      'settings.largeTxThresholdDesc': 'Sofort benachrichtigen, wenn der Betrag überschritten wird'
    },
    es: {
      // Navigation
      'nav.dashboard': 'Panel principal',
      'nav.transactions': 'Historial de transacciones',
      'nav.openAccount': 'Abrir cuenta',
      'nav.kyc': 'Verificación KYC',
      'nav.beneficiaries': 'Gestionar beneficiarios',
      'nav.goals': 'Metas de ahorro',
      'nav.profile': 'Mi perfil',
      'nav.settings': 'Configuración',
      'nav.admin': 'Panel de administración',
      'nav.systemConsole': 'Consola del sistema',
      'nav.logout': 'Cerrar sesión',

      // Dashboard
      'dashboard.greetingMorning': 'Buenos Días',
      'dashboard.greetingAfternoon': 'Buenas Tardes',
      'dashboard.greetingEvening': 'Buenas Noches',
      'dashboard.welcomeBack': 'Bienvenido de nuevo',
      'dashboard.welcomeSubtitle': 'Aquí está su resumen financiero y el estado de la cuenta en tiempo real.',
      'dashboard.overview': 'Resumen',
      'dashboard.totalBalance': 'Saldo Total',
      'dashboard.monthlyCredit': 'Crédito Mensual',
      'dashboard.monthlyOutflow': 'Débito Mensual',
      'dashboard.yonoRewards': 'Recompensas YONO',
      'dashboard.liveReserve': 'Reserva verificada en vivo',
      'dashboard.incomingTransfers': 'Transferencias entrantes',
      'dashboard.outgoingPayments': 'Pagos salientes',
      'dashboard.redeemablePerks': 'Beneficios canjeables',
      'dashboard.recentTransactions': 'Transacciones Recientes',
      'dashboard.recentTxSubtitle': 'Sus últimos movimientos de cuenta en tiempo real',
      'dashboard.viewAll': 'Ver todo →',
      'dashboard.aiInsights': 'Análisis Financiero IA',
      'dashboard.aiSubtitle': 'Análisis y consejos personalizados',
      'dashboard.sendMoneyBtn': 'Enviar dinero',

      // Recent Transactions Table
      'tx.description': 'Descripción',
      'tx.category': 'Categoría',
      'tx.date': 'Fecha',
      'tx.amount': 'Monto',
      'tx.status': 'Estado',
      'tx.completed': 'COMPLETADO',
      'tx.pending': 'PENDIENTE',
      'tx.failed': 'FALLIDO',
      'tx.noTransactions': 'No se encontraron transacciones recientes.',

      // KYC
      'kyc.headerTitle': 'Verificación KYC',
      'kyc.headerSubtitle': 'Panel de cumplimiento y auditoría de identidad',
      'kyc.step1': 'PASO 1: ENVIADO',
      'kyc.step2': 'PASO 2: REVISIÓN DE AUDITORÍA',
      'kyc.step3': 'PASO 3: ACTIVACIÓN',
      'kyc.verifiedBanner': 'Identidad y CIF totalmente verificados',
      'kyc.verifiedSubtitle': '¡Felicitaciones! Su identidad ha sido verificada en cumplimiento con las regulaciones bancarias.',
      'kyc.openAccountBtn': 'Abrir cuenta bancaria →',
      'kyc.part1Filed': 'Formulario CIF Parte-I presentado',
      'kyc.docCheck': 'Verificación de documentos e identidad',
      'kyc.fullRights': '¡Activado! Derechos bancarios completos',

      // Profile
      'profile.headerTitle': 'Mi perfil y configuración',
      'profile.headerSubtitle': 'Gestione su registro de usuario, credenciales, cuentas y estado KYC',
      'profile.regDetails': 'Detalles de registro',
      'profile.username': 'NOMBRE DE USUARIO',
      'profile.email': 'CORREO ELECTRÓNICO',
      'profile.accountStatus': 'ESTADO DE LA CUENTA',
      'profile.kycStatusTitle': 'Estado KYC',

      // Settings Header
      'settings.title': 'Configuración de la aplicación',
      'settings.subtitle': 'Configure la pantalla, seguridad y preferencias de notificación',
      'settings.saveBtn': 'Guardar preferencias',
      'settings.resetBtn': 'Restablecer',
      'settings.savedSuccess': '¡Configuración guardada con éxito!',

      // Sections
      'settings.appearance.title': 'Apariencia y pantalla',
      'settings.appearance.subtitle': 'Personalice el aspecto de la aplicación YONO',
      'settings.darkMode': 'Modo oscuro',
      'settings.darkModeDesc': 'Cambie al tema oscuro para mayor comodidad nocturna',
      'settings.compactView': 'Vista compacta',
      'settings.compactViewDesc': 'Reduzca el espaciado para ver más datos en pantalla',
      'settings.highContrast': 'Alto contraste',
      'settings.highContrastDesc': 'Mejore la legibilidad del texto',

      'settings.language.title': 'Idioma y región',
      'settings.language.subtitle': 'Elija su idioma y formatos preferidos',
      'settings.displayLanguage': 'Idioma de pantalla',
      'settings.displayLanguageDesc': 'Seleccione el idioma de la interfaz de usuario',
      'settings.currency': 'Moneda predeterminada',
      'settings.currencyDesc': 'Símbolo de moneda principal para transacciones',
      'settings.dateFormat': 'Formato de fecha',
      'settings.dateFormatDesc': 'Formato para marcas de tiempo e historial',

      'settings.security.title': 'Seguridad y privacidad',
      'settings.security.subtitle': 'Gestione la seguridad de la cuenta y privacidad',
      'settings.twoFactor': 'Autenticación de dos factores (2FA)',
      'settings.twoFactorDesc': 'Requerir código OTP para acciones sensibles',
      'settings.sessionTimeout': 'Tiempo de espera de sesión',
      'settings.sessionTimeoutDesc': 'Cierre de sesión automático tras inactividad',
      'settings.maskBalance': 'Ocultar saldos',
      'settings.maskBalanceDesc': 'Ocultar números de cuenta y saldos sensibles',

      'settings.notifications.title': 'Notificaciones y alertas',
      'settings.notifications.subtitle': 'Controle cuándo y cómo recibe alertas',
      'settings.emailAlerts': 'Notificaciones por correo',
      'settings.emailAlertsDesc': 'Reciba recibos por correo tras cada transacción',
      'settings.pushAlerts': 'Alertas SMS y Push',
      'settings.pushAlertsDesc': 'Reciba SMS en su número registrado',
      'settings.largeTxThreshold': 'Umbral de transacción grande',
      'settings.largeTxThresholdDesc': 'Notificar de inmediato si se supera este monto'
    }
  };

  constructor() {
    this.initLanguage();
  }

  private initLanguage() {
    const saved = localStorage.getItem('yono_lang') as SupportedLanguage;
    if (saved && this.translations[saved]) {
      this.currentLang.set(saved);
    } else {
      const settingsStr = localStorage.getItem('yono_settings');
      if (settingsStr) {
        try {
          const parsed = JSON.parse(settingsStr);
          if (parsed?.lang && this.translations[parsed.lang as SupportedLanguage]) {
            this.currentLang.set(parsed.lang as SupportedLanguage);
          }
        } catch {
          // ignore
        }
      }
    }
  }

  public setLanguage(lang: SupportedLanguage) {
    if (this.translations[lang]) {
      this.currentLang.set(lang);
      localStorage.setItem('yono_lang', lang);
    }
  }

  public translate(key: string): string {
    const lang = this.currentLang();
    const dict = this.translations[lang] || this.translations.en;
    return dict[key] || this.translations.en[key] || key;
  }

  public t(key: string): string {
    return this.translate(key);
  }
}
