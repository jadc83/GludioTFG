import LoadingSpinner from '@/Components/UI/LoadingSpinner';

export default function AssignedHabitaciones({ habitaciones = [], onDesasignar, guardando, reserva = null, abrirReembolso = () => {}, refundAmount = null }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">Habitaciones asignadas</h3>
            </div>

            <div className="divide-y divide-gray-100">
                {habitaciones.map((hab, idx) => (
                    <div
                        key={hab.slot_id || `hab-${idx}`}
                        className="flex items-center justify-between p-6 transition hover:bg-gray-50"
                    >
                        <div>
                            <span className="block text-lg font-black uppercase leading-tight text-gray-900">
                                {hab.numero ? `Habitación ${hab.numero}` : hab.tipo || 'Habitación Estándar'}
                            </span>
                            <span className="mt-1 block text-xs uppercase tracking-widest text-gray-500">
                                {hab.numero ? hab.tipo : 'Sin asignar'}
                            </span>
                        </div>

                        {hab.numero ? (
                            <div className="flex flex-col items-end gap-2 text-right">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">✓ Asignada</span>

                                    <button
                                        onClick={() => onDesasignar(hab.habitacion_id)}
                                        disabled={guardando || (reserva && String(reserva.status || '').toLowerCase() === 'checked_out')}
                                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                                        title="Quitar asignación de habitación"
                                    >
                                        {guardando ? <LoadingSpinner /> : '✕'}
                                    </button>
                                </div>

                                {/* Action buttons moved to ReservaPayments (global) as per new flow */}
                            </div>
                        ) : (
                            <div className="text-sm italic text-gray-400">Sin asignar</div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
