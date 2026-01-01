import { useEffect, useState } from 'react';

export default function useRetraso(valor, retraso = 500) {
    const [valorRetrasado, setValorRetrasado] = useState(valor);

    useEffect(() => {
        const handler = setTimeout(() => {
            setValorRetrasado(valor);
        }, retraso);

        return () => clearTimeout(handler);
    }, [valor, retraso]);

    return valorRetrasado;
}
