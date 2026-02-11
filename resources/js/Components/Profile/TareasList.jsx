import { Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function TareasList() {
    const [tareas, setTareas] = useState(null);
    const [loading, setLoading] = useState(false);

    const fetchTareas = () => {
        setLoading(true);
        fetch('/api/tareas', {
            credentials: 'same-origin',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                Accept: 'application/json',
            },
        })
            .then(async (r) => {
                if (!r.ok) {
                    setTareas([]);
                    setLoading(false);
                    return;
                }
                const data = await r.json();
                setTareas(data.tareas || []);
                setLoading(false);
            })
            .catch(() => {
                setTareas([]);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchTareas();
        const handler = () => fetchTareas();
        window.addEventListener('tareas:updated', handler);
        return () => window.removeEventListener('tareas:updated', handler);
    }, []);

    if (loading || tareas === null) {
        return (
            <div className="p-4 text-sm text-gray-500">Cargando tareas…</div>
        );
    }

    return (
        <div className="p-4">
            <div className="mb-6 flex items-center justify-between">
                <h6 className="text-sm font-semibold text-gray-700">
                    Tareas asignadas{' '}
                    <span className="ml-2 text-sm text-gray-400">
                        ({tareas.length})
                    </span>
                </h6>
                <Link
                    href="/profile/tareas/completadas"
                    className="text-xs text-gray-500 underline"
                >
                    Ver historial completadas
                </Link>
            </div>

            {tareas.length === 0 ? (
                <div className="p-4 text-sm text-gray-500">
                    No hay tareas asignadas.
                </div>
            ) : (
                <div>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {tareas.map((t) => {
                            const statusColor =
                                t.status === 'pendiente'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : t.status === 'en_progreso'
                                      ? 'bg-blue-100 text-blue-800'
                                      : t.status === 'completada'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-gray-100 text-gray-800';
                            return (
                                <div
                                    key={t.id}
                                    className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                                >
                                    <div className="flex items-start justify-between gap-6">
                                        <div className="flex-1">
                                            <div className="mb-1 text-sm font-bold">
                                                {t.descripcion}
                                            </div>
                                            <div className="mb-2 text-xs text-gray-500">
                                                {t.habitacion
                                                    ? `Hab. ${t.habitacion.numero}`
                                                    : 'Sin habitación'}
                                            </div>
                                            <div
                                                className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${statusColor} uppercase`}
                                            >
                                                {(t.status || '').replace(
                                                    '_',
                                                    ' ',
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            {t.status !== 'completada' && (
                                                <>
                                                    <button
                                                        className="rounded-md bg-emerald-600 px-3 py-1 text-xs font-black text-white"
                                                        onClick={async () => {
                                                            try {
                                                                const csrf =
                                                                    document
                                                                        .querySelector(
                                                                            'meta[name="csrf-token"]',
                                                                        )
                                                                        ?.getAttribute(
                                                                            'content',
                                                                        ) || '';
                                                                const res =
                                                                    await fetch(
                                                                        `/api/tareas/${t.id}/complete`,
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
                                                                        },
                                                                    );
                                                                if (!res.ok) {
                                                                    console.error(
                                                                        'complete failed',
                                                                    );
                                                                    return;
                                                                }
                                                                window.dispatchEvent(
                                                                    new Event(
                                                                        'tareas:updated',
                                                                    ),
                                                                );
                                                            } catch (e) {
                                                                console.error(
                                                                    e,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Completar
                                                    </button>

                                                    <button
                                                        className="rounded-md border border-gray-200 px-3 py-1 text-xs font-black text-gray-700"
                                                        onClick={async () => {
                                                            try {
                                                                const csrf =
                                                                    document
                                                                        .querySelector(
                                                                            'meta[name="csrf-token"]',
                                                                        )
                                                                        ?.getAttribute(
                                                                            'content',
                                                                        ) || '';
                                                                const res =
                                                                    await fetch(
                                                                        `/api/tareas/${t.id}/cancel`,
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
                                                                        },
                                                                    );
                                                                if (!res.ok) {
                                                                    console.error(
                                                                        'cancel failed',
                                                                    );
                                                                    return;
                                                                }
                                                                window.dispatchEvent(
                                                                    new Event(
                                                                        'tareas:updated',
                                                                    ),
                                                                );
                                                            } catch (e) {
                                                                console.error(
                                                                    e,
                                                                );
                                                            }
                                                        }}
                                                    >
                                                        Desasignar
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
