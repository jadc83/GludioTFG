import React from 'react';

export default function Indicadores({ conteoActivas = 0 }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white p-4">
            <div className="mb-3">
                <div className="text-sm font-bold text-gray-700">Tareas activas</div>
            </div>
            <div className="text-2xl font-semibold text-gray-800">{conteoActivas}</div>
        </div>
    );
}
