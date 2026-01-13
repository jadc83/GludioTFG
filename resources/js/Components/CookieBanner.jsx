import { useEffect, useState } from 'react';

export default function CookieBanner() {
    const [showBanner, setShowBanner] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Verificar si el usuario ya ha aceptado las cookies
        const cookieConsent = localStorage.getItem('cookieConsent');
        
        if (!cookieConsent) {
            setShowBanner(true);
        }
        
        setIsLoading(false);
    }, []);

    const handleAcceptAll = () => {
        localStorage.setItem('cookieConsent', JSON.stringify({
            accepted: true,
            date: new Date().toISOString(),
            analytics: true,
            marketing: true,
            preferences: true
        }));
        setShowBanner(false);
    };

    const handleAcceptEssential = () => {
        localStorage.setItem('cookieConsent', JSON.stringify({
            accepted: true,
            date: new Date().toISOString(),
            analytics: false,
            marketing: false,
            preferences: false
        }));
        setShowBanner(false);
    };

    if (isLoading || !showBanner) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-gris shadow-2xl border-t-4" style={{ borderTopColor: '#7a0202' }}>
            <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    {/* Contenido */}
                    <div className="flex-1">
                        <h3 className="text-lg font-bold mb-2" style={{ color: '#7a0202' }}>
                            🍪 Política de Cookies
                        </h3>
                        <p className="text-gray-700 text-sm">
                            Utilizamos cookies para mejorar tu experiencia en nuestro sitio web. 
                            Las cookies esenciales son necesarias para el funcionamiento del sitio, 
                            mientras que las analíticas nos ayudan a entender cómo utilizas nuestro 
                            servicio. Para más información, consulta nuestra{' '}
                            <a 
                                href="/politica-privacidad" 
                                className="underline font-medium transition-colors duration-200"
                                style={{ color: '#7a0202' }}
                                onMouseEnter={(e) => e.target.style.color = '#920303'}
                                onMouseLeave={(e) => e.target.style.color = '#7a0202'}
                            >
                                política de privacidad
                            </a>
                            .
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row gap-3 whitespace-nowrap">
                        <button
                            onClick={handleAcceptEssential}
                            className="px-6 py-2 text-gray-700 rounded-lg font-medium transition-colors duration-200 text-sm border-2"
                            style={{ 
                                backgroundColor: 'transparent',
                                borderColor: '#7a0202',
                                color: '#7a0202'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#E2E0DC';
                                e.target.style.borderColor = '#920303';
                                e.target.style.color = '#920303';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = 'transparent';
                                e.target.style.borderColor = '#7a0202';
                                e.target.style.color = '#7a0202';
                            }}
                        >
                            Solo Esenciales
                        </button>
                        <button
                            onClick={handleAcceptAll}
                            className="px-6 py-2 text-white rounded-lg font-medium transition-colors duration-200 text-sm"
                            style={{ backgroundColor: '#7a0202' }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#920303'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#7a0202'}
                        >
                            Aceptar Todas
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
