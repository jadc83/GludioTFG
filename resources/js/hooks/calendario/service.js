/* Servicio para consultar precios por día desde la API */
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
