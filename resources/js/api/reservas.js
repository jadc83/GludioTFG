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
