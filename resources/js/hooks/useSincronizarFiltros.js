import { router } from '@inertiajs/react';
import { useCallback, useMemo, useState } from 'react';

export function useSincronizarFiltros(
    filtrosIniciales = {},
    ruta = 'panel',
    solo = [],
) {
    // Estado de los filtros actuales
    const [filtros, setFiltros] = useState(filtrosIniciales);

    /**
     * Actualiza un campo individual del filtro
     * @param {string} nombreCampo - Nombre del campo
     * @param {any} valor - Nuevo valor
     */
    const actualizarFiltro = useCallback((nombreCampo, valor) => {
        setFiltros((filtrosAnteriores) => ({
            ...filtrosAnteriores,
            [nombreCampo]: valor,
        }));
    }, []);

    /**
     * Aplica los filtros actuales enviando petición al servidor
     * @param {Object} filtrosSobrescritura - Filtros opcionales para sobrescribir los actuales
     */
    const aplicarFiltros = useCallback(
        (filtrosSobrescritura = {}) => {
            // Merge filtros actuales con los de sobrescritura
            const filtrosAplicar = { ...filtros, ...filtrosSobrescritura };

            // Eliminar filtros vacíos o con valor 'todos'
            Object.keys(filtrosAplicar).forEach((clave) => {
                const valor = filtrosAplicar[clave];
                if (valor === '' || valor === 'todos') {
                    filtrosAplicar[clave] = undefined;
                }
            });

            // Enviar al servidor
            router.get(ruta, filtrosAplicar, {
                preserveState: true,
                preserveScroll: true,
                only: solo,
            });
        },
        [filtros, ruta, solo],
    );

    /**
     * Resetea todos los filtros a sus valores iniciales
     */
    const limpiarFiltros = useCallback(() => {
        setFiltros(filtrosIniciales);
        router.get(
            ruta,
            {},
            {
                preserveState: true,
                preserveScroll: true,
                only: solo,
            },
        );
    }, [filtrosIniciales, ruta, solo]);

    /**
     * Verifica si hay filtros activos (distintos del valor inicial/vacío)
     */
    const hayFiltrosActivos = useMemo(() => {
        return Object.values(filtros).some(
            (valor) => valor !== 'todos' && valor !== '' && valor !== null,
        );
    }, [filtros]);

    return {
        // Estado
        filtros,
        setFiltros,

        // Métodos de actualización
        actualizarFiltro,
        aplicarFiltros,
        limpiarFiltros,

        // Estado computado
        hayFiltrosActivos,
    };
}
