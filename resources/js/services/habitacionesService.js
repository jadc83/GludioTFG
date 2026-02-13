import axios from 'axios';

export async function updateHabitacionJson(id, payload = {}) {
    try {
        const res = await axios.put(`/habitaciones/${id}`, payload);
        return res?.data ?? null;
    } catch (err) {
        return Promise.reject(err?.response?.data ?? { error: err.message });
    }
}

export async function updateHabitacionFormData(id, formData) {
    try {
        // Usar POST + _method=PUT para multipart/form-data
        const res = await axios.post(`/habitaciones/${id}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res?.data ?? null;
    } catch (err) {
        return Promise.reject(err?.response?.data ?? { error: err.message });
    }
}

export async function createHabitacionFormData(formData) {
    try {
        const res = await axios.post('/habitaciones', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return res?.data ?? null;
    } catch (err) {
        return Promise.reject(err?.response?.data ?? { error: err.message });
    }
}

export async function getHabitacionesLimpieza(includeAssigned = false) {
    try {
        const params = {};
        if (includeAssigned) params.include_assigned = 1;
        const res = await axios.get('/api/habitaciones/limpieza', { params });
        return res?.data ?? null;
    } catch (err) {
        return Promise.reject(err?.response?.data ?? { error: err.message });
    }
}

export async function getHabitacionesMantenimiento(includeAssigned = false) {
    try {
        const params = {};
        if (includeAssigned) params.include_assigned = 1;
        const res = await axios.get('/api/habitaciones/mantenimiento', { params });
        return res?.data ?? null;
    } catch (err) {
        return Promise.reject(err?.response?.data ?? { error: err.message });
    }
}

export default {
    updateHabitacionJson,
    updateHabitacionFormData,
    createHabitacionFormData,
    getHabitacionesLimpieza,
    getHabitacionesMantenimiento,
};
