import { router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

export function useSincronizarFiltros(
    filtrosIniciales = {},
    ruta = 'panel',
    only = [],
) {
    const [filtros, setFiltros] = useState(filtrosIniciales);

    const actualizarFiltro = useCallback((campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    }, []);

    const aplicarFiltros = useCallback(
        (override = {}) => {
            const payload = { ...filtros, ...override };
            Object.keys(payload).forEach((k) => {
                if (payload[k] === '' || payload[k] === 'todos')
                    payload[k] = undefined;
            });

            router.get(ruta, payload, {
                preserveState: true,
                preserveScroll: true,
                only,
            });
        },
        [filtros, ruta, only],
    );

    const limpiarFiltros = useCallback(() => {
        setFiltros(filtrosIniciales);
        router.get(
            ruta,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only,
            },
        );
    }, [filtrosIniciales, ruta, only]);

    const hayFiltrosActivos = useMemo(() => {
        return Object.values(filtros).some(
            (valor) => valor !== 'todos' && valor !== '',
        );
    }, [filtros]);

    return {
        filtros,
        setFiltros,
        actualizarFiltro,
        aplicarFiltros,
        limpiarFiltros,
        hayFiltrosActivos,
    };
}
