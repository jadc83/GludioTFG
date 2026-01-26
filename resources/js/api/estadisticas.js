import axios from 'axios';

export async function obtenerOcupacion(params = {}) {
    const res = await axios.get('/panel/estadisticas/ocupacion', { params });
    return res?.data ?? null;
}
