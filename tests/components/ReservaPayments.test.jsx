import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReservaPayments from '@/Components/reservas/utilidades/ReservaPayments';

describe('ReservaPayments', () => {
    it('renders status and payment badge', () => {
        const reserva = { precio_total: 200, pago: 'pagado', reembolsos_total: 20, status: 'confirmed', localizador: 'ABC' };
        const { getByText } = render(
            <ReservaPayments reserva={reserva} />,
        );

        // Component now renders status and pago badge
        expect(getByText(/Estado/i)).toBeTruthy();
        expect(getByText(/confirmed/i)).toBeTruthy();
        expect(getByText(/pagado/i)).toBeTruthy();
    });
});
