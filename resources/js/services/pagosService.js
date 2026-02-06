import * as api from '@/api/pagos';

export async function crearCheckoutSession(reservaId, payload) {
    return api.crearCheckoutSession(reservaId, payload);
}

export async function checkSession(sessionId) {
    return api.checkSession(sessionId);
}

export async function confirmar(paymentIntentId, pagoId = null) {
    return api.confirmar(paymentIntentId, pagoId);
}

export async function crearPaymentIntent(reservaId, monto) {
    return api.crearPaymentIntent(reservaId, monto);
}
