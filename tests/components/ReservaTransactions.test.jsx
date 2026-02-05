import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ReservaTransactions from '@/Components/reservas/usuario/ReservaTransactions';

describe('ReservaTransactions', () => {
    it('renders pagos and reembolsos', () => {
        const pagos = [{ id: 1, monto: 100, estado: 'pagado' }, { id: 2, monto: 50, estado: 'procesando' }];
        const reembolsos = [{ id: 1, monto: 20, reason_code: 'billing_error' }];
        const { getByText } = render(<ReservaTransactions pagos={pagos} reembolsos={reembolsos} />);

        expect(getByText(/Pagos/i)).toBeTruthy();
        // check amounts are rendered
        expect(getByText('100.00€')).toBeTruthy();
        expect(getByText('-20.00€')).toBeTruthy();
        expect(getByText(/Reembolsos/i)).toBeTruthy();
        // ensure estado text exists
        expect(getByText(/pagado/i)).toBeTruthy();
    });
});
