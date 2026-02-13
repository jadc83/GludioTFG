import React from 'react';

export default function PlaceholderCarga({ texto = 'Cargando...' }) {
    return (
        <div className="p-6 text-center text-sm text-gray-500">{texto}</div>
    );
}
