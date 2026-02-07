import axios from 'axios';

export async function buscarReserva(localizador) {
    const res = await axios.get(`/reservas/buscar/${localizador}`);
    return res?.data?.reserva ?? null;
}

export async function modificarEstancia(localizador, payload) {
    // Endpoint removed server-side. Return controlled error to avoid accidental calls.
    return { success: false, error: 'funcionalidad_eliminada', message: 'La modificación de estancia ha sido eliminada', status: 410 };
}

export async function previewModificarEstancia(localizador, params) {
    // Endpoint removed server-side. Return controlled response.
    return { success: false, error: 'funcionalidad_eliminada', message: 'La vista previa de modificación de estancia ha sido eliminada', status: 410 };
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
