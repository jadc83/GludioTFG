import React from 'react';
import { getEstadoConfig } from '@/helpers/habitacionEstado';

export default function EstadoBadge({ estado }) {
    const cfg = getEstadoConfig(estado);
    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${cfg.clase}`}>
            <span className="mr-2 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
            {cfg.label}
        </span>
    );
}
