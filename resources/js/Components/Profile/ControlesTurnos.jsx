import React from 'react';

export default function ControlesTurnos({ titleRange, isFullscreen, onLimpiar, onToggleFullscreen }) {
    return (
        <div className="mb-3 flex items-center justify-between">
            <div>
                <h6 className="text-sm font-semibold text-gray-700">Calendario de Turnos</h6>
                {titleRange ? <div className="text-xs text-gray-500">{titleRange}</div> : null}
            </div>
            <div className="flex items-center gap-2">
                <button
                    className="rounded-md bg-rose-500 px-3 py-1 text-xs font-black text-white"
                    onClick={onLimpiar}
                >
                    Limpiar turnos
                </button>

                <button
                    className="rounded-md border border-gray-200 px-3 py-1 text-xs font-black text-gray-700"
                    onClick={onToggleFullscreen}
                    aria-pressed={isFullscreen}
                    title={isFullscreen ? 'Salir de pantalla completa' : 'Ver en pantalla completa'}
                >
                    {isFullscreen ? 'Salir' : 'Ampliar'}
                </button>
            </div>
        </div>
    );
}
