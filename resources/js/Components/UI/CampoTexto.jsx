import React from 'react';

export default function CampoTexto({ nombre, valor, onChange, placeholder = '', type = 'text' }) {
    return (
        <input name={nombre} value={valor} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} className="w-full rounded-md border px-3 py-2" />
    );
}
