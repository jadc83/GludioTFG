import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import useRetraso from './useRetraso';
import { useSincronizarFiltros } from './useSincronizarFiltros';

export function useReservaFiltros(reservas = [], conteos = {}) {
    // Configuración inicial de filtros
    const filtrosIniciales = {
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: '',
        notas: '',
    };

    // Sincronizar filtros con URL
    const {
        filtros,
        actualizarFiltro,
        aplicarFiltros,
        limpiarFiltros,
        hayFiltrosActivos,
    } = useSincronizarFiltros(filtrosIniciales, 'panel', [
        'reservas',
        'reservasConteos',
    ]);

    // Aplicar retrasos a búsquedas de texto (500ms)
    const localizadorRetrasado = useRetraso(filtros.localizador, 500);
    const nombreClienteRetrasado = useRetraso(filtros.cliente, 500);
    const tipoHabitacionRetrasado = useRetraso(filtros.habitacion, 500);
    const notasRetrasadas = useRetraso(filtros.notas, 500);

    /**
     * Actualizar resultados cuando cambian los filtros
     */
    useEffect(() => {
        router.get(
            route('panel'),
            {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: localizadorRetrasado || undefined,
                cliente: nombreClienteRetrasado || undefined,
                habitacion: tipoHabitacionRetrasado || undefined,
                notas: notasRetrasadas || undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                only: ['reservas', 'reservasConteos'],
                replace: true,
            },
        );
    }, [
        filtros.status,
        localizadorRetrasado,
        nombreClienteRetrasado,
        tipoHabitacionRetrasado,
        notasRetrasadas,
    ]);

    return {
        // Estado de filtros
        filtros: {
            estado: filtros.status,
            setEstado: (valor) => actualizarFiltro('status', valor),
            localizador: filtros.localizador,
            setLocalizador: (valor) => actualizarFiltro('localizador', valor),
            nombreCliente: filtros.cliente,
            setNombreCliente: (valor) => actualizarFiltro('cliente', valor),
            tipoHabitacion: filtros.habitacion,
            setTipoHabitacion: (valor) => actualizarFiltro('habitacion', valor),
            notas: filtros.notas,
            setNotas: (valor) => actualizarFiltro('notas', valor),
        },

        // Datos filtrados
        datos: {
            reservasFiltradas: reservas,
            totalFiltrados: reservas.length,
            totalOriginal: conteos.total || reservas.length,
            conteos,
        },

        // Acciones disponibles
        acciones: {
            aplicarFiltros,
            limpiarFiltros,
            hayFiltrosActivos,
        },
    };
}
