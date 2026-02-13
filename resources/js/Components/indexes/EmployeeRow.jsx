import React from 'react';
import ActionsCell from '@/Components/UI/ActionsCell';

export default function EmployeeRow({ empleado = {}, onView = () => {}, onEdit = () => {} }) {
    const roleVal = empleado.role || (Array.isArray(empleado.roles) ? empleado.roles[0] : null);

    return (
        <tr key={empleado.id} className="group transition-colors hover:bg-gray-50/50">
            <td className="px-6 py-4" data-label="Empleado">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-black uppercase text-gray-400">
                        {empleado.name?.charAt(0)}
                    </div>
                    <div>
                        <div className="text-sm font-black uppercase tracking-tight text-gray-900">{empleado.name}</div>
                        <div className="font-mono text-xs text-gray-400">{empleado.email}</div>
                    </div>
                </div>
            </td>

            <td className="px-6 py-4 text-sm font-bold uppercase tracking-tight text-gray-700" data-label="Departamento">
                {empleado.departamento || '—'}
            </td>

            <td className="px-6 py-4 text-sm font-medium uppercase tracking-tight text-gray-700" data-label="Rol">
                {roleVal ? String(roleVal).toUpperCase() : '—'}
            </td>

            <td className="px-6 py-4 text-right" data-label="Acciones">
                <ActionsCell onView={() => onView(empleado)} onEdit={() => onEdit(empleado)} />
            </td>
        </tr>
    );
}
