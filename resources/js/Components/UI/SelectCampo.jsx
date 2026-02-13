import React from 'react';

export default function SelectCampo({ nombre, valor, opciones = [], onChange }) {
    return (
        <select name={nombre} value={valor} onChange={(e) => onChange(e.target.value)} className="w-full rounded-md border px-3 py-2">
            {opciones.map((o) => (
                <option key={o.valor} value={o.valor}>{o.etiqueta}</option>
            ))}
        </select>
    );
}
