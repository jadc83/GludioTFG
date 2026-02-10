import React, { useEffect, useState } from 'react';

export default function EmpleadoProfile({ habitaciones = [], showAssignState = true }) {
    // Use state so we can refresh without recargar la página
    const [rooms, setRooms] = useState(Array.isArray(habitaciones) ? habitaciones : []);
    const [loading, setLoading] = useState(false);
    const [hasActiveTask, setHasActiveTask] = useState(false);

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/habitaciones/limpieza', { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
            if (!res.ok) {
                setRooms([]);
                setLoading(false);
                return;
            }
            const data = await res.json();
            setRooms(data.habitaciones || []);
        } catch (e) {
            console.error('fetch rooms failed', e);
            setRooms([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchMyTareas = async () => {
        try {
            const res = await fetch('/api/tareas', { credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json' } });
            if (!res.ok) { setHasActiveTask(false); return; }
            const data = await res.json();
            setHasActiveTask(Array.isArray(data.tareas) && data.tareas.length > 0);
        } catch (e) { console.error('fetch tareas failed', e); setHasActiveTask(false); }
    };

    useEffect(() => {
        const handler = () => { fetchRooms(); fetchMyTareas(); };
        window.addEventListener('tareas:updated', handler);
        handler();
        return () => window.removeEventListener('tareas:updated', handler);
    }, []);

    // Inicializar si el prop cambia
    useEffect(() => { setRooms(Array.isArray(habitaciones) ? habitaciones : []); }, [habitaciones]);

    if (!Array.isArray(rooms) && !loading) return null;

    return (
        <div className="mt-8 rounded-xl border border-gray-100 p-6 bg-white">
            <h4 className="font-black uppercase text-sm text-gray-700">Tareas</h4>

            <div className="mt-3">
                <h5 className="font-black uppercase text-xs text-gray-700 mb-3">Habitaciones en Limpieza</h5>

                {loading ? (
                    <div className="p-6 text-sm text-gray-500">Cargando habitaciones...</div>
                ) : rooms.length === 0 ? (
                    <div className="p-6 text-sm text-gray-500">No hay habitaciones en limpieza.</div>
                ) : (
                    <div>
                        <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                            {rooms.map((h) => (
                                <div key={h.id} className="rounded-lg border border-gray-100 p-4 bg-gray-50">
                                    <div className="font-black uppercase text-sm">{h.numero || h.tipo}</div>
                                    <div className="text-xs text-gray-500">Tipo: {h.tipo}</div>
                                    <div className="text-xs text-gray-500">Capacidad: {h.capacidad}</div>
                                    <div className="mt-3">
                                        <button
                                            className={`rounded-md bg-[#920303] text-white px-3 py-1 text-xs font-black ${hasActiveTask ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            disabled={hasActiveTask}
                                            onClick={async () => {
                                                if (hasActiveTask) return;
                                                // Asignarse la habitación creando una tarea
                                                try {
                                                    const csrf = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
                                                    const res = await fetch('/api/tareas/assign-room', {
                                                        method: 'POST',
                                                        credentials: 'same-origin',
                                                        headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest', 'Accept': 'application/json', 'X-CSRF-TOKEN': csrf },
                                                        body: JSON.stringify({ habitacion_id: h.id }),
                                                    });
                                                    if (!res.ok) {
                                                        if (res.status === 419) {
                                                            console.error('assign failed: CSRF token invalid or expired');
                                                            try {
                                                                // Mostrar aviso al usuario y recargar para renovar sesión/CSRF
                                                                window.alert('Sesión expirada o token inválido. Se recargará la página para renovarla.');
                                                            } catch (e) {}
                                                            window.location.reload();
                                                            return;
                                                        }
                                                        const err = await res.json().catch(() => ({}));
                                                        console.error('assign failed', err);
                                                        return;
                                                    }
                                                    // Disparar evento para actualizar vistas relacionadas
                                                    window.dispatchEvent(new Event('tareas:updated'));
                                                } catch (e) {
                                                    console.error(e);
                                                }
                                            }}
>
                                            {showAssignState ? (hasActiveTask ? 'Tarea activa' : 'Asignarme') : 'Asignarme'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
