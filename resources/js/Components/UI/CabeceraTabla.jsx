import React from 'react';

export default function CabeceraTabla({ columnas = [] }) {
    return (
        <thead>
            <tr className="border-b border-gray-100 bg-gray-50/50">
                {columnas.map((col, idx) => (
                    <th key={idx} className={`px-6 py-4 ${col.align === 'right' ? 'text-right' : ''} text-[10px] font-black uppercase tracking-[0.2em] text-gray-400`}>
                        {col.label}
                    </th>
                ))}
            </tr>
        </thead>
    );
}
