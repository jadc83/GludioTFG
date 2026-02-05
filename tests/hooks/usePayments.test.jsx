import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

// Mock the pagos service
vi.mock('@/services/pagosService', () => ({
    checkSession: vi.fn(async (id) => ({ success: true, session: { id } })),
    confirmar: vi.fn(async (pi, pagoId) => ({ success: true, payment_intent: pi, pago_id: pagoId })),
    crearPaymentIntent: vi.fn(async (reservaId, monto) => ({ success: true, paymentIntentId: 'pi_test', paymentIntentStatus: 'requires_payment_method', pago_id: null })),
}));

import usePayments from '@/hooks/pagos/usePayments';
import * as pagosApi from '@/services/pagosService';

describe('usePayments', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('exposes checkSession that calls the API', async () => {
        const { result } = renderHook(() => usePayments());
        const res = await result.current.checkSession('sess_123');
        expect(pagosApi.checkSession).toHaveBeenCalledWith('sess_123');
        expect(res).toEqual({ success: true, session: { id: 'sess_123' } });
    });

    it('exposes confirmarPaymentIntent that calls the API and returns result', async () => {
        const { result } = renderHook(() => usePayments());
        const res = await result.current.confirmarPaymentIntent('pi_abc', 55);
        expect(pagosApi.confirmar).toHaveBeenCalledWith('pi_abc', 55);
        expect(res).toEqual({ success: true, payment_intent: 'pi_abc', pago_id: 55 });
    });

    it('confirmarPaymentIntent handles API errors gracefully', async () => {
        pagosApi.confirmar.mockImplementationOnce(() => { throw new Error('boom') });
        const { result } = renderHook(() => usePayments());
        const res = await result.current.confirmarPaymentIntent('pi_err');
        expect(res).toHaveProperty('success', false);
        expect(res).toHaveProperty('error');
    });

    it('exposes createPaymentIntent that calls the API and returns result', async () => {
        const { result } = renderHook(() => usePayments());
        const res = await result.current.createPaymentIntent(10, 123.45);
        expect(pagosApi.crearPaymentIntent).toHaveBeenCalledWith(10, 123.45);
        expect(res).toEqual({ success: true, paymentIntentId: 'pi_test', paymentIntentStatus: 'requires_payment_method', pago_id: null });
    });
});
