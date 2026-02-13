export async function listar(params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `/api/empleados?${query}` : '/api/empleados';
    const r = await fetch(url, { credentials: 'same-origin' });
    if (!r.ok) throw new Error('Error listando empleados');
    return r.json();
}

export async function buscar(id) {
    const r = await fetch(`/api/empleados/${id}`, { credentials: 'same-origin' });
    if (!r.ok) throw new Error('Error buscando empleado');
    return r.json();
}

export async function eliminar(id) {
    const r = await fetch(`/empleados/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
    });
    if (!r.ok) throw new Error('Error eliminando empleado');
    return r.json();
}
