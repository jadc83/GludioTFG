import { format } from 'date-fns';

export default function IndexReembolsos({ refunds = [], pagination = null, loading = false, onPageChange = null, onApprove = null, onReject = null, onDelete = null }) {
    return (
        <div className="p-3 md:p-6">
            <h2 className="text-lg font-bold mb-4 text-[#7a0202]">Solicitudes de Reembolso</h2>

            {loading && <div>Loading…</div>}

            {!loading && refunds.length === 0 && (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                    <svg className="h-24 w-24 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path><path d="M16 3l-4 4-4-4" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path></svg>
                    <div className="text-center">
                        <p className="mb-2 text-xl font-semibold text-gray-600">No hay solicitudes de reembolso</p>
                        <p className="text-gray-400">Aún no se han creado solicitudes de reembolso</p>
                    </div>
                </div>
            )}

            {!loading && refunds.length > 0 && (
                <div className="table-card card overflow-hidden rounded-lg bg-white shadow-lg">
                    <div className="overflow-x-auto p-2 md:p-4">
                        <table className="table table-zebra table-compact w-full text-xs md:text-sm panel-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Reserva</th>
                                    <th>Solicitante</th>
                                    <th>Solicitud</th>
                                    <th>Reembolso</th>
                                    <th>Motivo</th>
                                    <th>Estado</th>
                                    <th>Creado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {refunds.map((r) => (
                                    <tr key={r.id}>
                                        <td>{r.id}</td>
                                        <td>{r.reserva?.localizador ?? r.reserva_id}</td>
                                        <td>{r.user?.name ?? 'Cliente'}</td>
                                        <td>{r.requested_amount_cents ? `€${(r.requested_amount_cents/100).toFixed(2)}` : '-'}</td>
                                        <td>{r.processed_refund ? `€${(r.processed_refund.amount_cents/100).toFixed(2)} (${r.refund_type ?? 'procesado'})` : '-'}</td>
                                        <td>{r.reason_code}{r.notes ? ` — ${r.notes}` : ''}</td>
                                        <td>{r.status}</td>
                                        <td>{r.created_at ? format(new Date(r.created_at), 'yyyy-MM-dd HH:mm') : ''}</td>
                                        <td>
                                            {r.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => onApprove && onApprove(r.id)} className="btn btn-sm btn-index btn-primary-burgundy">Aprobar</button>
                                                    <button onClick={() => onReject && onReject(r.id)} className="btn btn-sm btn-index btn-primary-black">Rechazar</button>
                                                    <button onClick={() => onDelete && onDelete(r.id)} className="btn btn-sm btn-index btn-ghost">Borrar</button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {pagination && (
                        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-200 bg-gris footer-panel px-3 py-4 sm:gap-6 sm:px-6 sm:py-6 sm:flex-row">
                            <div className="text-xs font-medium text-gray-700 md:text-sm">
                                <span className="font-semibold text-primary">{(pagination.per_page * (pagination.current_page - 1)) + 1}</span>
                                <span className="mx-1 text-gray-500">a</span>
                                <span className="font-semibold text-primary">{Math.min(pagination.per_page * pagination.current_page, pagination.total)}</span>
                                <span className="mx-1 text-gray-500">de</span>
                                <span className="font-semibold text-primary">{pagination.total}</span>
                                <span className="ml-1 text-gray-600">solicitud{pagination.total !== 1 ? 'es' : ''}</span>
                            </div>

                            <div className="flex items-center gap-2 md:gap-3">
                                <button disabled={!pagination.prev_page_url} onClick={() => onPageChange && onPageChange(pagination.current_page - 1)} className="btn btn-xs md:btn-sm gap-1 md:gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400">Anterior</button>

                                <div className="flex items-center gap-1 rounded-lg bg-white p-1 md:p-2 shadow-sm">
                                    {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                        <button key={page} onClick={() => onPageChange && onPageChange(page)} className={`btn btn-xs px-2 md:px-3 transition-all ${pagination.current_page === page ? 'border-0 bg-gradient-to-r from-red-500 to-red-600 text-xs md:text-base' : 'border-0 bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs md:text-base' }`}>
                                            {page}
                                        </button>
                                    ))}
                                </div>

                                <button disabled={!pagination.next_page_url} onClick={() => onPageChange && onPageChange(pagination.current_page + 1)} className="btn btn-xs md:btn-sm gap-1 md:gap-2 border-0 text-gray-700 transition-all hover:text-primary disabled:text-gray-400">Siguiente</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
