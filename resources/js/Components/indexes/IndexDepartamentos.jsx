import ShowDepartamento from '@/Components/formularios/show/ShowDepartamento';
import IndexEmpleados from '@/Components/indexes/IndexEmpleados';
import { usePage } from '@inertiajs/react';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import { EyeIcon, InboxIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

export default function IndexDepartamentos({ empleados = [] }) {
    const { props } = usePage();
    const roles = props?.auth?.user?.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes('admin');
    const [departamentos, setDepartamentos] = useState([]);

    const [departamentoSeleccionado, setDepartamentoSeleccionado] =
        useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    useEffect(() => {
        fetch('/api/departamentos', { credentials: 'same-origin' })
            .then((r) => r.json())
            .then((data) => setDepartamentos(Array.isArray(data) ? data : []))
            .catch(() => setDepartamentos([]));
    }, []);

    const abrirDetalle = (dep) => {
        setDepartamentoSeleccionado(dep);
        setDrawerAbierto(true);
    };
    const cerrarDetalle = () => {
        setDepartamentoSeleccionado(null);
        setDrawerAbierto(false);
    };

    // Mostrar todos los departamentos sin paginación
    const departamentosPaginados = departamentos;
    const inicio = departamentos.length > 0 ? 1 : 0;
    const fin = departamentos.length;
    const totalPaginas = 1;

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Departamentos"
                subtitulo="Gestión de Departamentos"
            />

            {departamentos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="mb-4 rounded-full bg-gray-50 p-6">
                        <InboxIcon className="h-12 w-12 text-gray-300" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                        No hay departamentos
                    </h3>
                    <p className="mt-1 text-sm text-gray-400">
                        Crea departamentos mediante seeders o el panel.
                    </p>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="responsive-table w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {departamentosPaginados.map((d) => (
                                    <tr
                                        key={d.id}
                                        className="group transition-colors hover:bg-gray-50/50"
                                    >
                                        <td
                                            className="px-6 py-4"
                                            data-label="Nombre"
                                        >
                                            <div className="text-sm font-black uppercase tracking-tight text-gray-900">
                                                {d.name}
                                            </div>
                                        </td>
                                        <td
                                            className="px-6 py-4 text-right"
                                            data-label="Acciones"
                                        >
                                            <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                <button
                                                    onClick={() =>
                                                        abrirDetalle(d)
                                                    }
                                                    className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                                                >
                                                    <EyeIcon className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación eliminada: se muestran todos los departamentos */}
                </>
            )}

            <ShowDepartamento
                departamento={departamentoSeleccionado}
                abierto={drawerAbierto}
                onCerrar={cerrarDetalle}
            />

            {/* Empleados: tabla embebida dentro de Departamentos */}
            <div className="mt-12">
                {isAdmin && <IndexEmpleados empleados={empleados} embedded />}
            </div>
        </div>
    );
}
