import GestionTiposHabitacion from '@/Components/Admin/GestionTiposHabitacion';
import { CogIcon } from '@heroicons/react/24/outline';
import { useState, Suspense } from 'react';
import TabCupones from '@/Components/cupones/TabCupones';

export default function TabConfiguracion({ cupones = {} }) {
    const [tab, setTab] = useState('tipos');

    return (
        <div className="p-3 md:p-6">
            {/* --- CABECERA --- */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">Configuración y <span className="text-[#7a0202]">Gestión</span></h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Tipos de habitación, cupones y configuración</p>
                </div>
                <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <CogIcon className="h-6 w-6 text-gray-400" />
                </div>
            </div>

            {/* --- TABS INTERNOS --- */}
            <div className="mb-6 flex gap-2">
                <button
                    onClick={() => setTab('tipos')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                        tab === 'tipos'
                            ? 'bg-[#7a0202] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Precios
                </button>
                <button
                    onClick={() => setTab('cupones')}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                        tab === 'cupones'
                            ? 'bg-[#7a0202] text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                >
                    Cupones
                </button>
            </div>

            {/* --- CONTENIDO --- */}
            {tab === 'tipos' && <GestionTiposHabitacion />}
            {tab === 'cupones' && <TabCupones cupones={cupones} mostrarCabecera={false} />}
        </div>
    );
}
