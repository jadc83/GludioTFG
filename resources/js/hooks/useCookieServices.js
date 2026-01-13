import { useCookieConsent } from '@/hooks/useCookieConsent';

/**
 * Hook para inicializar Google Analytics solo si el usuario ha aceptado cookies de analítica
 * Uso: useAnalytics() en el componente raíz de la aplicación
 */
export function useAnalytics() {
    const { hasAcceptedAnalytics } = useCookieConsent();

    React.useEffect(() => {
        if (hasAcceptedAnalytics()) {
            // Aquí puedes inicializar Google Analytics o el servicio que uses
            // Ejemplo:
            // window.gtag('config', 'GA_MEASUREMENT_ID');
            console.log('Google Analytics habilitado');
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
            // Aquí puedes inicializar servicios de marketing como Facebook Pixel, etc.
            console.log('Servicios de marketing habilitados');
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
            console.log('Cookies de preferencia habilitadas');
        }
    }, [hasAcceptedPreferences]);
}
