export function useCookieConsent() {
    const getCookieConsent = () => {
        const cookieConsent = localStorage.getItem('cookieConsent');

        if (!cookieConsent) {
            return { accepted: false, analytics: false, marketing: false, preferences: false };
        }

        try {
            return JSON.parse(cookieConsent);
        } catch (error) {
            return { accepted: false,  analytics: false, marketing: false, preferences: false };
        }
    };

    const hasAcceptedAnalytics = () => {
        const consent = getCookieConsent();
        return consent.analytics === true;
    };

    const hasAcceptedMarketing = () => {
        const consent = getCookieConsent();
        return consent.marketing === true;
    };

    const hasAcceptedPreferences = () => {
        const consent = getCookieConsent();
        return consent.preferences === true;
    };

    return { getCookieConsent, hasAcceptedAnalytics, hasAcceptedMarketing, hasAcceptedPreferences };
}
