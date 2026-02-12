import React from 'react';
import { usePage } from '@inertiajs/react';

export default function TurnoItem({ turno, capitalizar = (s) => s, eliminarTurno }) {
    const displayTitle = turno.title && turno.title !== 'Turno' ? turno.title : turno.actividad && turno.actividad !== 'Turno' ? turno.actividad : null;
    const start = turno.parsedStart || new Date(turno.start);
    const end = turno.parsedEnd || new Date(turno.end);
    let dateLabel = new Date(start).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' });
    dateLabel = capitalizar(dateLabel);
    const roles = usePage().props?.auth?.user?.roles || [];
    const puedeEliminar = roles.includes('encargado');

    return (
        <div className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-2">
            <div>
                {displayTitle && <div className="text-sm font-semibold">{displayTitle}</div>}
                <div className="text-xs text-gray-500">
                    <span className="font-medium text-gray-600 mr-2">{dateLabel}</span>
                    {start.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} — {end.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    {turno.meta && turno.meta.habitacion ? ` · Hab. ${turno.meta.habitacion}` : ''}
                </div>
            </div>
            <div>
                {turno.id && puedeEliminar && (
                    <button
                        onClick={async () => {
                            try {
                                await eliminarTurno(turno.id);
                            } catch (e) {
                                console.error(e);
                            }
                        }}
                        className="rounded bg-rose-500 px-3 py-1 text-xs text-white"
                    >
                        Eliminar
                    </button>
                )}
            </div>
        </div>
    );
}
