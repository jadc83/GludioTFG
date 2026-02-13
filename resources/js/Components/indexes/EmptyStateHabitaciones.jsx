import React from 'react';
import { InboxIcon } from '@heroicons/react/24/outline';

export default function EmptyStateHabitaciones({ count = 0, onLimpiar }) {
    return (
        <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-8">
                <InboxIcon className="h-12 w-12 text-gray-300" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                {count === 0 ? 'Inventario Vacío' : 'Sin resultados'}
            </h3>
            <p className="mt-2 max-w-xs text-sm text-gray-400">
                {count === 0
                    ? 'No hay habitaciones registradas en el sistema.'
                    : 'No hay habitaciones que coincidan con los filtros aplicados.'}
            </p>
            {count > 0 && (
                <button onClick={onLimpiar} className="mt-6 text-xs font-black uppercase tracking-widest text-[#7a0202] hover:underline">
                    Limpiar filtros
                </button>
            )}
        </div>
    );
}
