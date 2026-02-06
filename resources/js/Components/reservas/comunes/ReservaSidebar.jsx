import { formatearMoneda } from '@/utils/formatters';

import React from 'react';
import ReservaPayments from '@/Components/reservas/utilidades/ReservaPayments';

export default function ReservaSidebar({ reserva, estaCancelada, onSolicitarReembolso }) {
    return (
        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
            <ReservaPayments reserva={reserva} estaCancelada={estaCancelada} onSolicitarReembolso={onSolicitarReembolso} />
        </aside>
    );
}
