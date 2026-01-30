/**
 * Servicio: funciones para consultar habitaciones disponibles desde el backend.
 * Exporta `fetchHabitacionesDisponibles(check_in, check_out, options)`.
 */
export async function fetchHabitacionesDisponibles(check_in, check_out, { signal } = {}) {
	const url = `/habitaciones/disponibles?check_in=${encodeURIComponent(check_in)}&check_out=${encodeURIComponent(check_out)}`;
	const res = await fetch(url, { method: 'GET', signal });
	if (!res.ok) {
		const t = await res.text().catch(() => null);
		const msg = t || res.statusText || `HTTP ${res.status}`;
		throw new Error(msg);
	}
	return res.json();
}
