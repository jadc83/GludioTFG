/* Servicio para consultar precios por día desde la API */

/**
 * Consulta precios y ocupación por día desde el backend
 * Llama al endpoint /reservas/precios-por-dia con rango de fechas
 * Parámetros: inicioISO, finISO (fechas en formato YYYY-MM-DD)
 * Retorna: Promise con datos de precios por día
 * Lanza: Error si la respuesta no es exitosa
 */
export async function fetchPreciosPorDia(inicioISO, finISO) {
    const params = new URLSearchParams({ inicio: inicioISO, fin: finISO });
    const resp = await fetch(`/reservas/precios-por-dia?${params.toString()}`, {
        headers: { Accept: 'application/json' },
        credentials: 'include',
    });

    if (!resp.ok) {
        const txt = await resp.text().catch(() => null);
        throw new Error(txt || `Error ${resp.status}`);
    }

    const json = await resp.json();
    return json;
}
