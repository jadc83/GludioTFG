import { Link, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import habitacionesService from '@/services/habitacionesService';

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
    const [loadingIds, setLoadingIds] = useState([]);
    const [confirm, setConfirm] = useState({ open: false, tareaId: null, descripcion: '' });
    const page = usePage();
    const roles = page?.props?.auth?.user?.roles || [];
    // Allow marking maintenance for encargado|operario|auxiliar
    // Fallback to page.props.can_view_tareas when roles array is empty or not trustworthy
    const puedeMarcarMantenimiento = roles.some((r) => ['encargado','operario','auxiliar'].includes(r)) || !!page?.props?.can_view_tareas;
    // Debug: mostrar roles y permiso en consola para verificar comportamiento
    if (import.meta.env.DEV) {
        console.debug('EmpleadoProfile roles:', roles, 'puedeMarcarMantenimiento:', puedeMarcarMantenimiento);
    }
    const getCsrf = () =>
        page?.props?.csrf_token ||
        document
            .querySelector('meta[name="csrf-token"]')
            ?.getAttribute('content') ||
        '';

    const fetchRooms = async () => {
        setLoading(true);
        try {
            const data = await habitacionesService.getHabitacionesLimpieza(true);
            setRooms((data && data.habitaciones) || []);
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
        // kept for backward compatibility: use confirmComplete to show modal
        doComplete(tareaId);
    };

    const doComplete = async (tareaId) => {
        try {
            setLoadingIds((s) => [...s, tareaId]);
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
        } finally {
            setLoadingIds((s) => s.filter((id) => id !== tareaId));
            setConfirm({ open: false, tareaId: null, descripcion: '' });
        }
    };

    const confirmComplete = (tareaId, descripcion) => {
        setConfirm({ open: true, tareaId, descripcion });
    };

    const cancelTarea = async (tareaId) => {
        try {
            setLoadingIds((s) => [...s, tareaId]);
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
        } finally {
            setLoadingIds((s) => s.filter((id) => id !== tareaId));
        }
    };

    useEffect(() => {
        const handler = () => {
            fetchRooms();
            fetchMyTareas();
        };
        window.addEventListener('tareas:updated', handler);
        handler();

        // Also subscribe to real-time broadcasts for habitación updates so
        // this component refreshes its lists without a full page reload.
        try {
            if (window.Echo) {
                const channel = window.Echo.private('habitaciones');
                channel.listen('HabitacionUpdated', () => {
                    try {
                        handler();
                    } catch (e) {
                        console.debug('Error handling HabitacionUpdated', e);
                    }
                });

                return () => {
                    try {
                        channel.stopListening('HabitacionUpdated');
                    } catch (e) {
                        console.debug(e);
                    }
                    try {
                        if (window.Echo && window.Echo.leave) window.Echo.leave('habitaciones');
                    } catch (e) {
                        console.debug(e);
                    }
                };
            }
        } catch (e) {
            console.debug('Echo no disponible para habitaciones', e);
        }

        return () => {
            try { window.removeEventListener('tareas:updated', handler); } catch (e) { console.debug(e); }
        };
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
                {/* KPIs ligeros */}
                <div className="mb-4 flex items-center gap-4">
                    <div className="rounded-md bg-gray-50 px-4 py-2 text-sm font-black uppercase text-gray-700">
                        Pendientes: <span className="ml-2 text-base text-gray-900">{rooms.filter(r => !activeTareas.map(t=>t.habitacion?.id).includes(r.id)).length}</span>
                    </div>
                </div>
                        {/* MIS TAREAS ACTIVAS */}
                        <div className="mb-6">
                            <div className="mb-3 flex items-center justify-between">
                                <h5 className="text-xs font-black uppercase text-gray-700">
                                    Mis tareas activas
                                </h5>
                                <Link href="/profile/tareas/completadas" className="text-xs text-gray-500">
                                    Ver historial
                                </Link>
                            </div>
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
                                                    className={`rounded bg-rose-500 px-3 py-1 text-xs text-white ${loadingIds.includes(t.id) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                    onClick={() => confirmComplete(t.id, t.descripcion)}
                                                    disabled={loadingIds.includes(t.id)}
                                                >
                                                    {loadingIds.includes(t.id) ? (
                                                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                    ) : (
                                                        'Completar'
                                                    )}
                                                </button>
                                                <button
                                                    className="rounded border border-gray-200 px-3 py-1 text-xs text-gray-700"
                                                    onClick={() => cancelTarea(t.id)}
                                                    disabled={loadingIds.includes(t.id)}
                                                >
                                                    Desasignar
                                                </button>
                                                {t.habitacion && puedeMarcarMantenimiento && (
                                                    <button
                                                        className={`rounded border border-yellow-400 bg-yellow-50 px-3 py-1 text-xs text-yellow-700 ${loadingIds.includes(`mantenimiento-${t.id}`) ? 'opacity-60 cursor-not-allowed' : ''}`}
                                                        onClick={async () => {
                                                            if (import.meta.env.DEV) console.debug('Click mantenimiento', t.id, t.habitacion);
                                                            if (loadingIds.includes(`mantenimiento-${t.id}`)) return;
                                                            const confirmed = window.confirm(`¿Marcar habitación ${t.habitacion.numero} como Mantenimiento?`);
                                                            if (!confirmed) return;
                                                            const key = `mantenimiento-${t.id}`;
                                                            setLoadingIds((s) => [...s, key]);
                                                            try {
                                                                const csrf = getCsrf();
                                                                const habId = t.habitacion.id;
                                                                // La API de update valida campos obligatorios (numero,tipo,capacidad,estado).
                                                                // Enviar los campos mínimos requeridos para evitar 422.
                                                                // Asegurar que `tipo` esté dentro de los valores esperados por la validación
                                                                const tiposPermitidos = ['doble','suite','familiar'];
                                                                const tipoValido = tiposPermitidos.includes((t.habitacion.tipo || '').toString()) ? t.habitacion.tipo : 'doble';
                                                                const payload = {
                                                                    estado: 'mantenimiento',
                                                                    numero: t.habitacion.numero,
                                                                    tipo: tipoValido,
                                                                    capacidad: t.habitacion.capacidad || 1,
                                                                    descripcion: t.habitacion.descripcion || null,
                                                                    notas: t.habitacion.notas || null,
                                                                };

                                                                try {
                                                                    await habitacionesService.updateHabitacionJson(habId, payload);
                                                                } catch (err) {
                                                                    const resp = err || {};
                                                                    if (resp.status === 419) {
                                                                        try { window.alert('Sesión expirada o token inválido. Se recargará la página.'); } catch (e) { console.debug(e); }
                                                                        window.location.reload();
                                                                        return;
                                                                    }
                                                                    console.error('PUT /habitaciones error body', resp);
                                                                    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: resp.error || resp.message || 'Error al marcar mantenimiento', type: 'error' } }));
                                                                    return;
                                                                }
                                                                // Notificar que la habitación se marcó en mantenimiento
                                                                window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Habitación marcada como mantenimiento', type: 'success' } }));
                                                                // Refrescar listas para reflejar el nuevo estado (no completar la tarea)
                                                                window.dispatchEvent(new Event('tareas:updated'));
                                                                // Emitir evento local; componentes suscritos y Reverb actualizarán la UI
                                                                window.dispatchEvent(new Event('habitaciones:updated'));
                                                            } catch (e) {
                                                                console.error(e);
                                                            } finally {
                                                                setLoadingIds((s) => s.filter(id => id !== `mantenimiento-${t.id}`));
                                                            }
                                                        }}
                                                    >
                                                        Mantenimiento
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-sm text-gray-500">
                                    No tienes tareas activas.
                                </div>
                            )}

                {/* Modal de confirmación */}
                {confirm.open && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        <div
                            className="absolute inset-0 bg-black opacity-40"
                            onClick={() => setConfirm({ open: false, tareaId: null, descripcion: '' })}
                        />
                        <div className="z-10 w-11/12 max-w-md rounded bg-white p-6 shadow-lg">
                            <h3 className="mb-2 text-lg font-bold">Confirmar</h3>
                            <p className="mb-4 text-sm text-gray-700">¿Confirmas completar la tarea: <strong>{confirm.descripcion || confirm.tareaId}</strong>?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    className="rounded border border-gray-300 px-3 py-1 text-sm"
                                    onClick={() => setConfirm({ open: false, tareaId: null, descripcion: '' })}
                                >
                                    Cancelar
                                </button>
                                <button
                                    className="rounded bg-rose-500 px-3 py-1 text-sm text-white"
                                    onClick={() => doComplete(confirm.tareaId)}
                                >
                                    Confirmar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

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
                                                            className={`rounded-md bg-[#920303] px-3 py-1 text-xs font-black text-white ${(hasActiveTask || loadingIds.includes(`assign-${h.id}`)) ? 'cursor-not-allowed opacity-50' : ''}`}
                                                            disabled={hasActiveTask || loadingIds.includes(`assign-${h.id}`)}
                                                            onClick={async () => {
                                                                if (hasActiveTask) return;
                                                                const assignKey = `assign-${h.id}`;
                                                                setLoadingIds((s) => [...s, assignKey]);
                                                                try {
                                                                    const csrf = getCsrf();
                                                                    const res = await fetch('/api/tareas/assign-room', {
                                                                        method: 'POST',
                                                                        credentials: 'same-origin',
                                                                        headers: {
                                                                            'Content-Type': 'application/json',
                                                                            'X-Requested-With': 'XMLHttpRequest',
                                                                            Accept: 'application/json',
                                                                            'X-CSRF-TOKEN': csrf,
                                                                        },
                                                                        body: JSON.stringify({ habitacion_id: h.id }),
                                                                    });
                                                                    if (!res.ok) {
                                                                        if (res.status === 419) {
                                                                            try { window.alert('Sesión expirada o token inválido. Se recargará la página para renovarla.'); } catch (e) { console.debug(e); }
                                                                            window.location.reload();
                                                                            return;
                                                                        }
                                                                        const err = await res.json().catch(() => ({}));
                                                                        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: err.error || 'Error al asignar habitación', type: 'error' } }));
                                                                        return;
                                                                    }
                                                                    window.dispatchEvent(new Event('tareas:updated'));
                                                                    window.dispatchEvent(new CustomEvent('app-toast', { detail: { message: 'Tarea creada', type: 'success' } }));
                                                                } catch (e) {
                                                                    console.error(e);
                                                                } finally {
                                                                    setLoadingIds((s) => s.filter(id => id !== assignKey));
                                                                }
                                                            }}
                                                        >
                                                            {loadingIds.includes(`assign-${h.id}`) ? (
                                                                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                            ) : (
                                                                showAssignState ? (hasActiveTask ? 'Tarea activa' : 'Asignarme') : 'Asignarme'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
            </div>
        </section>
    );
}
