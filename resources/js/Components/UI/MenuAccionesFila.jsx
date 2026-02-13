import React from 'react';

export default function MenuAccionesFila({ opciones = [] }) {
    return (
        <div className="relative inline-block text-left">
            <div className="flex items-center gap-1">
                {opciones.map((o, i) => (
                    <button key={i} onClick={o.onClick} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">{o.label}</button>
                ))}
            </div>
        </div>
    );
}
