import EditCliente from '@/Components/formularios/edit/EditCliente';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import {
    EyeIcon,
    InboxIcon,
    PencilIcon,
    StarIcon,
} from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';

export default function IndexCliente({
    clientes = [],
    users = [],
    clientesFiltrados = [],
}) {
    // props recibidas
    const [clienteEditar, setClienteEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { tipo_documento: 'todos', busqueda: '' },
        'panel',
        ['clientes', 'clientesFiltrados'],
    );

    const todosLosRegistros = clientesFiltrados;

    useEffect(() => {
        setPaginaActual(1);
    }, [todosLosRegistros.length, filtros.tipo_documento, filtros.busqueda]);

    const abrirEdicion = (cliente) => {
        setClienteEditar(cliente);
        setDrawerAbierto(true);
    };
    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setClienteEditar(null), 300);
    };

    // --- LÓGICA DE PAGINACIÓN ---
    const { clientesPaginados, totalPaginas, inicio, fin } = useMemo(() => {
        const totalPaginas = Math.ceil(
            todosLosRegistros.length / itemsPorPagina,
        );
        const inicio = (paginaActual - 1) * itemsPorPagina;
        const fin = inicio + itemsPorPagina;
        const clientesPaginados = todosLosRegistros.slice(inicio, fin);
        return { clientesPaginados, totalPaginas, inicio, fin };
    }, [todosLosRegistros, paginaActual]);

    const noHayClientesEnAbsoluto = clientes.length === 0 && users.length === 0;

    return (
        <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
            <HeaderPanel
                titulo="Clientes"
                subtitulo="Directorio y gestión de clientes"
                role="region"
                aria-label="Panel clientes"
            />

            {/* Barra de filtros */}
            <BarraBuscador
                filtros={filtros}
                onActualizarFiltro={actualizarFiltro}
                onLimpiarFiltros={limpiarFiltros}
                placeholderBusqueda="Buscar por nombre, email o documento..."
                filtrosAdicionales={[
                    {
                        tipo: 'select',
                        nombre: 'tipo_documento',
                        opciones: [
                            {
                                valor: 'todos',
                                etiqueta: 'Todos los documentos',
                            },
                            { valor: 'dni', etiqueta: 'DNI' },
                            { valor: 'pasaporte', etiqueta: 'Pasaporte' },
                            { valor: 'tie', etiqueta: 'TIE' },
                        ],
                    },
                ]}
            />

            {/* --- CONTENEDOR DE TABLA --- */}
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                {noHayClientesEnAbsoluto || todosLosRegistros.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-6">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                            No se encontraron clientes
                        </h3>
                        <p className="mt-1 max-w-xs text-sm text-gray-400">
                            Ajusta los filtros o crea un nuevo registro para
                            comenzar.
                        </p>
                        {todosLosRegistros.length === 0 &&
                            !noHayClientesEnAbsoluto && (
                                <button
                                    onClick={limpiarFiltros}
                                    className="mt-6 text-xs font-black uppercase tracking-widest text-[#7a0202] hover:underline"
                                >
                                    Limpiar Búsqueda
                                </button>
                            )}
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table
                                className="responsive-table w-full border-collapse text-left"
                                role="table"
                                aria-label="Tabla de clientes"
                            >
                                <caption className="sr-only">
                                    Listado de clientes
                                </caption>
                                <thead>
                                    <tr className="border-b border-gray-100 bg-gray-50/50">
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                                        >
                                            Nombre
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                                        >
                                            Email
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                                        >
                                            Documento
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                                        >
                                            Teléfono
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                                        >
                                            Dirección
                                        </th>
                                        <th
                                            scope="col"
                                            className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400"
                                        >
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {clientesPaginados.map((cliente) => (
                                        <tr
                                            key={`${cliente.tipo_usuario}-${cliente.id}`}
                                            className="group transition-colors hover:bg-gray-50/50"
                                        >
                                            <td
                                                className="px-6 py-4"
                                                data-label="Nombre"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-xs font-black text-gray-400">
                                                        {cliente.name.charAt(0)}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">
                                                            {cliente.name}
                                                        </span>
                                                        {cliente.tipo_usuario ===
                                                            'usuario' && (
                                                            <StarIcon className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className="px-6 py-4"
                                                data-label="Email"
                                            >
                                                <span className="font-mono text-xs text-gray-400">
                                                    {cliente.email}
                                                </span>
                                            </td>
                                            <td
                                                className="px-6 py-4"
                                                data-label="Documento"
                                            >
                                                {cliente.tipo_documento ? (
                                                    <div className="flex flex-col">
                                                        <span className="mb-1 text-[10px] font-bold uppercase leading-none text-[#7a0202]">
                                                            {
                                                                cliente.tipo_documento
                                                            }
                                                        </span>
                                                        <span className="font-mono text-sm font-medium tracking-tighter text-gray-700">
                                                            {
                                                                cliente.numero_documento
                                                            }
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold uppercase text-gray-300">
                                                        Sin Documento
                                                    </span>
                                                )}
                                            </td>
                                            <td
                                                className="px-6 py-4"
                                                data-label="Teléfono"
                                            >
                                                <div className="text-sm font-bold text-gray-700">
                                                    {cliente.telefono || '—'}
                                                </div>
                                            </td>
                                            <td
                                                className="px-6 py-4"
                                                data-label="Dirección"
                                            >
                                                <div className="max-w-[150px] truncate text-[10px] font-bold uppercase text-gray-400">
                                                    {cliente.direccion ||
                                                        'No hay dirección'}
                                                </div>
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
                                                            abrirEdicion(
                                                                cliente,
                                                            )
                                                        }
                                                        className="rounded-lg bg-gray-50 p-2 text-gray-400 transition hover:bg-red-50 hover:text-[#7a0202]"
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
                            total={todosLosRegistros.length}
                            onCambiarPagina={setPaginaActual}
                            etiqueta="Clientes"
                        />
                    </>
                )}
            </div>

            <EditCliente
                cliente={clienteEditar}
                abierto={drawerAbierto}
                onCerrar={cerrarEdicion}
            />
        </div>
    );
}
