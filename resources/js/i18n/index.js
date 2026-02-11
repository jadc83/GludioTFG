import en from './locales/en.json';
import es from './locales/es.json';

const LOCALES = { en, es };

function readCookie(name) {
    try {
        const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]+)'));
        return m ? decodeURIComponent(m[1]) : null;
    } catch (e) {
        return null;
    }
}

function writeCookie(name, value, days = 365) {
    try {
        const d = new Date();
        d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
        document.cookie = `${name}=${encodeURIComponent(value)};path=/;expires=${d.toUTCString()}`;
    } catch (e) {
        // ignore
    }
}

function detectLocale() {
    if (typeof window === 'undefined') return 'es';
    const cookie = readCookie('app_locale');
    if (cookie) return cookie;
    if (window.location && window.location.pathname && window.location.pathname.startsWith('/en')) return 'en';
    return 'es';
}

let currentLocale = detectLocale();

export function getLocale() {
    return currentLocale;
}

export function setLocale(locale, { persist = true, reload = false } = {}) {
    if (!LOCALES[locale]) return false;
    currentLocale = locale;
    if (persist) writeCookie('app_locale', locale);
    if (reload && typeof window !== 'undefined') {
        window.location.reload();
    }
    return true;
}

function lookup(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
}

export function t(key, fallback = null) {
    const localeObj = LOCALES[currentLocale] || LOCALES.es;
    const val = lookup(localeObj, key);
    if (val !== null) return val;
    // try fallback locale (es)
    const fb = lookup(LOCALES.es, key);
    return fb !== null ? fb : fallback || key;
}

import { useState, useEffect } from 'react';
export function useTranslation() {
    const [locale, setLoc] = useState(currentLocale);
    useEffect(() => {
        // no realtime sync for now; consumers can call setLocale
        setLoc(currentLocale);
    }, []);
    return {
        t,
        locale,
        setLocale: (l, opts) => {
            const ok = setLocale(l, opts);
            setLoc(getLocale());
            return ok;
        },
    };
}

export default { t, getLocale, setLocale, useTranslation };
