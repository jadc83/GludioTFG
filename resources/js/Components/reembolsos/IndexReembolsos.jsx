import { format } from 'date-fns';
import Badge from '@/Components/UI/Badge';
import {
    InboxIcon,
    CheckIcon,
    XMarkIcon,
    TrashIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    BanknotesIcon,
    TicketIcon
} from '@heroicons/react/24/outline';

export default function IndexReembolsos({
    refunds = [],
    pagination = null,
    loading = false,
    onPageChange = null,
    onApprove = null,
    onReject = null,
    onDelete = null
}) {



    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 py-6">
            {/* --- CABECERA --- */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        Gestión de <span className="text-[#7a0202]">Reembolsos</span>
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Panel de aprobación y auditoría financiera
                    </p>
                </div>
                <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <BanknotesIcon className="h-6 w-6 text-gray-400" />
                </div>
            </div>

            {/* --- CONTENEDOR PRINCIPAL --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 animate-pulse">
                        <div className="h-12 w-12 bg-gray-100 rounded-full mb-4"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Sincronizando transacciones...</span>
                    </div>
                ) : refunds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <div className="bg-gray-50 p-8 rounded-full mb-4">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Sin solicitudes activas</h3>
                        <p className="text-sm text-gray-400 mt-2 max-w-xs">No hay reembolsos pendientes de procesar en este momento.</p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50 border-b border-gray-100">
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Referencia</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Reserva / Usuario</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Monto Solicitado</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Motivo y Notas</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">Estado</th>
                                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {refunds.map((r) => {
                                        return (
                                            <tr key={r.id} className="group hover:bg-gray-50/50 transition-colors">
                                                {/* ID / Ticket */}
                                                <td className="px-6 py-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200">
                                                            <span className="font-mono text-xs font-black text-gray-500">#{r.id}</span>
                                                        </div>
                                                        <span className="text-[10px] font-black text-gray-300 uppercase tracking-tighter">
                                                            {r.created_at ? format(new Date(r.created_at), 'dd/MM/yy') : '--'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Reserva / Solicitante */}
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <div className="px-2 py-0.5 bg-gray-900 text-white rounded font-mono text-[10px] font-black tracking-tighter">
                                                                {r.reserva?.localizador ?? r.reserva_id}
                                                            </div>
                                                        </div>
                                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-tight leading-none">
                                                            {r.user?.name ?? 'Cliente Externo'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Montos */}
                                                <td className="px-6 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-base font-black text-[#7a0202]">
                                                            {r.requested_amount_cents ? `€${(r.requested_amount_cents/100).toFixed(2)}` : '€0.00'}
                                                        </span>
                                                        {r.processed_refund && (
                                                            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tighter">
                                                                Procesado: €{(r.processed_refund.amount_cents/100).toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Motivo */}
                                                <td className="px-6 py-6">
                                                    <div className="max-w-[200px]">
                                                        <span className="block text-[10px] font-black text-gray-400 uppercase leading-none mb-1">
                                                            {r.reason_code?.replace('_', ' ')}
                                                        </span>
                                                        <p className="text-xs text-gray-500 italic truncate" title={r.notes}>
                                                            {r.notes || 'Sin observaciones adicionales.'}
                                                        </p>
                                                    </div>
                                                </td>

                                                {/* Estado */}
                                                <td className="px-6 py-6 text-center">
                                                    <Badge
                                                        label={
                                                            r.status === 'pending' ? 'Pendiente' :
                                                            r.status === 'approved' ? 'Aprobado' :
                                                            r.status === 'processed' ? 'Procesado' :
                                                            r.status === 'rejected' ? 'Rechazado' :
                                                            'Desconocido'
                                                        }
                                                        tipo={r.status || 'pendiente'}
                                                    />
                                                </td>

                                                {/* Acciones */}
                                                <td className="px-6 py-6 text-right">
                                                    {r.status === 'pending' ? (
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() => onApprove && onApprove(r.id)}
                                                                className="p-2.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition shadow-sm"
                                                                title="Aprobar Reembolso"
                                                            >
                                                                <CheckIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onReject && onReject(r.id)}
                                                                className="p-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition shadow-sm"
                                                                title="Rechazar"
                                                            >
                                                                <XMarkIcon className="h-4 w-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => onDelete && onDelete(r.id)}
                                                                className="p-2.5 bg-gray-50 text-gray-400 hover:text-black rounded-xl transition shadow-sm"
                                                                title="Eliminar registro"
                                                            >
                                                                <TrashIcon className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] font-black text-gray-300 uppercase italic">Archivado</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* --- PAGINACIÓN INDUSTRIAL --- */}
                        {pagination && (
                            <div className="px-8 py-6 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-6">
                                <div className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400">
                                    Mostrando <span className="text-gray-900">{(pagination.per_page * (pagination.current_page - 1)) + 1}</span> — <span className="text-gray-900">{Math.min(pagination.per_page * pagination.current_page, pagination.total)}</span> <span className="mx-2 text-gray-200">|</span> Total <span className="text-gray-900">{pagination.total}</span> Solicitudes
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        disabled={!pagination.prev_page_url}
                                        onClick={() => onPageChange && onPageChange(pagination.current_page - 1)}
                                        className="p-2 bg-white border border-gray-200 rounded-xl hover:text-[#7a0202] disabled:opacity-30 transition shadow-sm"
                                    >
                                        <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
                                    </button>

                                    <div className="flex gap-1.5">
                                        {Array.from({ length: pagination.last_page }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                onClick={() => onPageChange && onPageChange(page)}
                                                className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                                                    pagination.current_page === page
                                                    ? 'bg-[#7a0202] text-white shadow-lg shadow-red-100 scale-110'
                                                    : 'bg-white border border-gray-200 text-gray-400 hover:bg-gray-50'
                                                }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                    </div>

                                    <button
                                        disabled={!pagination.next_page_url}
                                        onClick={() => onPageChange && onPageChange(pagination.current_page + 1)}
                                        className="p-2 bg-white border border-gray-200 rounded-xl hover:text-[#7a0202] disabled:opacity-30 transition shadow-sm"
                                    >
                                        <ChevronRightIcon className="h-5 w-5 text-gray-600" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
