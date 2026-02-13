import * as api from '@/api/reservas';
import IndexReembolsos from '@/Components/indexes/IndexReembolsos';
import Badge from '@/Components/UI/Badge';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import Paginacion from '@/Components/UI/Paginacion';
import {
    HomeIcon,
    InboxIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useCallback, useEffect, useState } from 'react';

export default function IndexReserva({ reservas = [] }) {
    // Local copy of reservas so we can update payment status client-side
    const [reservasLocal, setReservasLocal] = useState(reservas);

    const [filtros, setFiltros] = useState({
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: '',
        trashed: 'none',
        // sorting: sort by creation date by default (newest first)
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
                // sorting params
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

        // When a ReservaActualizada event arrives, fetch the full reserva and update only that row
        channel.listen('ReservaActualizada', async (event) => {
            try {
                const reservaId = event?.id;
                if (!reservaId) return;

                // find localizador from local copy
                const local = reservasLocal.find((r) => r.id === reservaId);
                const localizador = local?.localizador;
                if (!localizador) {
                    // fallback: trigger a full refresh
                    setRefrescarTabla((prev) => prev + 1);
                    return;
                }

                // Use the API helper to fetch the full formatted reserva (includes pagos/reembolsos)
                try {
                    const detalle = await api.buscarReserva(localizador);
                    // `buscarReserva` returns the server payload; prefer `reserva` key if present
                    const reservaData = detalle?.reserva ?? detalle?.data ?? detalle ?? null;
                    if (!reservaData) {
                        // fallback to small estados endpoint
                        setRefrescarTabla((prev) => prev + 1);
                        return;
                    }

                    setReservasLocal((prev) => {
                        const updated = prev.map((r) => {
                            if (r.localizador !== localizador) return r;
                            // Merge existing object with fresh server data to keep client-only fields
                            return { ...r, ...reservaData };
                        });
                        return updated;
                    });
                } catch (e) {
                    // if fetching full reserva fails, fallback to refreshing table
                    setRefrescarTabla((prev) => prev + 1);
                }
            } catch (e) {
                // ignore errors
            }
        });

        // Also listen for create/delete to refresh table conservatively
        const simpleHandler = () => setRefrescarTabla((prev) => prev + 1);
        channel.listen('ReservaCreada', simpleHandler).listen('ReservaBorrada', simpleHandler);

        return () => {
            channel
                .stopListening('ReservaCreada')
                .stopListening('ReservaActualizada')
                .stopListening('ReservaBorrada');
        };
    }, [reservasLocal]);

    // Polling fallback: si no hay broadcasting conectado, consultar estados de pago visibles cada 10s
    useEffect(() => {
        let intervalId;
        const tick = async () => {
            try {
                const inicioLocal = (paginaActual - 1) * itemsPorPagina;
                const finLocal = inicioLocal + itemsPorPagina;
                const pageRows = reservasLocal.slice(inicioLocal, finLocal);
                if (!pageRows || pageRows.length === 0) return;

                const locs = pageRows
                    .map((r) => r.localizador)
                    .filter(Boolean)
                    .join(',');
                if (!locs) return;

                const url =
                    route('api.reservas.estados') +
                    '?localizadores=' +
                    encodeURIComponent(locs);
                const res = await fetch(url, {
                    headers: { Accept: 'application/json' },
                });
                if (!res.ok) return;
                const json = await res.json();
                if (json.success && json.data) {
                    // Solo actualizar si hay cambios para evitar re-renders que re-lancen el efecto
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
            }
        };

        // Ejecutar inmediatamente y luego cada 10s
        tick();
        intervalId = setInterval(tick, 10000);

        return () => clearInterval(intervalId);
    }, [paginaActual, reservasLocal]);

    const eliminarReserva = async (id) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
            setEliminandoId(id);

            try {
                await router.delete(`/reservas/${id}`, {
                    preserveScroll: true,
                });
            } finally {
                // Delay extendido para asegurar que el spinner sea bien perceptible
                setTimeout(() => setEliminandoId(null), 3000);
            }
        }
    };

    // --- Reembolsos (embed debajo de tabla de reservas) ---
    const [refunds, setRefunds] = useState([]);
    const [refundsLoading, setRefundsLoading] = useState(false);
    const [refundsPagination, setRefundsPagination] = useState(null);
    const [refundsPage, setRefundsPage] = useState(1);

    const fetchRefunds = useCallback(
        async (p = refundsPage) => {
            setRefundsLoading(true);
            try {
                const res = await api.listarSolicitudesReembolso({ page: p });
                const paginator = res?.data ?? res ?? null;
                const rows =
                    paginator?.data ??
                    (Array.isArray(paginator) ? paginator : []);
                setRefunds(rows);
                setRefundsPagination(paginator);
            } catch (e) {
                setRefunds([]);
                setRefundsPagination(null);
            } finally {
                setRefundsLoading(false);
            }
        },
        [refundsPage],
    );

    useEffect(() => {
        fetchRefunds(refundsPage);
    }, [refundsPage, fetchRefunds]);

    const toggleSortByCreatedAt = () => {
        setFiltros((prev) => ({
            ...prev,
            sort_by: 'created_at',
            sort_dir: prev.sort_dir === 'asc' ? 'desc' : 'asc',
        }));
    };

    useEffect(() => {
        try {
            if (window.Echo) {
                const channel = window.Echo.private('refund-requests');
                channel.listen('RefundRequestCreated', () => fetchRefunds(1));
            }
        } catch (e) {
            // Echo not available
        }

        return () => {
            try {
                if (window.Echo && window.Echo.leave) {
                    window.Echo.leave('refund-requests');
                }
            } catch (e) {
            }
        };
    }, [fetchRefunds]);

    const aprobarReembolso = async (id) => {
        if (!confirm('Aprobar y ejecutar reembolso?')) return;
        try {
            const res = await api.aprobarSolicitud(id);
            if (res?.success) {
                // Intentar marcar la reserva asociada como cancelada
                try {
                    const found = refunds.find((r) => r.id === id);
                    const reservaIdOrLocalizador = found?.reserva?.id ?? found?.reserva_id ?? found?.reserva?.localizador;
                    if (reservaIdOrLocalizador) {
                        await api.modificarEstancia(reservaIdOrLocalizador, { status: 'cancelado' });
                        // actualizar copia local de reservas si coincide el localizador
                        setReservasLocal((prev) =>
                            prev.map((r) => {
                                const loc = r.localizador || r.id;
                                const matchLoc = found?.reserva?.localizador && found.reserva.localizador === loc;
                                const matchId = found?.reserva?.id && found.reserva.id === r.id;
                                if (matchLoc || matchId) {
                                    return { ...r, status: 'cancelado' };
                                }
                                return r;
                            }),
                        );
                    }
                } catch (e) {
                    // no bloquear el flujo si la actualización de estado falla
                    console.warn('No se pudo marcar la reserva como cancelada', e);
                }

                alert('Reembolso ejecutado y solicitud aprobada');
                fetchRefunds(refundsPage);
            } else {
                alert(res?.message || 'Error');
            }
        } catch (e) {
            alert('Error ejecutando reembolso');
        }
    };

    const rechazarReembolso = async (id) => {
        const motivo = prompt('Motivo de rechazo (requerido)');
        if (!motivo) return alert('Motivo requerido');
        try {
            const res = await api.rechazarSolicitud(id, {
                admin_reason: motivo,
            });
            if (res?.success) {
                alert('Solicitud rechazada');
                fetchRefunds(refundsPage);
            } else {
                alert(res?.message || 'Error');
            }
        } catch (e) {
            alert('Error rechazando solicitud');
        }
    };

    const borrarReembolso = async (id) => {
        if (
            !confirm(
                '¿Borrar esta solicitud de reembolso? Esta acción marcará la solicitud como eliminada.',
            )
        )
            return;
        try {
            const res = await api.eliminarSolicitud(id);
            if (res?.success) {
                alert('Solicitud eliminada.');
                fetchRefunds(refundsPage);
            } else {
                alert(res?.message || 'Error borrando solicitud');
            }
        } catch (e) {
            alert('Error borrando solicitud');
        }
    };

    // Usar la copia local para paginación y render
    useEffect(() => {
        setReservasLocal(reservas);
        setPaginaActual(1);
    }, [reservas]);

    // Cálculo de paginación
    const totalPaginas = Math.ceil(reservasLocal.length / itemsPorPagina);
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const reservasPaginadas = reservasLocal.slice(inicio, fin);

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Reservas y reembolsos"
                subtitulo="Consultas y acciones administrativas"
            />

            {/* Barra de filtros */}
            <BarraBuscador
                filtros={filtros}
                onActualizarFiltro={actualizarFiltro}
                onLimpiarFiltros={limpiarFiltros}
                placeholderBusqueda="Localizador..."
                layout="grid"
                filtrosAdicionales={[
                    {
                        tipo: 'input',
                        nombre: 'cliente',
                        placeholder: 'Nombre del cliente...',
                        icono: <UserIcon className="h-4 w-4" />,
                    },
                    {
                        tipo: 'input',
                        nombre: 'habitacion',
                        placeholder: 'Nº Habitación...',
                        icono: <HomeIcon className="h-4 w-4" />,
                    },
                    {
                        tipo: 'select',
                        nombre: 'status',
                        opciones: [
                            { valor: 'todos', etiqueta: 'Todos los estados' },
                            { valor: 'pendiente', etiqueta: 'Pendiente' },
                            { valor: 'confirmado', etiqueta: 'Confirmada' },
                            { valor: 'checked_in', etiqueta: 'En Estancia' },
                            { valor: 'checked_out', etiqueta: 'Finalizada' },
                            { valor: 'cancelado', etiqueta: 'Cancelada' },
                            {
                                valor: 'no_presentado',
                                etiqueta: 'No Presentado',
                            },
                            {
                                valor: 'reembolso_parcial_pendiente',
                                etiqueta: 'Reembolso Parcial Pendiente',
                            },
                            {
                                valor: 'reembolso_total_pendiente',
                                etiqueta: 'Reembolso Total Pendiente',
                            },
                            {
                                valor: 'reembolso_parcial_confirmado',
                                etiqueta: 'Reembolso Parcial',
                            },
                        ],
                    },
                    {
                        tipo: 'select',
                        nombre: 'trashed',
                        opciones: [
                            { valor: 'none', etiqueta: 'No incluir borradas' },
                            { valor: 'with', etiqueta: 'Incluir borradas' },
                            { valor: 'only', etiqueta: 'Sólo borradas' },
                        ],
                    },
                ]}
            />

            {/* --- TABLA DE RESERVAS --- */}
            <div className="mt-4 flex items-center justify-end gap-3 px-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="text-xs font-bold uppercase text-gray-400">Ordenar por:</span>
                    <button
                        onClick={toggleSortByCreatedAt}
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        title="Ordenar por fecha de creación"
                    >
                        Fecha creación
                        {filtros.sort_dir === 'asc' ? (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <path d="M5 15l7-7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        ) : (
                            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                                <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                {reservas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-8">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                            Sin Reservas
                        </h3>
                        <p className="mt-1 max-w-xs text-sm text-gray-400">
                            No hay registros que coincidan con la búsqueda.
                        </p>
                        <button
                            onClick={limpiarFiltros}
                            className="mt-6 text-xs font-black uppercase tracking-widest text-[#7a0202] hover:underline"
                        >
                            Ver todas
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="responsive-table w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Localizador
                                    </th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Habitación
                                    </th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Llegada
                                    </th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Salida
                                    </th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Precio
                                    </th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Estado Pago
                                    </th>
                                    <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Estado Reserva
                                    </th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reservasPaginadas.map((reserva) => {
                                    const visiblePrice =
                                        typeof reserva.ultimo_pago_monto ===
                                            'number' &&
                                        reserva.ultimo_pago_monto !== null
                                            ? parseFloat(
                                                  reserva.ultimo_pago_monto,
                                              )
                                            : reserva.pagos &&
                                                reserva.pagos.length
                                              ? parseFloat(
                                                    reserva.pagos[
                                                        reserva.pagos.length - 1
                                                    ].monto,
                                                )
                                              : parseFloat(
                                                    reserva.precio_total || 0,
                                                );
                                    return (
                                        <tr
                                            key={reserva.id}
                                            className="group transition-colors hover:bg-gray-50/50"
                                        >
                                            {/* Localizador Box */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Localizador"
                                            >
                                                <div className="flex w-full items-center justify-end justify-center gap-3 md:justify-center">
                                                    <div className="flex h-10 w-16 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200 transition-colors group-hover:bg-[#7a0202]">
                                                        <span className="font-mono text-xs font-black tracking-tighter">
                                                            {
                                                                reserva.localizador
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Cliente */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Cliente"
                                            >
                                                <span className="text-xs font-medium uppercase leading-none tracking-tight text-gray-900">
                                                    {reserva.cliente_name ||
                                                        'Anónimo'}
                                                </span>
                                            </td>

                                            {/* Habitación */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Habitación"
                                            >
                                                <span className="text-sm font-medium text-gray-600">
                                                    {reserva.habitacion_numero ||
                                                        '—'}
                                                </span>
                                            </td>

                                            {/* Llegada */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Llegada"
                                            >
                                                <div className="font-mono text-xs font-medium text-gray-600">
                                                    {new Date(
                                                        reserva.check_in,
                                                    ).toLocaleDateString(
                                                        'es-ES',
                                                    )}
                                                </div>
                                            </td>

                                            {/* Salida */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Salida"
                                            >
                                                <div className="font-mono text-xs font-medium text-gray-600">
                                                    {new Date(
                                                        reserva.check_out,
                                                    ).toLocaleDateString(
                                                        'es-ES',
                                                    )}
                                                </div>
                                            </td>

                                            {/* Precio */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Precio"
                                            >
                                                <div className="flex w-full flex-col items-end md:items-center">
                                                    <span className="text-xs text-gray-400 line-through">
                                                        {(
                                                            parseFloat(
                                                                reserva.precio_total ||
                                                                    0,
                                                            ) +
                                                            parseFloat(
                                                                reserva.descuento_aplicado ||
                                                                    0,
                                                            )
                                                        ).toFixed(2)}{' '}
                                                        €
                                                    </span>
                                                    <span className="text-xs font-bold text-gray-900">
                                                        {visiblePrice.toFixed(
                                                            2,
                                                        )}{' '}
                                                        €
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Estado Pago */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Estado Pago"
                                            >
                                                <div className="flex w-full justify-end md:justify-center">
                                                    {(() => {
                                                        const pagos = reserva.pagos || [];
                                                        // Priorizar cualquier Pago reembolsado/completo sobre pagos 'procesando'
                                                        const pagoReembolsado = pagos.find(
                                                            (p) => (p.reembolso_estado === 'completo') || (p.estado === 'cancelado')
                                                        );
                                                        if (pagoReembolsado) {
                                                            return <Badge label={'Devuelto'} tipo={'devuelto'} />;
                                                        }

                                                        const ultimoPago = pagos.length ? pagos[pagos.length - 1] : null;

                                                        if (ultimoPago) {
                                                            // Reembolso parcial procesado
                                                            if (ultimoPago.reembolso_estado === 'parcial_procesado') {
                                                                return <Badge label={'Parcialmente Reembolsado'} tipo={'reembolso_parcial'} />;
                                                            }
                                                            // Pago procesado/completado
                                                            if (ultimoPago.estado === 'completado' || ultimoPago.estado === 'pagado') {
                                                                return <Badge label={'Pagado'} tipo={'completado'} />;
                                                            }
                                                            // En procesamiento
                                                            if (ultimoPago.estado === 'procesando') {
                                                                return <Badge label={'Procesando'} tipo={'procesando'} />;
                                                            }
                                                        }

                                                        // Fallback: usar campo reserva.pago para compatibilidad
                                                        return (
                                                            <Badge
                                                                label={
                                                                    reserva.pago === 'pagado'
                                                                        ? 'Pagado'
                                                                        : reserva.pago === 'devuelto'
                                                                        ? 'Devuelto'
                                                                        : reserva.pago === 'reembolso_pendiente'
                                                                        ? 'Reembolso Pendiente'
                                                                        : reserva.pago === 'reembolso_parcial_procesado'
                                                                        ? 'Parcialmente Reembolsado'
                                                                        : 'Pendiente'
                                                                }
                                                                tipo={reserva.pago || 'pendiente'}
                                                            />
                                                        );
                                                    })()}
                                                </div>
                                            </td>

                                            {/* Estado Reserva */}
                                            <td
                                                className="px-6 py-6 text-center"
                                                data-label="Estado Reserva"
                                            >
                                                <div className="flex w-full justify-end md:justify-center">
                                                    <Badge
                                                        label={
                                                            reserva.status ===
                                                            'confirmado'
                                                                ? 'Confirmada'
                                                                : reserva.status ===
                                                                    'checked_in'
                                                                  ? 'En Estancia'
                                                                  : reserva.status ===
                                                                      'checked_out'
                                                                    ? 'Finalizada'
                                                                    : reserva.status ===
                                                                        'cancelado'
                                                                      ? 'Cancelada'
                                                                      : reserva.status ===
                                                                          'no_presentado'
                                                                        ? 'No Presentado'
                                                                        : reserva.status ===
                                                                            'pendiente'
                                                                          ? 'Pendiente'
                                                                          : reserva.status ===
                                                                              'reembolso_parcial_pendiente'
                                                                            ? 'Reembolso Parcial Pendiente'
                                                                            : reserva.status ===
                                                                                'reembolso_total_pendiente'
                                                                              ? 'Reembolso Total Pendiente'
                                                                              : reserva.status ===
                                                                                  'reembolso_parcial_confirmado'
                                                                                ? 'Reembolso Parcial'
                                                                                : 'Pendiente'
                                                        }
                                                        tipo={
                                                            reserva.status ||
                                                            'pendiente'
                                                        }
                                                    />
                                                </div>
                                            </td>

                                            {/* Acciones */}
                                            <td
                                                className="full-width mt-2 px-6 py-6 text-right md:mt-0"
                                                data-label="Acciones"
                                            >
                                                <div className="flex w-full justify-end gap-2">
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                `/reservas/${reserva.id}/edit`,
                                                            )
                                                        }
                                                        className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:border-red-100 hover:text-[#7a0202]"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            eliminarReserva(
                                                                reserva.id,
                                                            )
                                                        }
                                                        disabled={
                                                            eliminandoId ===
                                                            reserva.id
                                                        }
                                                        className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:text-black disabled:opacity-50"
                                                    >
                                                        {eliminandoId ===
                                                        reserva.id ? (
                                                            <LoadingSpinner />
                                                        ) : (
                                                            <TrashIcon className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {reservas.length > 0 && (
                    <Paginacion
                        paginaActual={paginaActual}
                        totalPaginas={totalPaginas}
                        inicio={inicio}
                        fin={fin}
                        total={reservas.length}
                        onCambiarPagina={setPaginaActual}
                        etiqueta="Reservas"
                    />
                )}

                {/* Reembolsos embebidos */}
                <div className="mt-12">
                    <IndexReembolsos
                        refunds={refunds}
                        pagination={refundsPagination}
                        loading={refundsLoading}
                        onPageChange={(p) => setRefundsPage(p)}
                        onApprove={aprobarReembolso}
                        onReject={rechazarReembolso}
                        onDelete={borrarReembolso}
                    />
                </div>
            </div>
        </div>
    );
}
