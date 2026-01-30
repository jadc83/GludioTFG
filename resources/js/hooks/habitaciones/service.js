/**
 * Servicio: funciones para consultar habitaciones disponibles desde el backend.
 * Exporta `fetchHabitacionesDisponibles(check_in, check_out, options)`.
 */
export async function fetchHabitacionesDisponibles(check_in, check_out, { signal } = {}) {
	const url = `/habitaciones/disponibles?check_in=${encodeURIComponent(check_in)}&check_out=${encodeURIComponent(check_out)}`;
	// Añadimos log y opciones para evitar cache y facilitar visualización en DevTools
	try { console.log('fetchHabitacionesDisponibles ->', url); } catch (e) {}
	const res = await fetch(url + `&_ts=${Date.now()}`, { method: 'GET', signal, cache: 'no-store', headers: { 'X-Requested-With': 'XMLHttpRequest' } });
	if (!res.ok) {
		const t = await res.text().catch(() => null);
		const msg = t || res.statusText || `HTTP ${res.status}`;
		throw new Error(msg);
	}
	return res.json();
}

