import { useCallback, useEffect, useState } from 'react';
import { router } from '@inertiajs/react';
import * as api from '@/api/reservas';

export default function useIndexReserva(initialReservas = []) {
    const [reservasLocal, setReservasLocal] = useState(initialReservas);
    const [filtros, setFiltros] = useState({
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: '',
        trashed: 'none',
        sort_by: 'created_at',
        sort_dir: 'desc',
    });
    const [refrescarTabla, setRefrescarTabla] = useState(0);
    const [paginaActual, setPaginaActual] = useState(1);
    const [eliminandoId, setEliminandoId] = useState(null);
    const itemsPorPagina = 10;

    const actualizarFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            status: 'todos',
            localizador: '',
            cliente: '',
            habitacion: '',
            trashed: 'none',
            sort_by: 'created_at',
            sort_dir: 'desc',
        });
    };

    useEffect(() => {
        const contador = setTimeout(() => {
            const criterios = {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: filtros.localizador || undefined,
                cliente: filtros.cliente || undefined,
                habitacion: filtros.habitacion || undefined,
                trashed:
                    filtros.trashed && filtros.trashed !== 'none'
                        ? filtros.trashed
                        : undefined,
                sort_by: filtros.sort_by || undefined,
                sort_dir: filtros.sort_dir || undefined,
            };
            Object.keys(criterios).forEach(
                (key) => criterios[key] === undefined && delete criterios[key],
            );
            router.get(route('panel'), criterios, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(contador);
    }, [filtros, refrescarTabla]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) return;
        const channel = window.Echo.private('reservas');

        channel.listen('ReservaActualizada', async (event) => {
            try {
                const reservaId = event?.id;
                if (!reservaId) return;

                const local = reservasLocal.find((r) => r.id === reservaId);
                const localizador = local?.localizador;
                if (!localizador) {
                    setRefrescarTabla((prev) => prev + 1);
                    return;
                }

                try {
                    const detalle = await api.buscarReserva(localizador);
                    const reservaData = detalle?.reserva ?? detalle?.data ?? detalle ?? null;
                    if (!reservaData) {
                        setRefrescarTabla((prev) => prev + 1);
                        return;
                    }

                    setReservasLocal((prev) =>
                        prev.map((r) => (r.localizador !== localizador ? r : { ...r, ...reservaData })),
                    );
                } catch (e) {
                    setRefrescarTabla((prev) => prev + 1);
                }
            } catch (e) {
                // ignore
            }
        });

        const simpleHandler = () => setRefrescarTabla((prev) => prev + 1);
        channel.listen('ReservaCreada', simpleHandler).listen('ReservaBorrada', simpleHandler);

        return () => {
            channel
                .stopListening('ReservaCreada')
                .stopListening('ReservaActualizada')
                .stopListening('ReservaBorrada');
        };
    }, [reservasLocal]);

    // Polling fallback para estados de pago
    useEffect(() => {
        let intervalId;
        const tick = async () => {
            try {
                const inicioLocal = (paginaActual - 1) * itemsPorPagina;
                const finLocal = inicioLocal + itemsPorPagina;
                const pageRows = reservasLocal.slice(inicioLocal, finLocal);
                if (!pageRows || pageRows.length === 0) return;

                const locs = pageRows.map((r) => r.localizador).filter(Boolean).join(',');
                if (!locs) return;

                const url = route('api.reservas.estados') + '?localizadores=' + encodeURIComponent(locs);
                const res = await fetch(url, { headers: { Accept: 'application/json' } });
                if (!res.ok) return;
                const json = await res.json();
                if (json.success && json.data) {
                    setReservasLocal((prev) => {
                        let changed = false;
                        const updated = prev.map((r) => {
                            const newPago = json.data[r.localizador] ?? r.pago;
                            if (newPago !== r.pago) {
                                changed = true;
                                return { ...r, pago: newPago };
                            }
                            return r;
                        });
                        return changed ? updated : prev;
                    });
                }
            } catch (e) {
                // ignore
            }
        };

        tick();
        intervalId = setInterval(tick, 10000);

        return () => clearInterval(intervalId);
    }, [paginaActual, reservasLocal]);

    const eliminarReserva = useCallback(async (id) => {
        if (!confirm('¿Estás seguro de que deseas eliminar esta reserva?')) return;
        setEliminandoId(id);

        try {
            await router.delete(`/reservas/${id}`, { preserveScroll: true });
        } finally {
            setTimeout(() => setEliminandoId(null), 3000);
        }
    }, []);

    // Pagination calculations
    const totalPaginas = Math.ceil(reservasLocal.length / itemsPorPagina);
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const reservasPaginadas = reservasLocal.slice(inicio, fin);

    const toggleSortByCreatedAt = () => {
        setFiltros((prev) => ({ ...prev, sort_by: 'created_at', sort_dir: prev.sort_dir === 'asc' ? 'desc' : 'asc' }));
    };

    useEffect(() => {
        setReservasLocal(initialReservas);
        setPaginaActual(1);
    }, [initialReservas]);

    return {
        reservasLocal,
        reservasPaginadas,
        filtros,
        actualizarFiltro,
        limpiarFiltros,
        paginaActual,
        setPaginaActual,
        eliminarReserva,
        eliminandoId,
        itemsPorPagina,
        totalPaginas,
        inicio,
        fin,
        refrescarTabla,
        setRefrescarTabla,
        toggleSortByCreatedAt,
    };
}
