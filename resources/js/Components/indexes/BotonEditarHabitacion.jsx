import React from 'react';
import { PencilIcon } from '@heroicons/react/24/outline';

export default function BotonEditarHabitacion({ habitacion, onClick }) {
    return (
        <button onClick={() => onClick?.(habitacion)} className="inline-flex items-center justify-center rounded-xl bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202] group-hover:scale-110">
            <PencilIcon className="h-5 w-5" />
        </button>
    );
}
