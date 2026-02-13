import React from 'react';

export default function IntroResumen({ empleado, showSummary }) {
    if (!showSummary) return null;

    return (
        <div className="mb-6">
            <h2 className="text-lg font-extrabold">Panel de control</h2>
            <p className="mt-1 text-sm text-gray-500">Resumen rápido: información personal, próximos turnos y últimas tareas completadas.</p>

            {/* Información de departamento mostrada en la ficha principal; eliminada aquí para evitar duplicados */}
        </div>
    );
}
