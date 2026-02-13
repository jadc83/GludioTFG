import * as api from '@/api/reservas';
import IndexReembolsos from '@/Components/indexes/IndexReembolsos';
import Badge from '@/Components/UI/Badge';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import Paginacion from '@/Components/UI/Paginacion';
import useIndexReserva from '@/hooks/useIndexReserva';
import ReservaTabla from '@/Components/indexes/ReservaTabla';
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

    const {
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
        toggleSortByCreatedAt,
    } = useIndexReserva(reservas);

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
                const rows = paginator?.data ?? (Array.isArray(paginator) ? paginator : []);
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

    const aprobarReembolso = async (id) => {
        if (!confirm('Aprobar y ejecutar reembolso?')) return;
        try {
            const res = await api.aprobarSolicitud(id);
            if (res?.success) {
                // Intentamos marcar la reserva asociada como cancelada si viene en la solicitud
                try {
                    const found = refunds.find((r) => r.id === id);
                    const reservaIdOrLocalizador = found?.reserva?.id ?? found?.reserva_id ?? found?.reserva?.localizador;
                    if (reservaIdOrLocalizador) {
                        await api.modificarEstancia(reservaIdOrLocalizador, { status: 'cancelado' });
                    }
                } catch (e) {
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
            const res = await api.rechazarSolicitud(id, { admin_reason: motivo });
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
        if (!confirm('¿Borrar esta solicitud de reembolso? Esta acción marcará la solicitud como eliminada.')) return;
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
                        <ReservaTabla reservasPaginadas={reservasPaginadas} eliminandoId={eliminandoId} eliminarReserva={eliminarReserva} toggleSortByCreatedAt={toggleSortByCreatedAt} filtros={filtros} />
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
