import { useCallback, useEffect } from 'react';

export function useCookies() {
  const getCookieConsent = useCallback(() => {
    const cookieConsent = localStorage.getItem('cookieConsent');

    if (!cookieConsent) {
      return { accepted: false, analytics: false, marketing: false, preferences: false };
    }

    try {
      return JSON.parse(cookieConsent);
    } catch (error) {
      return { accepted: false, analytics: false, marketing: false, preferences: false };
    }
  }, []);

  const hasAcceptedAnalytics = useCallback(() => getCookieConsent().analytics === true, [getCookieConsent]);
  const hasAcceptedMarketing = useCallback(() => getCookieConsent().marketing === true, [getCookieConsent]);
  const hasAcceptedPreferences = useCallback(() => getCookieConsent().preferences === true, [getCookieConsent]);

  return { getCookieConsent, hasAcceptedAnalytics, hasAcceptedMarketing, hasAcceptedPreferences };
}

export function useAnalytics() {
  const { hasAcceptedAnalytics } = useCookieConsent();

  useEffect(() => {
    if (hasAcceptedAnalytics()) {
      // Inicializar Google Analytics / gtag aquí si es necesario
      // Ejemplo: window.gtag && window.gtag('config', 'GA_MEASUREMENT_ID');
    }
  }, [hasAcceptedAnalytics]);
}

export function useMarketingServices() {
  const { hasAcceptedMarketing } = useCookieConsent();

  useEffect(() => {
    if (hasAcceptedMarketing()) {
      // Inicializar servicios de marketing (píxeles, etc.)
    }
  }, [hasAcceptedMarketing]);
}

export function usePreferenceCookies() {
  const { hasAcceptedPreferences } = useCookieConsent();

  useEffect(() => {
    if (hasAcceptedPreferences()) {
      // Aplicar preferencias (tema, idioma, etc.) si procede
    }
  }, [hasAcceptedPreferences]);
}
