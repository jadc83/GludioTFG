import EditCliente from '@/Components/formularios/edit/EditCliente';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import { InboxIcon } from '@heroicons/react/24/outline';
import { useEffect, useMemo, useState } from 'react';
import useIndexCliente from '@/hooks/useIndexCliente';
import ClientesTable from '@/Components/indexes/ClientesTable';

export default function IndexCliente({ clientes = [], users = [], clientesFiltrados = [] }) {
    const {
        clienteEditar,
        drawerAbierto,
        abrirEdicion,
        cerrarEdicion,
        paginaActual,
        setPaginaActual,
        filtros,
        actualizarFiltro,
        limpiarFiltros,
        clientesPaginados,
        totalPaginas,
        inicio,
        fin,
        noHayClientesEnAbsoluto,
        todosLosRegistros,
    } = useIndexCliente({ clientes, users, clientesFiltrados });

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
                        <ClientesTable clientes={clientesPaginados} abrirEdicion={abrirEdicion} />

                        {/* Paginación */}
                        <Paginacion paginaActual={paginaActual} totalPaginas={totalPaginas} inicio={inicio} fin={fin} total={todosLosRegistros.length} onCambiarPagina={setPaginaActual} etiqueta="Clientes" />
                    </>
                )}
            </div>

            <EditCliente cliente={clienteEditar} abierto={drawerAbierto} onCerrar={cerrarEdicion} />
        </div>
    );
}
