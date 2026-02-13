import { useCallback, useState } from 'react';

export default function useTurnos(empleadoId = null) {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            let url = '/api/turnos';
            if (empleadoId) url += `?empleado_id=${encodeURIComponent(empleadoId)}`;
            const res = await fetch(url, {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                setEvents([]);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setEvents(
                (data.turnos || []).map((t) => ({
                    id: t.id,
                    title: t.title,
                    start: t.start,
                    end: t.end,
                    meta: t.meta || null,
                })),
            );
        } catch (e) {
            console.error('useTurnos fetch failed', e);
            setEvents([]);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: { message: 'Error al cargar turnos', type: 'error' },
                }),
            );
        } finally {
            setLoading(false);
        }
    }, []);

    return { events, setEvents, loading, fetchEvents };
}
