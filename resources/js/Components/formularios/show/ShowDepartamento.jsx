import { XMarkIcon } from '@heroicons/react/24/outline';
import { useEffect, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';

export default function ShowDepartamento({ departamento, abierto, onCerrar }) {
    const [detalleDepartamento, setDetalleDepartamento] = useState(null);

    useEffect(() => {
        if (departamento && abierto) {
            fetch(`/api/departamentos/${departamento.id}`, {
                credentials: 'same-origin',
            })
                .then((r) => r.json())
                .then((data) => setDetalleDepartamento(data))
                .catch(() => setDetalleDepartamento(null));
        } else {
            setDetalleDepartamento(null);
        }
    }, [departamento, abierto]);

    const abrirPerfilEmpleado = (empleado) => {
        // Redirigir a /profile?user_id=... para abrir el perfil de usuario
        const userId = empleado?.user_id || empleado?.userId || empleado?.user?.id;
        if (!userId) return;
        Inertia.get('/profile', { user_id: userId });
    };

    const obtenerEncargado = (listaEmpleados = []) => {
        if (!Array.isArray(listaEmpleados)) return null;
        // Buscar por role 'encargado' o 'manager'
        return (
            listaEmpleados.find((e) => (e.role || '').toLowerCase() === 'encargado') ||
            listaEmpleados.find((e) => (Array.isArray(e.roles) && e.roles.includes('encargado'))) ||
            null
        );
    };

    const separarPorRoles = (listaEmpleados = []) => {
        const operarios = [];
        const auxiliares = [];
        (listaEmpleados || []).forEach((e) => {
            const rol = (e.role || '').toString().toLowerCase();
            const rolesArr = Array.isArray(e.roles) ? e.roles.map((r) => r.toString().toLowerCase()) : [];
            if (rol === 'operario' || rolesArr.includes('operario')) {
                operarios.push(e);
            } else if (rol === 'auxiliar' || rolesArr.includes('auxiliar')) {
                auxiliares.push(e);
            }
        });
        return { operarios, auxiliares };
    };

    const encargado = obtenerEncargado(detalleDepartamento?.empleados || []);
    const { operarios, auxiliares } = separarPorRoles(detalleDepartamento?.empleados || []);

    return (
        <div
            className={`fixed inset-0 z-[9999] transition-all duration-300 ${abierto ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        >
            <div
                className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${abierto ? 'opacity-100' : 'opacity-0'}`}
                onClick={onCerrar}
                role="button"
                tabIndex={0}
                aria-label="Cerrar"
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onCerrar();
                    }
                    if (e.key === 'Escape') {
                        e.preventDefault();
                        onCerrar();
                    }
                }}
            />

            <div
                className={`absolute bottom-0 right-0 top-0 flex w-full max-w-md transform flex-col bg-white shadow-2xl transition-transform duration-500 ease-in-out ${abierto ? 'translate-x-0' : 'translate-x-full'} overflow-hidden !rounded-l-[2rem]`}
            >
                <header className="flex flex-none items-center justify-between border-b border-gray-100 bg-white p-6">
                    <div>
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                            {detalleDepartamento?.name || departamento?.name || 'Departamento'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            {detalleDepartamento?.descripcion || detalleDepartamento?.description || 'Descripción no disponible.'}
                        </p>
                        <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Encargado: {encargado ? encargado.name : '—'}
                        </p>
                    </div>
                    <button
                        onClick={onCerrar}
                        className="rounded-2xl border border-gray-100 bg-gray-50 p-3 text-gray-400 shadow-sm transition-all hover:bg-red-50 hover:text-[#7a0202]"
                    >
                        <XMarkIcon className="h-6 w-6" />
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-6">
                    {!detalleDepartamento ? (
                        <div className="p-6 text-sm text-gray-500">Cargando...</div>
                    ) : (
                        <div className="space-y-6">
                            <div>
                                <h4 className="text-sm font-black uppercase text-gray-700">Operarios</h4>
                                {operarios.length === 0 ? (
                                    <div className="text-sm text-gray-500">No hay operarios en este departamento.</div>
                                ) : (
                                    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
                                        <table className="w-full text-left table-fixed">
                                            <thead>
                                                <tr className="bg-gray-50 text-[10px] text-gray-400">
                                                    <th className="px-4 py-2 w-56">Nombre</th>
                                                    <th className="px-4 py-2 w-24 text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {operarios.map((e) => (
                                                    <tr key={e.id} className="border-t">
                                                        <td className="px-4 py-2 font-semibold text-sm truncate w-56 whitespace-nowrap overflow-hidden" title={e.name}>{e.name}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button
                                                                onClick={() => abrirPerfilEmpleado(e)}
                                                                className="rounded-lg bg-blue-600 px-3 py-1 text-white text-sm"
                                                            >
                                                                Ver perfil
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="text-sm font-black uppercase text-gray-700">Auxiliares</h4>
                                {auxiliares.length === 0 ? (
                                    <div className="text-sm text-gray-500">No hay auxiliares en este departamento.</div>
                                ) : (
                                    <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100 bg-white shadow-sm">
                                        <table className="w-full text-left table-fixed">
                                            <thead>
                                                <tr className="bg-gray-50 text-[10px] text-gray-400">
                                                    <th className="px-4 py-2 w-56">Nombre</th>
                                                    <th className="px-4 py-2 w-24 text-right">Acción</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {auxiliares.map((e) => (
                                                    <tr key={e.id} className="border-t">
                                                        <td className="px-4 py-2 font-semibold text-sm truncate w-56 whitespace-nowrap overflow-hidden" title={e.name}>{e.name}</td>
                                                        <td className="px-4 py-2 text-right">
                                                            <button
                                                                onClick={() => abrirPerfilEmpleado(e)}
                                                                className="rounded-lg bg-blue-600 px-3 py-1 text-white text-sm"
                                                            >
                                                                Ver perfil
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Navegación al perfil realiza la redirección; no renderizamos drawer aquí */}
        </div>
    );
}
