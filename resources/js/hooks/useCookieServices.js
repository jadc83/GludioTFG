import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * Hook para inicializar Google Analytics solo si el usuario ha aceptado cookies de analítica
 * Uso: useAnalytics() en el componente raíz de la aplicación
 */
export function useAnalytics() {
    const { hasAcceptedAnalytics } = useCookieConsent();

    React.useEffect(() => {
        if (hasAcceptedAnalytics()) {
        }
    }, [hasAcceptedAnalytics]);
}

/**
 * Hook para inicializar servicios de marketing solo si el usuario ha aceptado
 */
export function useMarketingServices() {
    const { hasAcceptedMarketing } = useCookieConsent();

    React.useEffect(() => {
        if (hasAcceptedMarketing()) {

        }
    }, [hasAcceptedMarketing]);
}

/**
 * Hook para inicializar cookies de preferencia del usuario
 */
export function usePreferenceCookies() {
    const { hasAcceptedPreferences } = useCookieConsent();

    React.useEffect(() => {
        if (hasAcceptedPreferences()) {
            // Aquí puedes guardar preferencias del usuario (idioma, tema, etc.)
        }
    }, [hasAcceptedPreferences]);
}
