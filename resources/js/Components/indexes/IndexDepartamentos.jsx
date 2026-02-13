import ShowDepartamento from '@/Components/formularios/show/ShowDepartamento';
import IndexEmpleados from '@/Components/indexes/IndexEmpleados';
import { usePage } from '@inertiajs/react';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import { InboxIcon } from '@heroicons/react/24/outline';
import { useMemo, useState } from 'react';
import useIndexDepartamentos from '@/hooks/useIndexDepartamentos';
import EmptyState from '@/Components/UI/EmptyState';
import TableWrapper from '@/Components/UI/TableWrapper';
import DepartmentRow from '@/Components/indexes/DepartmentRow';

export default function IndexDepartamentos({ empleados = [] }) {
    const { props } = usePage();
    const roles = props?.auth?.user?.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes('admin');
    const {
        departamentos,
        departamentoSeleccionado,
        drawerAbierto,
        abrirDetalle,
        cerrarDetalle,
        departamentosPaginados,
        inicio,
        fin,
        totalPaginas,
    } = useIndexDepartamentos();

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Departamentos"
                subtitulo="Gestión de Departamentos"
            />

            {departamentos.length === 0 ? (
                <EmptyState Icon={InboxIcon} title="No hay departamentos" subtitle="Crea departamentos mediante seeders o el panel." />
            ) : (
                <>
                    <TableWrapper caption="Departamentos">
                        <thead>
                            <tr className="border-b border-gray-100 bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Nombre</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {departamentosPaginados.map((d) => (
                                <DepartmentRow key={d.id} departamento={d} onView={abrirDetalle} />
                            ))}
                        </tbody>
                    </TableWrapper>
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
