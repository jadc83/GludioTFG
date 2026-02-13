import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';
import EstadoBadge from '@/Components/indexes/EstadoBadge';
import BotonEditarHabitacion from '@/Components/indexes/BotonEditarHabitacion';

export default function HabitacionRow({ hab, abrirEdicion }) {
    return (
        <tr key={hab.id} className="group transition-colors hover:bg-gray-50/50">
            <td className="px-6 py-6" data-label="Identificador">
                <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-900 text-white shadow-lg shadow-gray-200">
                        <span className="font-mono text-lg font-black">{hab.numero}</span>
                    </div>
                </div>
            </td>

            <td className="px-6 py-6" data-label="Tipo">
                <span className="block text-sm font-black uppercase tracking-tight text-gray-900">{hab.tipo}</span>
            </td>

            <td className="px-6 py-6" data-label="Capacidad">
                <div className="flex items-center gap-1.5 text-gray-400">
                    <UsersIcon className="h-3 w-3" />
                    <span className="text-xs font-bold uppercase tracking-widest">{hab.capacidad} plazas</span>
                </div>
            </td>

            <td className="px-6 py-6 text-center" data-label="Estado">
                <EstadoBadge estado={hab.estado} />
            </td>

            <td className="px-6 py-6" data-label="Descripción / Notas">
                <p className="line-clamp-2 max-w-xs text-xs italic leading-relaxed text-gray-500">{hab.descripcion || 'Sin especificaciones técnicas.'}</p>
            </td>

            <td className="px-6 py-6 text-right" data-label="Gestión">
                <BotonEditarHabitacion habitacion={hab} onClick={abrirEdicion} />
            </td>
        </tr>
    );
}
