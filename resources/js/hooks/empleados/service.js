/**
 * Servicio para llamadas HTTP relacionadas con empleados.
 * Exporta: fetchEmpleados, fetchEmpleado, crearEmpleado, actualizarEmpleado, eliminarEmpleado
 */
import axios from 'axios';

export async function fetchEmpleados(params = {}, { signal } = {}) {
    try {
        const { data } = await axios.get('/empleados', {
            params,
            signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        return data;
    } catch (err) {
        throw new Error(
            err?.response?.data || err?.message || 'Error cargando empleados',
        );
    }
}

export async function fetchEmpleado(id, { signal } = {}) {
    try {
        const { data } = await axios.get(`/empleados/${id}`, {
            signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        return data;
    } catch (err) {
        throw new Error(
            err?.response?.data || err?.message || 'Error cargando empleado',
        );
    }
}

export async function crearEmpleado(payload, { signal } = {}) {
    try {
        const { data } = await axios.post('/empleados', payload, {
            signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        return data;
    } catch (err) {
        throw new Error(
            err?.response?.data || err?.message || 'Error creando empleado',
        );
    }
}

export async function actualizarEmpleado(id, payload, { signal } = {}) {
    try {
        const { data } = await axios.put(`/empleados/${id}`, payload, {
            signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        return data;
    } catch (err) {
        throw new Error(
            err?.response?.data ||
                err?.message ||
                'Error actualizando empleado',
        );
    }
}

export async function eliminarEmpleado(id, { signal } = {}) {
    try {
        const { data } = await axios.delete(`/empleados/${id}`, {
            signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        return data;
    } catch (err) {
        throw new Error(
            err?.response?.data || err?.message || 'Error eliminando empleado',
        );
    }
}
