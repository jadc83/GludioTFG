import axios from 'axios';

export async function crearCheckoutSession(reservaId, payload) {
    try {
        const res = await axios.post('/pagos/crear-checkout-session', {
            reserva_id: reservaId,
            ...payload,
        });
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
        const res = await axios.get('/pagos/check-session', {
            params: { session_id: sessionId },
        });
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
        const res = await axios.post(
            '/pagos/crear-payment-intent',
            { reserva_id: reservaId, monto },
            {
                headers: { 'Content-Type': 'application/json' },
            },
        );
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, error: err.message };
    }
}

export async function crearPaymentIntentStandalone(monto, opts = {}) {
    try {
        // Normalizar payload: mover campos relevantes a `metadata` para que el backend
        // reciba `metadata.reserva_id` o `metadata.localizador` y pueda mapear el Pago.
        const payload = { monto };

        // Pasar receipt_email como campo separado (Stripe acepta receipt_email)
        if (opts.receipt_email) payload.receipt_email = opts.receipt_email;

        // Construir metadata a partir de opciones conocidas
        const metadata = {};
        if (opts.reserva_id) metadata.reserva_id = String(opts.reserva_id);
        if (opts.localizador) metadata.localizador = String(opts.localizador);
        if (opts.pago_id) metadata.pago_id = String(opts.pago_id);

        if (Object.keys(metadata).length > 0) payload.metadata = metadata;

        // Permitir forzar creación sin metadata (opción de emergencia)
        if (opts.allow_without_metadata) payload.allow_without_metadata = true;

        const res = await axios.post(
            '/pagos/crear-payment-intent-standalone',
            payload,
            {
                headers: { 'Content-Type': 'application/json' },
            },
        );
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, error: err?.message };
    }
}
