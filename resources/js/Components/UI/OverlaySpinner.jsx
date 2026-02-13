import React from 'react';

export default function OverlaySpinner({ label = 'Procesando...' }) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70">
            <div className="flex flex-col items-center gap-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[#7a0202]" />
                <div className="text-sm font-bold text-gray-700">{label}</div>
            </div>
        </div>
    );
}
