import axios from 'axios';

export async function buscarReserva(localizador) {
    const res = await axios.get(`/reservas/buscar/${localizador}`);
    return res?.data?.reserva ?? null;
}

export async function modificarEstancia(localizador, payload) {
    const res = await axios.post(`/reservas/${localizador}/modificar-estancia`, payload);
    return res?.data ?? null;
}

export async function previewModificarEstancia(localizador, params) {
    const res = await axios.get(`/reservas/${localizador}/preview-modificar-estancia`, { params });
    return res?.data ?? null;
}

export async function solicitarReembolso(reservaId, payload) {
    const res = await axios.post(`/reservas/${reservaId}/reembolsar`, payload);
    return res?.data ?? null;
}

export async function crearSolicitudReembolso(localizador, payload) {
    const res = await axios.post(`/reservas/${localizador}/refund-requests`, payload);
    return res?.data ?? null;
}

// Admin
export async function listarSolicitudesReembolso(params = {}) {
    const res = await axios.get('/admin/refund-requests', { params });
    return res?.data ?? null;
}

export async function aprobarSolicitud(id, payload = {}) {
    const res = await axios.post(`/admin/refund-requests/${id}/approve`, payload);
    return res?.data ?? null;
}

export async function rechazarSolicitud(id, payload = {}) {
    const res = await axios.post(`/admin/refund-requests/${id}/reject`, payload);
    return res?.data ?? null;
}

export async function eliminarSolicitud(id, payload = {}) {
    const res = await axios.delete(`/admin/refund-requests/${id}`, { data: payload });
    return res?.data ?? null;
}
