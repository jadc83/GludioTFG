import HeaderPanel from '@/Components/UI/HeaderPanel';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function CompletedTasks({ tareas = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Historial de Tareas" />

            <div className="perfil-page">
                <div className="mx-auto max-w-6xl">
                    <HeaderPanel
                        titulo="Tareas completadas"
                        subtitulo="Historial de tareas completadas por ti"
                    />

                    <div className="mt-6 space-y-4">
                        <div className="rounded-xl border border-gray-100 bg-white p-4">
                            {tareas.length === 0 ? (
                                <div className="p-6 text-sm text-gray-500">
                                    No hay tareas completadas.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {tareas.map((t) => (
                                        <div
                                            key={t.id}
                                            className="rounded-lg border border-gray-100 p-3"
                                        >
                                            <div className="font-black">
                                                {t.descripcion}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {t.habitacion
                                                    ? `Hab. ${t.habitacion.numero}`
                                                    : 'Sin habitación'}
                                            </div>
                                            <div className="mt-2 text-xs text-gray-400">
                                                {t.duration
                                                    ? `Duración: ${t.duration}`
                                                    : ''}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <Link
                                href="/profile?tab=tareas"
                                className="rounded-md bg-[#920303] px-4 py-2 font-black text-white"
                            >
                                Volver a Tareas
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
