import React from 'react';

export default function DetalleTurno({ selectedTurno, onClose, onDelete, formatTurnoRange }) {
    if (!selectedTurno) return null;
    return (
        <div className="mb-3 flex items-center justify-between rounded-md border border-gray-100 bg-gray-50 p-3">
            <div>
                <div className="text-sm font-semibold text-gray-800">
                    {selectedTurno.title || selectedTurno.actividad || 'Turno'}
                </div>
                <div className="text-xs text-gray-500">
                    {formatTurnoRange(selectedTurno.starts_at, selectedTurno.ends_at)}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button className="px-2 py-1 text-xs text-gray-600" onClick={onClose}>Cerrar</button>
                {selectedTurno.id && (
                    <button className="rounded bg-rose-500 px-2 py-1 text-xs text-white" onClick={onDelete}>Eliminar</button>
                )}
            </div>
        </div>
    );
}
