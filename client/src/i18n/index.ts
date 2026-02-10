import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import ptBRCommon from './locales/pt-BR/common.json';
import ptBRAuth from './locales/pt-BR/auth.json';
import ptBRFeed from './locales/pt-BR/feed.json';
import ptBRShop from './locales/pt-BR/shop.json';
import ptBRGamification from './locales/pt-BR/gamification.json';
import ptBRSettings from './locales/pt-BR/settings.json';

import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enFeed from './locales/en/feed.json';
import enShop from './locales/en/shop.json';
import enGamification from './locales/en/gamification.json';
import enSettings from './locales/en/settings.json';

import esCommon from './locales/es/common.json';
import esAuth from './locales/es/auth.json';
import esFeed from './locales/es/feed.json';
import esShop from './locales/es/shop.json';
import esGamification from './locales/es/gamification.json';
import esSettings from './locales/es/settings.json';

export const supportedLanguages = [
    { code: 'pt-BR', label: 'Português (BR)', flag: '🇧🇷' },
    { code: 'en', label: 'English', flag: '🇺🇸' },
    { code: 'es', label: 'Español', flag: '🇪🇸' },
] as const;

export type LanguageCode = typeof supportedLanguages[number]['code'];

i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
        resources: {
            'pt-BR': {
                common: ptBRCommon,
                auth: ptBRAuth,
                feed: ptBRFeed,
                shop: ptBRShop,
                gamification: ptBRGamification,
                settings: ptBRSettings,
            },
            en: {
                common: enCommon,
                auth: enAuth,
                feed: enFeed,
                shop: enShop,
                gamification: enGamification,
                settings: enSettings,
            },
            es: {
                common: esCommon,
                auth: esAuth,
                feed: esFeed,
                shop: esShop,
                gamification: esGamification,
                settings: esSettings,
            },
        },
        fallbackLng: 'pt-BR',
        defaultNS: 'common',
        ns: ['common', 'auth', 'feed', 'shop', 'gamification', 'settings'],
        interpolation: {
            escapeValue: false, // React already escapes
        },
        detection: {
            order: ['localStorage', 'navigator', 'htmlTag'],
            lookupLocalStorage: 'i18nextLng',
            caches: ['localStorage'],
        },
    });

export default i18n;
