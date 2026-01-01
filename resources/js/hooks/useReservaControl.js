import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import useRetraso from './useRetraso';
import { useSincronizarFiltros } from './useSincronizarFiltros';

export function useReservaFiltros(reservas = [], conteos = {}) {
    const initial = {
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: '',
        notas: '',
    };
    const {
        filtros,
        actualizarFiltro,
        aplicarFiltros,
        limpiarFiltros,
        hayFiltrosActivos,
    } = useSincronizarFiltros(initial, 'panel', [
        'reservas',
        'reservasConteos',
    ]);

    const localizadorRetrasado = useRetraso(filtros.localizador, 500);
    const clienteRetrasado = useRetraso(filtros.cliente, 500);
    const habitacionRetrasada = useRetraso(filtros.habitacion, 500);
    const notasRetrasadas = useRetraso(filtros.notas, 500);

    useEffect(() => {
        router.get(
            route('panel'),
            {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: localizadorRetrasado || undefined,
                cliente: clienteRetrasado || undefined,
                habitacion: habitacionRetrasada || undefined,
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
        clienteRetrasado,
        habitacionRetrasada,
        notasRetrasadas,
    ]);

    return {
        filtros,
        actualizarFiltro,
        registrosFiltrados: reservas,
        limpiarFiltros,
        aplicarFiltros,
        hayFiltrosActivos,
        totalFiltrados: reservas.length,
        totalOriginal: conteos.total || reservas.length,
        conteos,
    };
}
