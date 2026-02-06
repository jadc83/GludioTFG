import React from 'react';

export default function EmpleadoProfile({ habitaciones = [] }) {
    // Mostrar únicamente la grid de tareas/habitaciones
    if (!Array.isArray(habitaciones)) return null;

    return (
        <div className="mt-8 rounded-xl border border-gray-100 p-6 bg-white">
            <h4 className="font-black uppercase text-sm text-gray-700">Tareas</h4>

            <div className="mt-3">
                <h5 className="font-black uppercase text-xs text-gray-700 mb-3">Habitaciones en Limpieza</h5>

                {!Array.isArray(habitaciones) ? (
                    <div className="p-6 text-sm text-gray-500">Cargando habitaciones...</div>
                ) : habitaciones.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">No hay habitaciones en limpieza.</div>
                ) : (
                    <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                        {habitaciones.map((h) => (
                            <div key={h.id} className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                                <div className="font-black uppercase text-sm">{h.numero || h.tipo}</div>
                                <div className="text-xs text-gray-500">Tipo: {h.tipo}</div>
                                <div className="text-xs text-gray-500">Capacidad: {h.capacidad}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
