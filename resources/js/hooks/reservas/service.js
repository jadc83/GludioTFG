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
    const res = await axios.post('/reservas/calcular-precio', payload);
    return res?.data ?? null;
}

export async function crearReserva(payload) {
    try {
        const res = await axios.post('/reservas', payload);
        return res?.data ?? null;
    } catch (err) {
        // Normalize axios error into a predictable object for callers
        if (err?.response) {
            const payload = {
                status: err.response.status,
                ...(err.response.data || {}),
            };
            throw payload;
        }
        throw err;
    }
}

export async function infoExtension(localizador) {
    try {
        const res = await axios.get(`/reservas/${localizador}/info-extension`);
        return res?.data ?? null;
    } catch (err) {
        throw err?.response?.data ?? err;
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
                'Accept': 'application/json'
            }
        });
        console.log('Respuesta completa de clientes:', res);
        console.log('res.data:', res.data);
        return res?.data ?? [];
    } catch (err) {
        console.error('Error obteniendo clientes:', err);
        console.error('Error details:', err.response);
        return [];
    }
}

export async function obtenerHabitacionesDisponibles(checkIn, checkOut) {
    try {
        const res = await axios.get('/habitaciones/disponibles', {
            params: {
                check_in: checkIn,
                check_out: checkOut,
                individuales: 'true'
            },
        });
        return res?.data ?? [];
    } catch (err) {
        console.error('Error obteniendo habitaciones disponibles:', err);
        return [];
    }
}

export async function obtenerTarifas() {
    try {
        const res = await axios.get('/api/tarifas');
        return res?.data ?? [];
    } catch (err) {
        console.error('Error obteniendo tarifas:', err);
        return [];
    }
}

// Nota: si en el futuro queremos cambiar la fuente (fetch, cache, worker), modificar aquí.
