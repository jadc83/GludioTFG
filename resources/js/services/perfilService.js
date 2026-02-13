const cabecerasPorDefecto = () => ({
    'X-Requested-With': 'XMLHttpRequest',
    Accept: 'application/json',
});

export async function obtenerTurnos(empleadoId = null) {
    let url = '/api/turnos';
    if (empleadoId) url += `?empleado_id=${encodeURIComponent(empleadoId)}`;
    const res = await fetch(url, { credentials: 'same-origin', headers: cabecerasPorDefecto() });
    if (!res.ok) throw new Error('Error al obtener turnos');
    return res.json();
}

export async function obtenerTareasCompletadas() {
    const res = await fetch('/api/tareas/completed', { credentials: 'same-origin', headers: cabecerasPorDefecto() });
    if (!res.ok) throw new Error('Error al obtener tareas completadas');
    return res.json();
}

export async function obtenerTareas() {
    const res = await fetch('/api/tareas', { credentials: 'same-origin', headers: cabecerasPorDefecto() });
    if (!res.ok) throw new Error('Error al obtener tareas');
    return res.json();
}

export async function eliminarTurno(id) {
    const csrf = window.getCsrfToken?.() || '';
    const res = await fetch(`/api/turnos/${id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { ...cabecerasPorDefecto(), 'X-XSRF-TOKEN': csrf },
    });
    if (!res.ok) throw new Error('Error al eliminar turno');
    return res.json();
}

export default { obtenerTurnos, obtenerTareasCompletadas, obtenerTareas, eliminarTurno };
