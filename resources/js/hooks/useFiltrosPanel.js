import { router } from '@inertiajs/react';
import { useEffect, useState, useCallback } from 'react';

/**
 * Hook para gestionar filtros en paneles con sincronización a servidor
 * Mantiene los filtros en estado local pero sincroniza con URL/servidor via Inertia
 */
export function useFiltrosPanel(filtrosIniciales = {}, ruta = 'panel', propsActualizar = []) {
    const [filtros, setFiltros] = useState(filtrosIniciales);

    /**
     * Actualiza un filtro individual y sincroniza con servidor
     */
    const actualizarFiltro = useCallback((campo, valor) => {
        setFiltros((anterior) => {
            const nuevosFiltros = { ...anterior, [campo]: valor };

            // Sincronizar inmediatamente con servidor
            const filtrosLimpios = Object.entries(nuevosFiltros).reduce((acc, [clave, val]) => {
                // Excluir filtros vacíos o 'todos'
                if (val !== '' && val !== 'todos' && val !== null) {
                    acc[clave] = val;
                }
                return acc;
            }, {});

            router.get(ruta, filtrosLimpios, {
                preserveState: true,
                preserveScroll: true,
                only: propsActualizar,
                replace: true,
            });

            return nuevosFiltros;
        });
    }, [ruta, propsActualizar]);

    /**
     * Limpia todos los filtros y sincroniza
     */
    const limpiarFiltros = useCallback(() => {
        setFiltros(filtrosIniciales);
        router.get(ruta, {}, {
            preserveState: true,
            preserveScroll: true,
            only: propsActualizar,
            replace: true,
        });
    }, [filtrosIniciales, ruta, propsActualizar]);

    return {
        filtros,
        actualizarFiltro,
        limpiarFiltros,
    };
}
