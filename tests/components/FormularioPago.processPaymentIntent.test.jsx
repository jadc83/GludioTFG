import { vi, describe, it, expect } from 'vitest';

import { processPaymentIntentResult } from '@/utils/pagos/processPaymentIntentResult';

describe('processPaymentIntentResult', () => {
    it('calls confirmarPaymentIntent and onPagoExitoso when status is succeeded', async () => {
        const confirmar = vi.fn(async (piId, pagoId) => ({ success: true, confirmed: true }));
        const onPagoExitoso = vi.fn();
        const dataPI = { paymentIntentStatus: 'succeeded', paymentIntentId: 'pi_123', pago_id: 55 };

        const res = await processPaymentIntentResult({ dataPI, confirmarPaymentIntent: confirmar, onPagoExitoso });

        expect(res).toBe(true);
        expect(confirmar).toHaveBeenCalledWith('pi_123', 55);
        expect(onPagoExitoso).toHaveBeenCalledWith({ pago_id: 55, confirmData: { success: true, confirmed: true } });
    });

    it('returns false and does nothing when status is not succeeded', async () => {
        const confirmar = vi.fn();
        const onPagoExitoso = vi.fn();
        const dataPI = { paymentIntentStatus: 'requires_payment_method', paymentIntentId: 'pi_404', pago_id: null };

        const res = await processPaymentIntentResult({ dataPI, confirmarPaymentIntent: confirmar, onPagoExitoso });

        expect(res).toBe(false);
        expect(confirmar).not.toHaveBeenCalled();
        expect(onPagoExitoso).not.toHaveBeenCalled();
    });
});
