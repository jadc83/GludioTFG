// Servicio local para reservas. Reexporta las funciones del módulo API central
// Esto permite cambiar la implementación sólo en este archivo en el futuro.
import axios from 'axios';
import * as api from '@/api/reservas';

export const buscarReserva = async (localizador) =>
    api.buscarReserva(localizador);
export const modificarEstancia = async (localizador, payload) =>
    api.modificarEstancia(localizador, payload);
export const previewModificarEstancia = async (localizador, params) =>
    api.previewModificarEstancia(localizador, params);
export const solicitarReembolso = async (reservaId, payload) =>
    api.solicitarReembolso(reservaId, payload);
export const crearSolicitudReembolso = async (localizador, payload) =>
    api.crearSolicitudReembolso(localizador, payload);

// funciones administrativas reexportadas
export const listarSolicitudesReembolso = async (params = {}) =>
    api.listarSolicitudesReembolso(params);
export const aprobarSolicitud = async (id, payload = {}) =>
    api.aprobarSolicitud(id, payload);
export const rechazarSolicitud = async (id, payload = {}) =>
    api.rechazarSolicitud(id, payload);
export const eliminarSolicitud = async (id, payload = {}) =>
    api.eliminarSolicitud(id, payload);

// Funciones adicionales: calcular precio, crear reserva, info/extension, etc.
export async function calcularPrecio(payload) {
    try {
        const res = await axios.post('/reservas/calcular-precio', payload);
        return res?.data ?? null;
    } catch (err) {
        // Normalizar error para que todos los clientes manejen el mismo formato
        const message = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error calculando precio';
        // Logging removed for cleanliness; error propagated to caller
        throw { status: err?.response?.status || 500, error: message };
    }
}

export async function crearReserva(payload) {
    try {
        const res = await axios.post('/reservas', payload, {
            headers: {
                Accept: 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
            },
        });
        return res?.data ?? null;
    } catch (err) {
        if (err?.response) {
            const payload = {
                status: err.response.status,
                ...(err.response.data || {}),
            };
            // Error details removed from console; rethrowing payload for caller handling
            throw payload;
        }
        throw err;
    }
}

export async function extenderReserva(localizador, payload) {
    try {
        const res = await axios.post(
            `/reservas/${localizador}/extender`,
            payload,
        );
        return res?.data ?? null;
    } catch (err) {
        throw err?.response?.data ?? err;
    }
}

export async function obtenerClientes() {
    try {
        const res = await axios.get('/clientes', {
            headers: {
                Accept: 'application/json',
            },
        });
        return res?.data ?? [];
    } catch (err) {
        // Errors handled upstream; removed console logging to keep output clean
        return [];
    }
}

export async function obtenerHabitacionesDisponibles(checkIn, checkOut) {
    try {
        const res = await axios.get('/habitaciones/disponibles', {
            params: {
                check_in: checkIn,
                check_out: checkOut,
                individuales: 'true',
            },
        });
        return res?.data ?? [];
    } catch (err) {
        // Error details removed from console for cleanliness
        return [];
    }
}

export async function obtenerTarifas() {
    try {
        const res = await axios.get('/api/tarifas');
        return res?.data ?? [];
    } catch (err) {
        // Error details removed from console for cleanliness
        return [];
    }
}


// Nota: si en el futuro queremos cambiar la fuente (fetch, cache, worker), modificar aquí.
