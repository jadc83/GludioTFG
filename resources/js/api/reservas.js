import axios from 'axios';

export async function buscarReserva(localizador) {
    const res = await axios.get(`/reservas/buscar/${localizador}`);
    return res?.data?.reserva ?? null;
}

export async function modificarEstancia(localizadorOrId, payload) {
    try {
        // If payload is missing check_in/check_out, try to fetch current reserva
        if (
            (!payload || !payload.check_in || !payload.check_out) &&
            localizadorOrId
        ) {
            try {
                const getRes = await axios.get(`/reservas/${localizadorOrId}`);
                const fetched = getRes?.data ?? null;
                const reservaData =
                    (fetched?.data ?? fetched)?.reserva ??
                    fetched?.reserva ??
                    fetched;
                if (reservaData) {
                    payload = {
                        check_in: reservaData.check_in,
                        check_out: reservaData.check_out,
                        ...(payload || {}),
                    };
                }
            } catch (err) {
                // ignore - we'll let the PUT trigger validation error if needed
            }
        }

        // The backend accepts PUT /reservas/{id} where {id} may be numeric id or localizador
        const res = await axios.put(`/reservas/${localizadorOrId}`, payload, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, message: err?.message };
    }
}

export async function previewModificarEstancia() {
    // Endpoint removed server-side. Return controlled response.
    return {
        success: false,
        error: 'funcionalidad_eliminada',
        message:
            'La vista previa de modificación de estancia ha sido eliminada',
        status: 410,
    };
}

export async function solicitarReembolso(reservaId, payload) {
    const res = await axios.post(`/reservas/${reservaId}/reembolsar`, payload);
    return res?.data ?? null;
}

export async function crearSolicitudReembolso(localizador, payload) {
    try {
        const res = await axios.post(
            `/reservas/${localizador}/refund-requests`,
            payload,
        );
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, message: err.message };
    }
}

// Admin
export async function listarSolicitudesReembolso(params = {}) {
    const res = await axios.get('/refund-requests', { params });
    return res?.data ?? null;
}

export async function aprobarSolicitud(id, payload = {}) {
    const res = await axios.post(`/refund-requests/${id}/approve`, payload);
    return res?.data ?? null;
}

export async function rechazarSolicitud(id, payload = {}) {
    const res = await axios.post(`/refund-requests/${id}/reject`, payload);
    return res?.data ?? null;
}

export async function eliminarSolicitud(id, payload = {}) {
    const res = await axios.delete(`/refund-requests/${id}`, { data: payload });
    return res?.data ?? null;
}

// asignar/desasignar habitaciones (admin)
export async function asignarHabitaciones(reservaId, habitacionIds = []) {
    try {
        const res = await axios.post(
            `/reservas/${reservaId}/asignar-habitaciones`,
            { habitacion_ids: habitacionIds },
        );
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, message: err.message };
    }
}

export async function desasignarHabitaciones(reservaId, habitacionIds = []) {
    try {
        const res = await axios.post(
            `/reservas/${reservaId}/desasignar-habitaciones`,
            { habitacion_ids: habitacionIds },
        );
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, message: err.message };
    }
}

// Crear reserva y abrir Stripe Checkout en una sola operación
export async function crearReservaConCheckout(payload) {
    try {
        const res = await axios.post('/reservas/crear-con-checkout', payload);
        return res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, message: err.message };
    }
}

export async function getDisponibles(checkIn, checkOut, reservaId = null) {
    try {
        const params = { check_in: checkIn, check_out: checkOut };
        if (reservaId) params.reserva_id = reservaId;
        const res = await axios.get('/reservas/disponibles', { params });
        return res?.data?.data ?? res?.data ?? null;
    } catch (err) {
        return err?.response?.data ?? { success: false, message: err?.message };
    }
}
