import { useState, useEffect } from 'react';

export default function CarruselFrases({ noches = 0 }) {
    const [fraseIndex, setFraseIndex] = useState(0);

    // Frases dinámicas que se adaptan al número de noches
    const obtenerFrases = () => {
        if (noches <= 0) {
            return [
                '✨ Selecciona fechas para reservar',
                '🎯 Tu próxima aventura te espera',
                '🏨 Vive una experiencia inolvidable'
            ];
        }

        return [
            `${noches} noches de lujo te esperan`,
            `${noches} ${noches === 1 ? 'noche' : 'noches'} de experiencia premium`,
            `${noches} ${noches === 1 ? 'noche' : 'noches'} para desconectar`,
            `${noches} momentos mágicos te esperan`,
            `${noches} ${noches === 1 ? 'noche' : 'noches'} de confort absoluto`,
            `Prepárate para ${noches} ${noches === 1 ? 'noche' : 'noches'} excepcionales`,
            `${noches} ${noches === 1 ? 'noche' : 'noches'} de verdadera tranquilidad`,
            `Tu escape perfecto: ${noches} ${noches === 1 ? 'noche' : 'noches'}`
        ];
    };

    const frases = obtenerFrases();

    // Cambiar de frase cada 10 segundos
    useEffect(() => {
        const intervalo = setInterval(() => {
            setFraseIndex((prev) => (prev + 1) % frases.length);
        }, 10000);

        return () => clearInterval(intervalo);
    }, [frases.length]);

    return (
        <div className="text-lg lg:text-xl font-black text-white transition-all duration-500 min-h-7">
            {frases[fraseIndex]}
        </div>
    );
}
