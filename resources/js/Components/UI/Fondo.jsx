import { t } from '@/i18n';
import { useEffect, useState } from 'react';
import '../../../css/fondoLanding.css';

export default function Fondo() {
    // Lógica para las partículas (añadido)
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        const newParticles = Array.from({ length: 20 }).map((_, i) => ({
            id: i,
            left: Math.random() * 100 + '%',
            top: Math.random() * 100 + '%',
            size: Math.random() * 3 + 1 + 'px',
            delay: Math.random() * 5 + 's',
            duration: Math.random() * 10 + 10 + 's',
        }));
        setParticles(newParticles);
    }, []);

    return (
        <div className="componente-fondo-wrapper">
            <style>
                {`
                    /* Animación de revelado para tu contenido original */
                    .contenido h1, .contenido p {
                        animation: fadeInUp 1.5s ease-out forwards;
                    }

                    @keyframes fadeInUp {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    /* Efecto sorprendente: Partículas flotantes */
                    .particle {
                        position: absolute;
                        background: rgba(212, 175, 55, 0.4); /* Color oro */
                        border-radius: 50%;
                        pointer-events: none;
                        z-index: 2;
                        animation: float linear infinite;
                    }

                    @keyframes float {
                        0% { transform: translateY(0) translateX(0); opacity: 0; }
                        50% { opacity: 0.6; }
                        100% { transform: translateY(-100vh) translateX(20px); opacity: 0; }
                    }
                `}
            </style>

            <section
                className="hero-section"
                role="img"
                aria-label="Un hall de hotel elegante con el texto 'Donde la elegancia encuentra el confort'."
                style={{
                    backgroundImage: `url('/fondo3.jpg?v=${Date.now()}')`,
                }}
            >
                {/* Partículas añadidas sobre el fondo */}
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="particle"
                        aria-hidden="true"
                        style={{
                            left: p.left,
                            top: p.top,
                            width: p.size,
                            height: p.size,
                            animationDelay: p.delay,
                            animationDuration: p.duration,
                        }}
                    />
                ))}

                <div className="overlay" aria-hidden="true"></div>
                <div className="contenido">
                    <h1>{t('home.hero.title')}</h1>
                    <p>{t('home.hero.subtitle')}</p>
                </div>
            </section>
        </div>
    );
}
