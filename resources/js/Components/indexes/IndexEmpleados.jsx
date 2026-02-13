import EditEmpleado from '@/Components/formularios/edit/EditEmpleado';
import ShowEmpleado from '@/Components/formularios/show/ShowEmpleado';
import ControlesFiltros from '@/Components/UI/ControlesFiltros';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import useIndexEmpleados from '@/hooks/useIndexEmpleados';
import { router } from '@inertiajs/react';
import { InboxIcon } from '@heroicons/react/24/outline';
import EstadoVacio from '@/Components/UI/EstadoVacio';
import TablaContenedor from '@/Components/UI/TablaContenedor';
import FilaEmpleado from '@/Components/indexes/FilaEmpleado';

export default function IndexEmpleados({ empleados = [], embedded = false }) {
    const {
        paginaActual,
        setPaginaActual,
        itemsPorPagina,
        filtros,
        actualizarFiltro,
        limpiarFiltros,
        empleadosPaginados,
        totalPaginas,
        inicio,
        fin,
        empleadoEditar,
        abrirEdicion,
        cerrarEdicion,
        drawerAbierto,
        empleadoDetalle,
        detalleAbierto,
        abrirDetalle,
        cerrarDetalle,
    } = useIndexEmpleados({ empleados });

    const viewEmpleado = (empleado) => {
        try {
            router.visit(`/empleados/${empleado.id}`);
        } catch (e) {
            window.location.href = `/empleados/${empleado.id}`;
        }
    };

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
                                        <FilaEmpleado key={e.id} empleado={e} onView={viewEmpleado} onEdit={abrirEdicion} />
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
            <ControlesFiltros
                filtros={filtros}
                onActualizarFiltro={actualizarFiltro}
                onLimpiarFiltros={limpiarFiltros}
                placeholderBusqueda="Buscar por nombre, email o departamento..."
            />

            {/* TABLA DE RESULTADOS */}
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
                                    <FilaEmpleado key={e.id} empleado={e} onView={viewEmpleado} onEdit={abrirEdicion} />
                                ))}
                            </tbody>
                        </TablaContenedor>

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
