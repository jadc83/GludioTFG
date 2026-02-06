import * as api from '@/api/reservas';

export async function buscarReserva(localizador) {
    return api.buscarReserva(localizador);
}

export async function modificarEstancia(localizador, payload) {
    return api.modificarEstancia(localizador, payload);
}

export async function previewModificarEstancia(localizador, params) {
    return api.previewModificarEstancia(localizador, params);
}

export async function crearSolicitudReembolso(localizador, payload) {
    return api.crearSolicitudReembolso(localizador, payload);
}

export async function crearReservaConCheckout(payload) {
    return api.crearReservaConCheckout(payload);
}
