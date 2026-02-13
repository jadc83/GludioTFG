import React from 'react';
import TurnoItem from './TurnoItem';

export default function TurnosProximos({ proximos = [], cargando = false, capitalizar = (s) => s, eliminarTurno }) {
    if (cargando) return <div className="p-4 text-sm text-gray-500">Cargando...</div>;
    if (!proximos || proximos.length === 0) return <div className="p-4 text-sm text-gray-500">No hay turnos próximos.</div>;

    return (
        <div className="max-h-80 space-y-3 overflow-y-auto">
            {proximos.map((day) => (
                <div key={day.date.toISOString()} className="mb-2">
                    <div className="space-y-2">
                        {day.items.map((t) => (
                            <TurnoItem key={t.id || t.start + t.title} turno={t} capitalizar={capitalizar} eliminarTurno={eliminarTurno} />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
