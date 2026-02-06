import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';

export default function ShowEmpleado({ empleado, abierto, onCerrar }) {
    return (
        <div className={`fixed inset-0 z-[9999] transition-all duration-300 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
            <div className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`} onClick={onCerrar} />

            <div className={`absolute bottom-0 right-0 top-0 flex w-full max-w-3xl transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}>
                <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">{empleado?.name || 'Empleado'}</h3>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Detalle de Empleado</p>
                    </div>
                    <button onClick={onCerrar} className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"><XMarkIcon className="h-6 w-6"/></button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    <div className="p-6 text-center text-lg font-bold">Hola</div>
                </div>
            </div>
        </div>
    );
}
