import * as api from '@/api/pagos';

/**
 * Servicio cliente para llamadas relacionadas con pagos.
 *
 * Todas las funciones devuelven la respuesta del `api` si tuvo éxito,
 * o un objeto `{ success: false, error: string }` en caso de error.
 * Esto unifica el manejo de errores en la capa superior.
 */

async function crearCheckoutSession(reservaId, payload) {
    try {
        const res = await api.crearCheckoutSession(reservaId, payload);
        return (
            res ?? {
                success: false,
                error: 'Empty response from crearCheckoutSession',
            }
        );
    } catch (err) {
        return {
            success: false,
            error: err?.response?.data?.error || err?.message || String(err),
        };
    }
}

async function checkSession(sessionId) {
    try {
        const res = await api.checkSession(sessionId);
        return (
            res ?? { success: false, error: 'Empty response from checkSession' }
        );
    } catch (err) {
        return {
            success: false,
            error: err?.response?.data?.error || err?.message || String(err),
        };
    }
}

async function confirmar(paymentIntentId, pagoId = null) {
    try {
        const res = await api.confirmar(paymentIntentId, pagoId);
        return (
            res ?? { success: false, error: 'Empty response from confirmar' }
        );
    } catch (err) {
        return {
            success: false,
            error: err?.response?.data?.error || err?.message || String(err),
        };
    }
}

async function crearPaymentIntent(reservaId, monto) {
    try {
        const res = await api.crearPaymentIntent(reservaId, monto);
        return (
            res ?? {
                success: false,
                error: 'Empty response from crearPaymentIntent',
            }
        );
    } catch (err) {
        return {
            success: false,
            error: err?.response?.data?.error || err?.message || String(err),
        };
    }
}

async function crearPaymentIntentStandalone(monto, opts = {}) {
    try {
        const res = await api.crearPaymentIntentStandalone(monto, opts);
        return (
            res ?? {
                success: false,
                error: 'Empty response from crearPaymentIntentStandalone',
            }
        );
    } catch (err) {
        return {
            success: false,
            error: err?.response?.data?.error || err?.message || String(err),
        };
    }
}

export default {
    crearCheckoutSession,
    checkSession,
    confirmar,
    crearPaymentIntent,
    crearPaymentIntentStandalone,
};

// Mantener exports nombrados para compatibilidad retroactiva
export {
    checkSession,
    confirmar,
    crearCheckoutSession,
    crearPaymentIntent,
    crearPaymentIntentStandalone,
};
