import { usePage } from '@inertiajs/react';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';

export default function AssignedHabitaciones({
    habitaciones = [],
    onDesasignar,
    guardando,
    reserva = null,
}) {
    const page = usePage();
    const viewerDept = (page?.props?.auth?.user?.empleado_departamento || '').toLowerCase();
    const viewerIsRecepcion = viewerDept === 'recepcion';

    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-[#7a0202] px-6 py-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white">
                    Habitaciones asignadas
                </h3>
            </div>

            <div className="divide-y divide-gray-100">
                {habitaciones.map((hab, idx) => (
                    <div
                        key={hab.slot_id || `hab-${idx}`}
                        className="hover:bg-[#7a0202]/6 flex items-center justify-between p-6 transition"
                    >
                        <div>
                            <span className="block text-lg font-black uppercase leading-tight text-gray-900">
                                {hab.numero
                                    ? `Habitación ${hab.numero}`
                                    : hab.tipo || 'Habitación Estándar'}
                            </span>
                            <span className="mt-1 block text-xs uppercase tracking-widest text-gray-500">
                                {hab.numero ? hab.tipo : 'Sin asignar'}
                            </span>
                        </div>

                        {hab.numero ? (
                            <div className="flex flex-col items-end gap-2 text-right">
                                <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center rounded-md bg-black px-3 py-1 text-xs font-bold text-white">
                                        <svg
                                            className="mr-1 h-3 w-3"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            xmlns="http://www.w3.org/2000/svg"
                                        >
                                            <path
                                                d="M5 13l4 4L19 7"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Asignada
                                    </span>

                                    {/* Mostrar el botón de desasignar sólo a personal de Recepción */}
                                    {viewerIsRecepcion && (
                                        <button
                                            onClick={() =>
                                                onDesasignar(hab.habitacion_id)
                                            }
                                            disabled={
                                                guardando ||
                                                (reserva &&
                                                    String(
                                                        reserva.status || '',
                                                    ).toLowerCase() ===
                                                        'checked_out')
                                            }
                                            className="rounded-lg border border-[#7a0202] bg-white px-3 py-1 text-xs font-bold text-[#7a0202] transition hover:bg-[#7a0202] hover:text-white disabled:opacity-50"
                                            title="Quitar asignación de habitación"
                                        >
                                            {guardando ? <LoadingSpinner /> : '✕'}
                                        </button>
                                    )}
                                </div>

                                {/* IDs internos ocultos: no mostrar habitacion_id/slot_id en la UI */}

                                {/* Action buttons moved to ReservaPayments (global) as per new flow */}
                            </div>
                        ) : (
                            <div className="text-sm italic text-gray-400">
                                Completa el check in para asignar
                                automáticamente
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}
