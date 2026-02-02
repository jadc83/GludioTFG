import Badge from '@/Components/UI/Badge';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import Paginacion from '@/Components/UI/Paginacion';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { TicketIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

export default function TabCupones({ cupones = {} }) {
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { busqueda: '', estado: 'todos', tipo: 'todos' },
        'panel',
        ['cupones'],
    );

    const cuponesData = cupones.data || [];

    useEffect(() => {
        setPaginaActual(1);
    }, [cuponesData.length, filtros.busqueda, filtros.estado, filtros.tipo]);

    const handleDelete = (id) => {
        if (!confirm('¿Eliminar este cupón?')) return;

        router.delete(route('cupones.destroy', id));
    };

    const handleToggle = (id) => {
        router.post(route('cupones.toggle', id));
    };

    const getEstadoBadge = (cupon) => {
        if (!cupon.activo) {
            return <Badge label="Inactivo" tipo="inactivo" />;
        }

        const ahora = new Date();
        const inicio = new Date(cupon.fecha_inicio);
        const fin = new Date(cupon.fecha_fin);

        if (ahora < inicio) {
            return <Badge label="Próximo" tipo="proximo" />;
        }
        if (ahora > fin) {
            return <Badge label="Expirado" tipo="expirado" />;
        }
        return <Badge label="Activo" tipo="activo" />;
    };

    const getValorTexto = (cupon) => {
        return cupon.tipo === 'porcentaje'
            ? `${cupon.valor}%`
            : `${cupon.valor}€`;
    };

    const getEstadoCupon = (cupon) => {
        if (!cupon.activo) return 'inactivo';
        const ahora = new Date();
        const inicio = new Date(cupon.fecha_inicio);
        const fin = new Date(cupon.fecha_fin);
        if (ahora < inicio) return 'proximo';
        if (ahora > fin) return 'expirado';
        return 'activo';
    };

    const { cuponesPaginados, cuponesFiltrados, totalPaginas, inicio, fin } =
        useMemo(() => {
            const filtrados = cuponesData.filter((cupon) => {
                if (filtros.busqueda) {
                    const q = filtros.busqueda.toLowerCase();
                    const coincide = [cupon.codigo, cupon.descripcion].some(
                        (field) =>
                            (field || '').toString().toLowerCase().includes(q),
                    );
                    if (!coincide) return false;
                }

                if (filtros.estado && filtros.estado !== 'todos') {
                    if (getEstadoCupon(cupon) !== filtros.estado) return false;
                }

                if (filtros.tipo && filtros.tipo !== 'todos') {
                    if (cupon.tipo !== filtros.tipo) return false;
                }

                return true;
            });

            const totalPaginas = Math.ceil(filtrados.length / itemsPorPagina);
            const inicio = (paginaActual - 1) * itemsPorPagina;
            const fin = inicio + itemsPorPagina;
            const cuponesPaginados = filtrados.slice(inicio, fin);
            return {
                cuponesPaginados,
                cuponesFiltrados: filtrados,
                totalPaginas,
                inicio,
                fin,
            };
        }, [cuponesData, paginaActual, filtros]);

    return (
        <div className="space-y-6">
            {/* Barra de búsqueda */}
            <BarraBuscador
                filtros={filtros}
                onActualizarFiltro={actualizarFiltro}
                onLimpiarFiltros={limpiarFiltros}
                placeholderBusqueda="Buscar por código o descripción..."
                filtrosAdicionales={[
                    {
                        tipo: 'select',
                        nombre: 'estado',
                        opciones: [
                            { valor: 'todos', etiqueta: 'Todos los estados' },
                            { valor: 'activo', etiqueta: 'Activo' },
                            { valor: 'inactivo', etiqueta: 'Inactivo' },
                            { valor: 'expirado', etiqueta: 'Expirado' },
                            { valor: 'proximo', etiqueta: 'Próximo' },
                        ],
                    },
                    {
                        tipo: 'select',
                        nombre: 'tipo',
                        opciones: [
                            { valor: 'todos', etiqueta: 'Todos los tipos' },
                            { valor: 'porcentaje', etiqueta: 'Porcentaje' },
                            { valor: 'monto', etiqueta: 'Monto Fijo' },
                        ],
                    },
                ]}
            />

            {/* --- TABLA DE CUPONES --- */}
            <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                {cuponesFiltrados.length === 0 ? (
                    <div className="p-12 text-center">
                        <TicketIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
                        <p className="font-medium text-gray-500">
                            {cuponesData.length === 0
                                ? 'No hay cupones registrados'
                                : 'Sin resultados'}
                        </p>
                        <p className="mt-1 text-sm text-gray-400">
                            {cuponesData.length === 0
                                ? 'Crea el primero para comenzar'
                                : 'No hay cupones que coincidan con los filtros aplicados'}
                        </p>
                        {cuponesData.length > 0 && (
                            <button
                                onClick={limpiarFiltros}
                                className="mt-6 text-xs font-black uppercase tracking-widest text-[#7a0202] hover:underline"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="border-b border-gray-100 bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                        Código
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                        Valor
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                        Usos
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                        Válido Hasta
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left font-semibold text-gray-700">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {cuponesPaginados.map((cupon) => (
                                    <tr
                                        key={cupon.id}
                                        className="transition-colors hover:bg-gray-50"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="font-mono text-base font-bold text-[#7a0202]">
                                                {cupon.codigo}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                {cupon.tipo === 'porcentaje'
                                                    ? 'Porcentaje'
                                                    : 'Monto Fijo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900">
                                            {getValorTexto(cupon)}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {cupon.usos_realizados}/
                                            {cupon.usos_maximos || '∞'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(
                                                cupon.fecha_fin,
                                            ).toLocaleDateString('es-ES')}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getEstadoBadge(cupon)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setFormData(cupon);
                                                        setEditingId(cupon.id);
                                                        setShowForm(true);
                                                    }}
                                                    className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleToggle(cupon.id)
                                                    }
                                                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                        cupon.activo
                                                            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                            : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                    }`}
                                                >
                                                    {cupon.activo
                                                        ? 'Desactivar'
                                                        : 'Activar'}
                                                </button>
                                                {cupon.usos_realizados ===
                                                    0 && (
                                                    <button
                                                        onClick={() =>
                                                            handleDelete(
                                                                cupon.id,
                                                            )
                                                        }
                                                        className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-200"
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Paginación */}
                {cuponesFiltrados.length > 0 && (
                    <Paginacion
                        paginaActual={paginaActual}
                        totalPaginas={totalPaginas}
                        inicio={inicio}
                        fin={fin}
                        total={cuponesFiltrados.length}
                        onCambiarPagina={setPaginaActual}
                        etiqueta="Cupones"
                    />
                )}
            </div>
        </div>
    );
}
