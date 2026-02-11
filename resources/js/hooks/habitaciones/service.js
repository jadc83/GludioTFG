/**
 * Servicio: funciones para consultar habitaciones disponibles desde el backend.
 * Exporta `fetchHabitacionesDisponibles(check_in, check_out, options)`.
 */
import axios from 'axios';

export async function fetchHabitacionesDisponibles(
    check_in,
    check_out,
    { signal } = {},
) {
    try {
        const params = {
            check_in,
            check_out,
            individuales: 'true',
            _ts: Date.now(),
        };
        const { data } = await axios.get('/habitaciones/disponibles', {
            params,
            signal,
            headers: { 'X-Requested-With': 'XMLHttpRequest' },
        });
        return data;
    } catch (err) {
        const msg =
            err?.response?.data ||
            err?.message ||
            'Error obteniendo habitaciones disponibles';
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
}
