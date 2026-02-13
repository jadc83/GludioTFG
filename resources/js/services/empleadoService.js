export async function fetchRoles() {
    try {
        const r = await fetch('/api/roles', { credentials: 'same-origin' });
        const data = await r.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}

export async function fetchDepartamentos() {
    try {
        const r = await fetch('/api/departamentos', { credentials: 'same-origin' });
        const data = await r.json();
        return Array.isArray(data) ? data : [];
    } catch (e) {
        return [];
    }
}
