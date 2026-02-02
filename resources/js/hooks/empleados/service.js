/**
 * Servicio para llamadas HTTP relacionadas con empleados.
 * Exporta: fetchEmpleados, fetchEmpleado, crearEmpleado, actualizarEmpleado, eliminarEmpleado
 */
export async function fetchEmpleados(params = {}, { signal } = {}) {
    const url = new URL('/empleados', window.location.origin);
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null) url.searchParams.append(k, v);
    });
    const res = await fetch(url.toString(), {
        method: 'GET',
        signal,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
}

export async function fetchEmpleado(id, { signal } = {}) {
    const res = await fetch(`/empleados/${id}`, {
        method: 'GET',
        signal,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
}

export async function crearEmpleado(payload, { signal } = {}) {
    const res = await fetch('/empleados', {
        method: 'POST',
        signal,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
}

export async function actualizarEmpleado(id, payload, { signal } = {}) {
    const res = await fetch(`/empleados/${id}`, {
        method: 'PUT',
        signal,
        headers: {
            'X-Requested-With': 'XMLHttpRequest',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
}

export async function eliminarEmpleado(id, { signal } = {}) {
    const res = await fetch(`/empleados/${id}`, {
        method: 'DELETE',
        signal,
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
    });
    if (!res.ok) throw new Error(await res.text().catch(() => res.statusText));
    return res.json();
}
