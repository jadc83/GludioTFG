import { useEffect, useState } from 'react';

export default function useRetraso(valor, retraso = 500) {
    const [valorRetrasado, setValorRetrasado] = useState(valor);

    useEffect(() => {
        // Crear timer que actualiza el valor después del retraso
        const timerRetraso = setTimeout(() => {
            setValorRetrasado(valor);
        }, retraso);

        // Limpiar timer anterior si el valor cambia antes de que se cumpla el retraso
        return () => clearTimeout(timerRetraso);
    }, [valor, retraso]);

    return valorRetrasado;
}
