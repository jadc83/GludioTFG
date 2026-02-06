import EditEmpleado from '@/Components/formularios/edit/EditEmpleado';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { EyeIcon, InboxIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

export default function IndexEmpleados({ empleados = [] }) {
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const [empleadoEditar, setEmpleadoEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    const abrirEdicion = (emp) => {
        setEmpleadoEditar(emp);
        setDrawerAbierto(true);
    };
    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setEmpleadoEditar(null);
    };

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { busqueda: '' },
        'panel',
        ['empleados'],
    );

    useEffect(() => {
        setPaginaActual(1);
    }, [empleados.length, filtros.busqueda]);

    const { empleadosPaginados, totalPaginas, inicio, fin } = useMemo(() => {
        const filtrados = empleados.filter((e) => {
            const q = filtros.busqueda?.toLowerCase?.() || '';
            if (!q) return true;
            return [
                e.name,
                e.email,
                e.numero_empleado,
                e.departamento,
                e.puesto,
            ].some((field) =>
                (field || '').toString().toLowerCase().includes(q),
            );
        });

        const totalPaginas = Math.max(
            1,
            Math.ceil(filtrados.length / itemsPorPagina),
        );
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const empleadosPaginados = filtrados.slice(inicio, fin);
        return { empleadosPaginados, totalPaginas, inicio, fin };
    }, [empleados, paginaActual, filtros.busqueda]);

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Empleados"
                subtitulo="Panel de control y gestión de empleados"
            />

            {/* Barra de búsqueda */}
            <BarraBuscador
                filtros={filtros}
                onActualizarFiltro={actualizarFiltro}
                onLimpiarFiltros={limpiarFiltros}
                placeholderBusqueda="Buscar por nombre, email, número o departamento..."
            />

            {/* TABLA DE RESULTADOS */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {empleadosPaginados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-6">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                            No se encontraron empleados
                        </h3>
                        <p className="mt-1 text-sm text-gray-400">
                            Ajusta los filtros para encontrar lo que buscas.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="responsive-table w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Empleado
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Número
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Departamento
                                        </th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Puesto
                                        </th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {empleadosPaginados.map((e) => (
                                        <tr
                                            key={e.id}
                                            className="group transition-colors hover:bg-gray-50/50"
                                        >
                                            <td
                                                className="px-6 py-4"
                                                data-label="Empleado"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-black uppercase text-gray-400">
                                                        {e.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-black uppercase tracking-tight text-gray-900">
                                                            {e.name}
                                                        </div>
                                                        <div className="font-mono text-xs text-gray-400">
                                                            {e.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className="px-6 py-4 font-mono text-sm font-medium text-gray-700"
                                                data-label="Número"
                                            >
                                                {e.numero_empleado}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-sm font-bold uppercase tracking-tight text-gray-700"
                                                data-label="Departamento"
                                            >
                                                {e.departamento || '—'}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-[11px] text-sm font-bold uppercase text-gray-600"
                                                data-label="Puesto"
                                            >
                                                {e.puesto || '—'}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right"
                                                data-label="Acciones"
                                            >
                                                <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600">
                                                        <EyeIcon className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            abrirEdicion(e)
                                                        }
                                                        className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-[#7a0202]"
                                                    >
                                                        <PencilIcon className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <Paginacion
                            paginaActual={paginaActual}
                            totalPaginas={totalPaginas}
                            inicio={inicio}
                            fin={fin}
                            total={empleados.length}
                            onCambiarPagina={setPaginaActual}
                            etiqueta="Empleados"
                        />
                    </>
                )}
            </div>
            <EditEmpleado
                empleado={empleadoEditar}
                abierto={drawerAbierto}
                onCerrar={cerrarEdicion}
            />
        </div>
    );
}
