import { useCallback } from 'react';
import * as pagosService from '@/services/pagosService';

export default function usePayments() {
    const checkSession = useCallback(async (sessionId) => {
        return pagosService.checkSession(sessionId);
    }, []);

    const confirmarPaymentIntent = useCallback(async (paymentIntentId, pagoId = null) => {
        try {
            const res = await pagosService.confirmar(paymentIntentId, pagoId);
            return res;
        } catch (e) {
            return { success: false, error: e?.message || String(e) };
        }
    }, []);

    const createPaymentIntent = useCallback(async (reservaId, monto) => {
        try {
            const res = await pagosService.crearPaymentIntent(reservaId, monto);
            return res;
        } catch (e) {
            return { success: false, error: e?.message || String(e) };
        }
    }, []);

    return {
        checkSession,
        confirmarPaymentIntent,
        createPaymentIntent,
    };
}
