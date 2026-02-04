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
