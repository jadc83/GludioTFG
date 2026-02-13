import React from 'react';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import dayjs from 'dayjs';

export default function DetailedTable({ porDia = [], tipos = ['doble','familiar','suite'] }) {
    const [mostrarDetallesTabla, setMostrarDetallesTabla] = React.useState(false);

    const coloresTipos = [
        { main: '#7a0202' },
        { main: '#02357a' },
        { main: '#027a2f' },
    ];

    return (
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
            <button onClick={() => setMostrarDetallesTabla(!mostrarDetallesTabla)} className="flex w-full items-center justify-between bg-gray-50/50 px-8 py-5 transition-colors hover:bg-gray-50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-900">Registro Detallado por Fecha</span>
                {mostrarDetallesTabla ? (
                    <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                ) : (
                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                )}
            </button>

            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${mostrarDetallesTabla ? 'max-h-[5000px]' : 'max-h-0'}`}>
                <div className="overflow-x-auto p-4 md:p-8">
                    <table className="responsive-table w-full border-collapse text-left">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="px-4 pb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Día</th>
                                {tipos.map((t, i) => (
                                    <th key={t} className="px-4 pb-4 text-center text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: coloresTipos[i].main }}>{t}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {porDia.map((d) => (
                                <tr key={d.fecha} className="group transition-colors hover:bg-gray-50/50">
                                    <td className="px-4 py-4 font-mono text-xs font-bold text-gray-500 transition-colors group-hover:text-gray-900" data-label="Día">{dayjs(d.fecha).format('DD MMM')}</td>
                                    {tipos.map((t, i) => {
                                        const pct = d.por_tipo?.[t]?.porcentaje ?? 0;
                                        return (
                                            <td key={t} className="px-4 py-4 text-center" data-label={t}>
                                                <div className="flex flex-col items-center">
                                                    <div className="mb-1 text-xs font-black text-gray-900">{pct}%</div>
                                                    <div className="h-1 w-16 overflow-hidden rounded-full bg-gray-100">
                                                        <div className="h-full" style={{ width: `${pct}%`, backgroundColor: coloresTipos[i].main }} />
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
