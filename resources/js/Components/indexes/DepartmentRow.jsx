import React from 'react';
import ActionsCell from '@/Components/UI/ActionsCell';

export default function DepartmentRow({ departamento, onView }) {
    return (
        <tr key={departamento.id} className="group transition-colors hover:bg-gray-50/50">
            <td className="px-6 py-4" data-label="Nombre">
                <div className="text-sm font-black uppercase tracking-tight text-gray-900">{departamento.name}</div>
            </td>
            <td className="px-6 py-4 text-right" data-label="Acciones">
                <ActionsCell onView={() => onView(departamento)} />
            </td>
        </tr>
    );
}
