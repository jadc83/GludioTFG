import { formatearMoneda } from '@/utils/formatters';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';

export default function AsignacionHabitaciones({
    reservaSlots = [],
    habitacionesDisponibles = [],
    habitacionesSeleccionadas = [],
    setHabitacionesSeleccionadas,
    onDesasignar,
    onGuardar,
    guardando = false,
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">Asignación de habitaciones</h3>
                    <p className="mt-1 text-[10px] text-gray-400">Selecciona habitaciones disponibles para asignar. Usa el botón ✕ para desasignar.</p>
                </div>
                <button
                    onClick={onGuardar}
                    disabled={guardando}
                    className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-black disabled:opacity-50"
                >
                    {guardando ? 'Guardando...' : 'Guardar Cambios'}
                </button>
            </div>

            <div className="space-y-10 p-6">
                {reservaSlots.map((hSlot, idx) => (
                    <div key={hSlot.slot_id || `slot-${idx}`} className="space-y-4">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-[#7a0202] px-3 py-1 text-xs font-black text-white">#{idx + 1}</span>
                                    <span className="text-sm font-bold uppercase text-gray-900">{hSlot.tipo || 'Sin tipo'}</span>
                                    {hSlot.habitacion_id && (
                                        <span className="text-xs text-gray-500">(Habitación {hSlot.numero || hSlot.habitacion_id})</span>
                                    )}
                                </div>
                                {hSlot.precio && (
                                    (() => {
                                        // Mostrar precio por noche correctamente: preferir precio_noche si viene del backend,
                                        // si no, calcular a partir del total `hSlot.precio` y las fechas del slot o de la reserva
                                        const parseDate = (s) => (s ? new Date(s) : null);
                                        const slotCheckIn = parseDate(hSlot.check_in);
                                        const slotCheckOut = parseDate(hSlot.check_out);
                                        const noches = slotCheckIn && slotCheckOut ? Math.max(0, Math.ceil((slotCheckOut - slotCheckIn) / (1000 * 60 * 60 * 24))) : null;
                                        const precioNoche = hSlot.precio_noche != null ? Number(hSlot.precio_noche) : (noches && noches > 0 ? Number(hSlot.precio) / noches : Number(hSlot.precio));

                                        return (
                                            <span className="text-xs text-gray-500">{formatearMoneda(precioNoche)} / noche</span>
                                        );
                                    })()
                                )}
                            </div>

                            {hSlot.habitacion_id && (
                                <button onClick={() => onDesasignar(hSlot.habitacion_id)} className="rounded-lg border border-red-200 bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100">Desasignar</button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                            <button
                                onClick={() => {
                                    const copy = [...habitacionesSeleccionadas];
                                    copy[idx] = null;
                                    setHabitacionesSeleccionadas(copy);
                                }}
                                className={`rounded-xl border-2 p-3 text-center transition ${!habitacionesSeleccionadas[idx] ? 'border-[#7a0202] bg-red-50 text-[#7a0202]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                            >
                                <span className="block text-[10px] font-black uppercase">Vacío</span>
                            </button>

                            {(() => {
                                const filtered = habitacionesDisponibles.filter((habFisica) => !hSlot.tipo || (habFisica.tipo && habFisica.tipo.toLowerCase() === hSlot.tipo.toLowerCase()));

                                try {
                                    // eslint-disable-next-line no-console
                                    console.debug('[AsignacionHabitaciones] slot', idx, { slotTipo: hSlot.tipo, availableCount: habitacionesDisponibles.length, filteredCount: filtered.length, availableTipos: (habitacionesDisponibles || []).map(h=>h.tipo) });
                                } catch (e) {}

                                if (filtered.length === 0) {
                                    return (
                                        <div className="col-span-full">
                                            <div className="rounded-xl border-2 p-3 text-center text-sm text-gray-500">No hay habitaciones disponibles de este tipo</div>
                                        </div>
                                    );
                                }

                                return filtered.map((habFisica) => {
                                    const isSelected = habitacionesSeleccionadas[idx] === habFisica.id;
                                    const isUsedElsewhere = habitacionesSeleccionadas.some((id, i) => id === habFisica.id && i !== idx);

                                    return (
                                        <button
                                            key={habFisica.id}
                                            disabled={isUsedElsewhere}
                                            onClick={() => {
                                                const copy = [...habitacionesSeleccionadas];
                                                copy[idx] = habFisica.id;
                                                setHabitacionesSeleccionadas(copy);
                                            }}
                                            className={`relative rounded-xl border-2 p-3 transition ${isSelected ? 'border-[#7a0202] bg-red-50 text-[#7a0202]' : isUsedElsewhere ? 'cursor-not-allowed opacity-20 grayscale' : 'border-gray-100 hover:border-gray-300'}`}
                                        >
                                            <span className="block text-lg font-black leading-none">{habFisica.numero}</span>
                                            <span className="text-[8px] font-bold uppercase opacity-60">{habFisica.tipo}</span>
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
