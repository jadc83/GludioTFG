import React from 'react';

export default function BotonIcono({ onClick = () => {}, children, title = '' }) {
    return (
        <button onClick={onClick} title={title} className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
            {children}
        </button>
    );
}
