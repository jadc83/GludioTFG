import React from 'react';

export default function TareasCompletadas({ completadas = [], cargando = false, formatearFecha }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="mb-3">
                <div className="text-sm font-bold text-gray-700">Últimas tareas completadas</div>
            </div>
            {cargando ? (
                <div className="p-4 text-sm text-gray-500">Cargando...</div>
            ) : completadas.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">Aún no has completado tareas.</div>
            ) : (
                <div className="space-y-2">
                    {completadas.map((c) => (
                        <div key={c.id} className="rounded border border-gray-100 bg-gray-50 p-3">
                            <div className="text-sm font-semibold">{c.descripcion}</div>
                            <div className="text-xs text-gray-500">
                                {c.habitacion ? `Hab. ${c.habitacion.numero}` : ''} — {formatearFecha(c.completed_at)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
