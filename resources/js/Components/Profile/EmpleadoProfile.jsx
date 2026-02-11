import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function EmpleadoProfile({
    habitaciones = [],
    showAssignState = true,
}) {
    // Use state so we can refresh without recargar la página
    const [rooms, setRooms] = useState(
        Array.isArray(habitaciones) ? habitaciones : [],
    );
    const [loading, setLoading] = useState(false);
    const [hasActiveTask, setHasActiveTask] = useState(false);
    const [activeTareas, setActiveTareas] = useState([]);
    const page = usePage();
    const getCsrf = () =>
        page?.props?.csrf_token ||
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ||
        '';

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/habitaciones/limpieza', {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });
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
            const res = await fetch('/api/tareas', {
                credentials: 'same-origin',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                setHasActiveTask(false);
                setActiveTareas([]);
                return;
            }
            const data = await res.json();
            const tareas = Array.isArray(data.tareas) ? data.tareas : [];
            setActiveTareas(tareas);
            setHasActiveTask(tareas.length > 0);
        } catch (e) {
            console.error('fetch tareas failed', e);
            setHasActiveTask(false);
            setActiveTareas([]);
        }
    };

    const completeTarea = async (tareaId) => {
        try {
            const csrf = getCsrf();
            const res = await fetch(`/api/tareas/${tareaId}/complete`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                window.dispatchEvent(
                    new CustomEvent('app-toast', {
                        detail: {
                            message: err.error || 'Error al completar tarea',
                            type: 'error',
                        },
                    }),
                );
                return;
            }
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: { message: 'Tarea completada', type: 'success' },
                }),
            );
            window.dispatchEvent(new Event('tareas:updated'));
        } catch (e) {
            console.error(e);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Error al completar tarea',
                        type: 'error',
                    },
                }),
            );
        }
    };

    const cancelTarea = async (tareaId) => {
        try {
            const csrf = getCsrf();
            const res = await fetch(`/api/tareas/${tareaId}/cancel`, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': csrf,
                    'X-Requested-With': 'XMLHttpRequest',
                    Accept: 'application/json',
                },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                window.dispatchEvent(
                    new CustomEvent('app-toast', {
                        detail: {
                            message: err.error || 'Error al desasignar tarea',
                            type: 'error',
                        },
                    }),
                );
                return;
            }
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: { message: 'Tarea desasignada', type: 'success' },
                }),
            );
            window.dispatchEvent(new Event('tareas:updated'));
        } catch (e) {
            console.error(e);
            window.dispatchEvent(
                new CustomEvent('app-toast', {
                    detail: {
                        message: 'Error al desasignar tarea',
                        type: 'error',
                    },
                }),
            );
        }
    };

    useEffect(() => {
        const handler = () => {
            fetchRooms();
            fetchMyTareas();
        };
        window.addEventListener('tareas:updated', handler);
        handler();
        return () => window.removeEventListener('tareas:updated', handler);
    }, []);

    // Inicializar si el prop cambia
    useEffect(() => {
        setRooms(Array.isArray(habitaciones) ? habitaciones : []);
    }, [habitaciones]);

    if (!Array.isArray(rooms) && !loading) return null;

    return (
        <section
            aria-labelledby="tareas-heading"
            className="mt-8 rounded-xl border border-gray-100 bg-white p-6"
        >
            <h4
                id="tareas-heading"
                className="text-sm font-black uppercase text-gray-700"
            >
                Tareas
            </h4>

            <div className="mt-3">
                <h5 className="mb-3 text-xs font-black uppercase text-gray-700">
                    Habitaciones en Limpieza
                </h5>

                {loading ? (
                    <div className="p-6 text-sm text-gray-500">
                        Cargando habitaciones...
                    </div>
                ) : (
                    <div>
                        {/* HABITACIONES EN LIMPIEZA (solo NO asignadas) */}
                        {(() => {
                            const assignedIds = activeTareas
                                .map((t) => t.habitacion?.id)
                                .filter(Boolean);
                            const unassignedRooms = rooms.filter(
                                (r) => !assignedIds.includes(r.id),
                            );
                            if (unassignedRooms.length === 0) {
                                return (
                                    <div className="p-6 text-sm text-gray-500">
                                        No hay habitaciones en limpieza.
                                    </div>
                                );
                            }
                            return (
                                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                                    {unassignedRooms.map((h) => (
                                        <div
                                            key={h.id}
                                            className="rounded-lg border border-gray-100 bg-gray-50 p-4"
                                        >
                                            <div className="text-sm font-black uppercase">
                                                {h.numero || h.tipo}
                                            </div>
                                            {h.tipo ? (
                                                <div className="text-xs text-gray-500">
                                                    Tipo: {h.tipo}
                                                </div>
                                            ) : null}
                                            {h.capacidad ? (
                                                <div className="text-xs text-gray-500">
                                                    Capacidad: {h.capacidad}
                                                </div>
                                            ) : null}
                                            <div className="mt-3">
                                                <button
                                                    className={`rounded-md bg-[#920303] px-3 py-1 text-xs font-black text-white ${hasActiveTask ? 'cursor-not-allowed opacity-50' : ''}`}
                                                    disabled={hasActiveTask}
                                                    onClick={async () => {
                                                        if (hasActiveTask)
                                                            return;
                                                        try {
                                                            const csrf =
                                                                getCsrf();
                                                            const res =
                                                                await fetch(
                                                                    '/api/tareas/assign-room',
                                                                    {
                                                                        method: 'POST',
                                                                        credentials:
                                                                            'same-origin',
                                                                        headers:
                                                                            {
                                                                                'Content-Type':
                                                                                    'application/json',
                                                                                'X-Requested-With':
                                                                                    'XMLHttpRequest',
                                                                                Accept: 'application/json',
                                                                                'X-CSRF-TOKEN':
                                                                                    csrf,
                                                                            },
                                                                        body: JSON.stringify(
                                                                            {
                                                                                habitacion_id:
                                                                                    h.id,
                                                                            },
                                                                        ),
                                                                    },
                                                                );
                                                            if (!res.ok) {
                                                                if (
                                                                    res.status ===
                                                                    419
                                                                ) {
                                                                    try {
                                                                        window.alert(
                                                                            'Sesión expirada o token inválido. Se recargará la página para renovarla.',
                                                                        );
                                                                    } catch (e) {
                                                                        console.debug(
                                                                            e,
                                                                        );
                                                                    }
                                                                    window.location.reload();
                                                                    return;
                                                                }
                                                                const err =
                                                                    await res
                                                                        .json()
                                                                        .catch(
                                                                            () => ({}),
                                                                        );
                                                                window.dispatchEvent(
                                                                    new CustomEvent(
                                                                        'app-toast',
                                                                        {
                                                                            detail: {
                                                                                message:
                                                                                    err.error ||
                                                                                    'Error al asignar habitación',
                                                                                type: 'error',
                                                                            },
                                                                        },
                                                                    ),
                                                                );
                                                                return;
                                                            }
                                                            window.dispatchEvent(
                                                                new Event(
                                                                    'tareas:updated',
                                                                ),
                                                            );
                                                            window.dispatchEvent(
                                                                new CustomEvent(
                                                                    'app-toast',
                                                                    {
                                                                        detail: {
                                                                            message:
                                                                                'Tarea creada',
                                                                            type: 'success',
                                                                        },
                                                                    },
                                                                ),
                                                            );
                                                        } catch (e) {
                                                            console.error(e);
                                                        }
                                                    }}
                                                >
                                                    {showAssignState
                                                        ? hasActiveTask
                                                            ? 'Tarea activa'
                                                            : 'Asignarme'
                                                        : 'Asignarme'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()}

                        {/* MIS TAREAS ACTIVAS */}
                        <div className="mt-6">
                            <h5 className="mb-3 text-xs font-black uppercase text-gray-700">
                                Mis tareas activas
                            </h5>
                            {activeTareas && activeTareas.length > 0 ? (
                                <div className="space-y-3">
                                    {activeTareas.map((t) => (
                                        <div
                                            key={t.id}
                                            className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-3"
                                        >
                                            <div>
                                                <div className="text-sm font-semibold">
                                                    {t.habitacion
                                                        ? `Hab. ${t.habitacion.numero}`
                                                        : t.descripcion}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {t.descripcion}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    className="rounded bg-rose-500 px-3 py-1 text-xs text-white"
                                                    onClick={() =>
                                                        completeTarea(t.id)
                                                    }
                                                >
                                                    Completar
                                                </button>
                                                <button
                                                    className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-700"
                                                    onClick={() =>
                                                        cancelTarea(t.id)
                                                    }
                                                >
                                                    Desasignar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-sm text-gray-500">
                                    No tienes tareas activas.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
