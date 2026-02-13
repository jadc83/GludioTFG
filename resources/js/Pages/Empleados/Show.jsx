import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Link } from '@inertiajs/react';

export default function ShowEmpleadoPage({ empleado }) {
    const usuario = empleado?.user || {};
    return (
        <AuthenticatedLayout>
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tight">
                            {usuario.name || empleado.name || 'Empleado'}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Perfil del empleado
                        </p>
                    </div>
                    <div>
                        <Link
                            href="/panel"
                            className="rounded-md border border-gray-200 bg-white px-3 py-1 text-sm"
                        >
                            Volver al panel
                        </Link>
                    </div>
                </div>

                <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase">Nombre</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">{usuario.name || empleado.name || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase">Email</dt>
                            <dd className="mt-1 text-sm text-gray-700">{usuario.email || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase">Departamento</dt>
                            <dd className="mt-1 text-sm text-gray-700">{empleado.departamento || '—'}</dd>
                        </div>
                        <div>
                            <dt className="text-xs font-bold text-gray-500 uppercase">Rol</dt>
                            <dd className="mt-1 text-sm text-gray-700">{empleado.role || (Array.isArray(empleado.roles) ? empleado.roles.join(', ') : '—')}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
