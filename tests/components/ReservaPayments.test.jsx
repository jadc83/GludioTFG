import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReservaPayments from '@/Components/reservas/utilidades/ReservaPayments';

describe('ReservaPayments', () => {
    it('renders amounts and buttons', () => {
        const reserva = { precio_total: 200, pago: 'pagado', reembolsos_total: 20, status: 'confirmed', localizador: 'ABC' };
        const { getByText } = render(
            <ReservaPayments reserva={reserva} estaCancelada={false} onSolicitarReembolso={() => {}} />,
        );

        expect(getByText(/Total a cobrar/i)).toBeTruthy();
        expect(getByText('200.00€')).toBeTruthy();
        // Expect one of the action buttons to be present
        expect(getByText('Solicitar Reembolso')).toBeTruthy();
    });
});
