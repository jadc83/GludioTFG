/* Servicio para consultar precios por día desde la API */

/**
 * Consulta precios y ocupación por día desde el backend
 * Llama al endpoint /reservas/precios-por-dia con rango de fechas
 * Parámetros: inicioISO, finISO (fechas en formato YYYY-MM-DD)
 * Retorna: Promise con datos de precios por día
 * Lanza: Error si la respuesta no es exitosa
 */
import axios from 'axios';

export async function fetchPreciosPorDia(inicioISO, finISO) {
    try {
        const params = { inicio: inicioISO, fin: finISO };
        const { data } = await axios.get('/reservas/precios-por-dia', { params, withCredentials: true });
        return data;
    } catch (err) {
        const msg = err?.response?.data || err?.message || 'Error cargando precios por día';
        throw new Error(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
}
