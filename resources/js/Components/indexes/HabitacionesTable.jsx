import React from 'react';
import HabitacionRow from '@/Components/indexes/HabitacionRow';

export default function HabitacionesTable({ habitaciones = [], abrirEdicion }) {
    return (
        <div className="overflow-x-auto">
            <table className="responsive-table w-full border-collapse text-left">
                <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Identificador</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Tipo</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Capacidad</th>
                        <th className="px-6 py-5 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado Actual</th>
                        <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Descripción / Notas</th>
                        <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Gestión</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {habitaciones.map((hab) => (
                        <HabitacionRow key={hab.id} hab={hab} abrirEdicion={abrirEdicion} />
                    ))}
                </tbody>
            </table>
        </div>
    );
}
