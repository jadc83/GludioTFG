import React from 'react';

export default function IntroResumen({ empleado, showSummary }) {
    if (!showSummary) return null;

    return (
        <div className="mb-6">
            <h2 className="text-lg font-extrabold">Panel de control</h2>
            <p className="mt-1 text-sm text-gray-500">Resumen rápido: información personal, próximos turnos y últimas tareas completadas.</p>

            {empleado?.departamento ? (
                <div className="mt-3 rounded-md bg-white/5 p-3 text-sm text-gray-700">
                    <strong className="uppercase text-xs text-gray-500">Departamento:</strong>
                    <span className="ml-2 font-semibold text-gray-900">{empleado.departamento}</span>
                </div>
            ) : null}
        </div>
    );
}
