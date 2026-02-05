import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReservaSummary from '@/Components/reservas/usuario/ReservaSummary';

describe('ReservaSummary', () => {
    it('renders guest, dates and total', () => {
        const reserva = { cliente: { nombre: 'Juan' }, check_in: '2026-02-10', check_out: '2026-02-12', precio_total: 150 };
        const { getByText } = render(<ReservaSummary reserva={reserva} />);
        expect(getByText(/Juan/)).toBeTruthy();
        expect(getByText(/10/)).toBeTruthy();
        expect(getByText(/150.00€/)).toBeTruthy();
    });
});
