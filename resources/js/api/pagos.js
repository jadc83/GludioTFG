import axios from 'axios';

export async function crearCheckoutSession(reservaId, payload) {
    try {
        const res = await axios.post('/pagos/crear-checkout-session', { reserva_id: reservaId, ...payload });
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, error: err.message };
    }
}

export async function crearCheckoutSessionRaw(reservaId, payload) {
    // Deprecated: mantener wrapper para compatibilidad
    return crearCheckoutSession(reservaId, payload);
}

export async function checkSession(sessionId) {
    try {
        const res = await axios.get('/pagos/check-session', { params: { session_id: sessionId } });
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, error: err.message };
    }
}

export async function confirmar(paymentIntentId, pagoId = null) {
    try {
        const res = await axios.post('/pagos/confirmar', {
            payment_intent_id: paymentIntentId,
            pago_id: pagoId,
        });
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, error: err.message };
    }
}

export async function crearPaymentIntent(reservaId, monto) {
    try {
        const res = await axios.post('/pagos/crear-payment-intent', { reserva_id: reservaId, monto }, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, error: err.message };
    }
}

export async function crearPaymentIntentStandalone(monto, opts = {}) {
    try {
        const res = await axios.post('/pagos/crear-payment-intent-standalone', { monto, ...opts }, {
            headers: { 'Content-Type': 'application/json' },
        });
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, error: err?.message };
    }
}
