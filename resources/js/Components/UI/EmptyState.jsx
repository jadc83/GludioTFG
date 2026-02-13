import React from 'react';

export default function EmptyState({ Icon = null, title = 'No hay resultados', subtitle = '', cta = null }) {
    return (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="mb-4 rounded-full bg-gray-50 p-6">
                {Icon ? <Icon className="h-12 w-12 text-gray-300" /> : null}
            </div>
            <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">{title}</h3>
            {subtitle ? <p className="mt-1 max-w-xs text-sm text-gray-400">{subtitle}</p> : null}
            {cta ? (
                <div className="mt-6">
                    <button onClick={cta.onClick} className="text-xs font-black uppercase tracking-widest text-[#7a0202] hover:underline">
                        {cta.label}
                    </button>
                </div>
            ) : null}
        </div>
    );
}
