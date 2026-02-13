import EditEmpleado from '@/Components/formularios/edit/EditEmpleado';
import ShowEmpleado from '@/Components/formularios/show/ShowEmpleado';
import ControlesFiltros from '@/Components/UI/ControlesFiltros';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { InboxIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import EstadoVacio from '@/Components/UI/EstadoVacio';
import TablaContenedor from '@/Components/UI/TablaContenedor';
import FilaEmpleado from '@/Components/indexes/FilaEmpleado';

export default function IndexEmpleados({ empleados = [], embedded = false }) {
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const [empleadoEditar, setEmpleadoEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    // Show empleado (detalle)
    const [empleadoDetalle, setEmpleadoDetalle] = useState(null);
    const [detalleAbierto, setDetalleAbierto] = useState(false);

    const abrirEdicion = (emp) => {
        setEmpleadoEditar(emp);
        setDrawerAbierto(true);
    };
    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setEmpleadoEditar(null);
    };

    const abrirDetalle = (emp) => {
        // Abrir el drawer de detalle (no redirigir al profile)
        setEmpleadoDetalle(emp);
        setDetalleAbierto(true);
    };
    const cerrarDetalle = () => {
        setDetalleAbierto(false);
        setEmpleadoDetalle(null);
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
            return [e.name, e.email, e.departamento].some((field) =>
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

    if (embedded) {
        return (
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                            Empleados
                        </h3>
                        <p className="text-xs text-gray-400">
                            Miembros del equipo
                        </p>
                    </div>
                    <div>
                        {/* keep create button? using existing CreateEmpleado in panel actions */}
                    </div>
                </div>

                {/* Barra de búsqueda */}
                <ControlesFiltros
                    filtros={filtros}
                    onActualizarFiltro={actualizarFiltro}
                    onLimpiarFiltros={limpiarFiltros}
                    placeholderBusqueda="Buscar por nombre, email o departamento..."
                />

                <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                    {empleadosPaginados.length === 0 ? (
                        <EstadoVacio Icon={InboxIcon} title="No se encontraron empleados" subtitle="Ajusta los filtros para encontrar lo que buscas." />
                    ) : (
                        <>
                            <TablaContenedor caption="Empleados">
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Empleado</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Departamento</th>
                                        <th className="px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Rol</th>
                                        <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {empleadosPaginados.map((e) => (
                                        <FilaEmpleado key={e.id} empleado={e} onView={abrirDetalle} onEdit={abrirEdicion} />
                                    ))}
                                </tbody>
                            </TablaContenedor>

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
                <ShowEmpleado
                    empleado={empleadoDetalle}
                    abierto={detalleAbierto}
                    onCerrar={cerrarDetalle}
                />
            </div>
        );
    }

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
                placeholderBusqueda="Buscar por nombre, email o departamento..."
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
                                            Departamento
                                        </th>
                                        <th className="px-6 py-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-400">
                                            Rol
                                        </th>{' '}
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
                                                className="px-6 py-4 text-sm font-bold uppercase tracking-tight text-gray-700"
                                                data-label="Departamento"
                                            >
                                                {e.departamento || '—'}
                                            </td>

                                            <td
                                                className="px-6 py-4 text-sm font-medium uppercase tracking-tight text-gray-700"
                                                data-label="Rol"
                                            >
                                                {e.role ||
                                                (Array.isArray(e.roles)
                                                    ? e.roles[0]
                                                    : null)
                                                    ? (
                                                          e.role ||
                                                          (Array.isArray(
                                                              e.roles,
                                                          )
                                                              ? e.roles[0]
                                                              : null)
                                                      ).toUpperCase()
                                                    : '—'}
                                            </td>
                                            <td
                                                className="px-6 py-4 text-right"
                                                data-label="Acciones"
                                            >
                                                <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <button
                                                        onClick={() =>
                                                            abrirDetalle(e)
                                                        }
                                                        className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                                                    >
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
            <ShowEmpleado
                empleado={empleadoDetalle}
                abierto={detalleAbierto}
                onCerrar={cerrarDetalle}
            />
        </div>
    );
}
