import HeaderPanel from '@/Components/UI/HeaderPanel';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import Paginacion from '@/Components/UI/Paginacion';
import {
    BanknotesIcon,
    CheckIcon,
    InboxIcon,
    TrashIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function IndexReembolsos({
    refunds = [],
    pagination = null,
    loading = false,
    onPageChange = null,
    onApprove = null,
    onReject = null,
    onDelete = null,
}) {
    // --- CONFIGURACIÓN DE ESTADOS FINANCIEROS ---
    const configEstado = {
        pending: {
            clase: 'bg-amber-50 text-amber-700 border-amber-100',
            label: 'Pendiente',
        },
        approved: {
            clase: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            label: 'Aprobado',
        },
        processed: {
            clase: 'bg-blue-50 text-blue-700 border-blue-100',
            label: 'Procesado',
        },
        rejected: {
            clase: 'bg-rose-50 text-rose-700 border-rose-100',
            label: 'Rechazado',
        },
        default: {
            clase: 'bg-gray-50 text-gray-500 border-gray-100',
            label: 'Desconocido',
        },
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Reembolsos"
                subtitulo="Panel de aprobación y auditoría financiera"
                icono={BanknotesIcon}
            />

            {/* --- CONTENEDOR PRINCIPAL --- */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32">
                        <LoadingSpinner />
                        <span className="mt-4 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            Sincronizando transacciones...
                        </span>
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-8">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                            Sin solicitudes activas
                        </h3>
                        <p className="mt-2 max-w-xs text-sm text-gray-400">
                            No hay reembolsos pendientes de procesar en este
                            momento.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="responsive-table w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Referencia
                                        </th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Reserva
                                        </th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Monto Solicitado
                                        </th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Motivo y Notas
                                        </th>
                                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Estado
                                        </th>
                                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {refunds.map((r) => {
                                        const estado =
                                            configEstado[r.status] ||
                                            configEstado.default;
                                        return (
                                            <tr
                                                key={r.id}
                                                className="group transition-colors hover:bg-gray-50/50"
                                            >
                                                {/* ID / Ticket */}
                                                <td
                                                    className="px-6 py-6"
                                                    data-label="Referencia"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-gray-100">
                                                            <span className="font-mono text-xs font-black text-gray-500">
                                                                #{r.id}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-gray-300">
                                                            {r.created_at
                                                                ? format(
                                                                      new Date(
                                                                          r.created_at,
                                                                      ),
                                                                      'dd/MM/yy',
                                                                  )
                                                                : '--'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Reserva / Solicitante */}
                                                <td
                                                    className="px-6 py-6"
                                                    data-label="Reserva / Usuario"
                                                >
                                                    <div className="flex flex-col">
                                                        <div className="mb-1 flex items-center gap-2">
                                                            <div className="rounded bg-gray-900 px-2 py-0.5 font-mono text-[10px] font-black tracking-tighter text-white">
                                                                {r.reserva
                                                                    ?.localizador ??
                                                                    r.reserva_id}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Montos */}
                                                <td
                                                    className="px-6 py-6"
                                                    data-label="Monto Solicitado"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-[#7a0202]">
                                                            {r.requested_amount_cents != null
                                                                ? `${(r.requested_amount_cents / 100).toFixed(2)}€`
                                                                : r.reserva
                                                                ? `${((r.reserva.precio_total ?? 0) - (r.reserva.reembolsos_total ?? 0)).toFixed(2)}€`
                                                                : '—'}
                                                        </span>
                                                        {r.processed_refund && (
                                                            <span className="text-[10px] font-bold uppercase tracking-tighter text-emerald-600">
                                                                Procesado: €
                                                                {(
                                                                    r
                                                                        .processed_refund
                                                                        .amount_cents /
                                                                    100
                                                                ).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Motivo */}
                                                <td
                                                    className="px-6 py-6"
                                                    data-label="Motivo y Notas"
                                                >
                                                    <div className="max-w-[200px]">

                                                        <p
                                                            className="truncate text-xs italic text-gray-500"
                                                            title={r.notes}
                                                        >
                                                            {r.notes ||
                                                                'Sin observaciones adicionales.'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Estado */}
                                                <td
                                                    className="px-6 py-6 text-center"
                                                    data-label="Estado"
                                                >
                                                    <span
                                                        className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest shadow-sm ${estado.clase}`}
                                                    >
                                                        {estado.label}
                                                    </span>
                                                </td>

                                                {/* Acciones */}
                                                <td
                                                    className="px-6 py-6 text-right"
                                                    data-label="Acciones"
                                                >
                                                    {r.status === 'pending' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    onApprove &&
                                                                    onApprove(
                                                                        r.id,
                                                                    )
                                                                }
                                                                className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 shadow-sm transition hover:bg-emerald-100"
                                                                title="Aprobar Reembolso"
                                                            >
                                                                <CheckIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    onReject &&
                                                                    onReject(
                                                                        r.id,
                                                                    )
                                                                }
                                                                className="rounded-xl bg-rose-50 p-2.5 text-rose-600 shadow-sm transition hover:bg-rose-100"
                                                                title="Rechazar"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() =>
                                                                    onDelete &&
                                                                    onDelete(
                                                                        r.id,
                                                                    )
                                                                }
                                                                className="rounded-xl bg-gray-50 p-2.5 text-gray-400 shadow-sm transition hover:text-black"
                                                                title="Eliminar registro"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black uppercase italic text-gray-300">
                                                            Archivado
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        {pagination && (
                            <Paginacion
                                paginaActual={pagination.current_page}
                                totalPaginas={pagination.last_page}
                                inicio={
                                    pagination.per_page *
                                    (pagination.current_page - 1)
                                }
                                fin={
                                    pagination.per_page *
                                    pagination.current_page
                                }
                                total={pagination.total}
                                onCambiarPagina={(page) =>
                                    onPageChange && onPageChange(page)
                                }
                                etiqueta="Solicitudes"
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
