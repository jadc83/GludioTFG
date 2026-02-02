import { useEffect, useState } from 'react';

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cookieConsent = localStorage.getItem('cookieConsent');
        if (!cookieConsent) {
            setShowBanner(true);
        }
        setIsLoading(false);
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem(
            'cookieConsent',
            JSON.stringify({
                accepted: true,
                date: new Date().toISOString(),
                analytics: true,
                marketing: true,
                preferences: true,
            }),
        );
        setShowBanner(false);
    };

    const handleAcceptEssential = () => {
        localStorage.setItem(
            'cookieConsent',
            JSON.stringify({
                accepted: true,
                date: new Date().toISOString(),
                analytics: false,
                marketing: false,
                preferences: false,
            }),
        );
        setShowBanner(false);
    };

    if (isLoading || !showBanner) return null;

    return (
        <div className="border-top-accent-1366 fixed bottom-0 left-0 right-0 z-50 border-t-4 bg-gris shadow-2xl">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                    <div className="flex-1">
                        <h3 className="accent-1366 mb-2 text-lg font-bold">
                            🍪 Política de Cookies
                        </h3>
                        <p className="text-sm text-gray-700">
                            Utilizamos cookies para mejorar tu experiencia en
                            nuestro sitio web.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 whitespace-nowrap sm:flex-row">
                        <button
                            onClick={handleAcceptEssential}
                            className="btn-outline-accent-1366 rounded-lg border-2 px-6 py-2 text-sm font-medium transition-colors duration-200"
                        >
                            Solo Esenciales
                        </button>
                        <button
                            onClick={handleAcceptAll}
                            className="btn-accent-1366 rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors duration-200"
                        >
                            Aceptar Todas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
