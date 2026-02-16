import Badge from '@/Components/UI/Badge';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import Paginacion from '@/Components/UI/Paginacion';
import { useFiltrosPanel } from '@/hooks/useFiltrosPanel';
import { TicketIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';

export default function TabCupones({ cupones = {} }) {
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    // Estados para edición de cupones (evitar error setFormData no definido)
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const { props } = usePage();
    const roles = props?.auth?.user?.roles || [];
    const isAdmin = Array.isArray(roles) && roles.includes('admin');

    const { filtros, actualizarFiltro, limpiarFiltros } = useFiltrosPanel(
        { busqueda: '', estado: 'todos', tipo: 'todos' },
        'panel',
        ['cupones'],
    );

    const cuponesData = useMemo(() => cupones?.data || [], [cupones?.data]);

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

        // Handlers del formulario de edición
        const abrirEditor = (cupon) => {
            setFormData({
                ...cupon,
                fecha_inicio: cupon.fecha_inicio ? cupon.fecha_inicio.split('T')[0] : '',
                fecha_fin: cupon.fecha_fin ? cupon.fecha_fin.split('T')[0] : '',
            });
            setEditingId(cupon.id);
            setShowForm(true);
        };

        const cerrarEditor = () => {
            setShowForm(false);
            setEditingId(null);
            setFormData({});
        };

        const handleFormChange = (e) => {
            const { name, value, type, checked } = e.target;
            setFormData((prev) => ({
                ...prev,
                [name]: type === 'checkbox' ? checked : value,
            }));
        };

        const submitEdit = (e) => {
            e.preventDefault();
            if (!editingId) return;
            // Usar Inertia router para enviar PUT
            router.put(route('cupones.update', editingId), formData, {
                onSuccess: () => {
                    cerrarEditor();
                },
            });
        };

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
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                {cuponesFiltrados.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 text-center">
                        <TicketIcon className="mb-4 h-12 w-12 text-gray-300" />
                        <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
                            {cuponesData.length === 0
                                ? 'No hay cupones registrados'
                                : 'Sin resultados'}
                        </h3>
                        <p className="mt-2 max-w-xs text-sm text-gray-400">
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
                        <table className="responsive-table w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Código
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Valor
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Usos
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Válido Hasta
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Estado
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {cuponesPaginados.map((cupon) => (
                                    <tr
                                        key={cupon.id}
                                        className="group transition-colors hover:bg-gray-50/50"
                                    >
                                        <td
                                            className="px-6 py-6"
                                            data-label="Código"
                                        >
                                            <span className="font-mono text-base font-bold text-[#7a0202]">
                                                {cupon.codigo}
                                            </span>
                                        </td>
                                        <td
                                            className="px-6 py-6"
                                            data-label="Tipo"
                                        >
                                            <span className="inline-block rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                                                {cupon.tipo === 'porcentaje'
                                                    ? 'Porcentaje'
                                                    : 'Monto Fijo'}
                                            </span>
                                        </td>
                                        <td
                                            className="px-6 py-6 font-semibold text-gray-900"
                                            data-label="Valor"
                                        >
                                            {getValorTexto(cupon)}
                                        </td>
                                        <td
                                            className="px-6 py-6 text-gray-600"
                                            data-label="Usos"
                                        >
                                            {cupon.usos_realizados}/
                                            {cupon.usos_maximos || '∞'}
                                        </td>
                                        <td
                                            className="px-6 py-6 text-gray-600"
                                            data-label="Válido Hasta"
                                        >
                                            {new Date(
                                                cupon.fecha_fin,
                                            ).toLocaleDateString('es-ES')}
                                        </td>
                                        <td
                                            className="px-6 py-6"
                                            data-label="Estado"
                                        >
                                            {getEstadoBadge(cupon)}
                                        </td>
                                        <td
                                            className="px-6 py-6"
                                            data-label="Acciones"
                                        >
                                            <div className="flex gap-2">
                                                {isAdmin ? (
                                                    <>
                                                        <button
                                                            onClick={() => abrirEditor(cupon)}
                                                            className="rounded-lg bg-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-200"
                                                        >
                                                            Editar
                                                        </button>

                                                        <button
                                                            onClick={() => handleToggle(cupon.id)}
                                                            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                                                                cupon.activo
                                                                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                                                                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                                            }`}
                                                        >
                                                            {cupon.activo ? 'Desactivar' : 'Activar'}
                                                        </button>

                                                        {cupon.usos_realizados === 0 && (
                                                            <button
                                                                onClick={() => handleDelete(cupon.id)}
                                                                className="rounded-lg bg-rose-100 px-3 py-1.5 text-xs font-medium text-rose-700 transition-colors hover:bg-rose-200"
                                                            >
                                                                Eliminar
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <span className="text-xs text-gray-400">Solo administradores</span>
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

            {/* Modal de edición */}
            {showForm && (
                <div>
                    <div className="modal-overlay" onClick={cerrarEditor} />
                    <div className="modal-wrapper">
                        <form onSubmit={submitEdit} className="p-6">
                            <h3 className="mb-4 text-lg font-semibold">Editar cupón</h3>

                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Código</label>
                                    <input name="codigo" value={formData.codigo || ''} onChange={handleFormChange} className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Descripción</label>
                                    <textarea name="descripcion" value={formData.descripcion || ''} onChange={handleFormChange} className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tipo</label>
                                        <select name="tipo" value={formData.tipo || 'monto'} onChange={handleFormChange} className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm">
                                            <option value="porcentaje">Porcentaje</option>
                                            <option value="monto">Monto Fijo</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Valor</label>
                                        <input type="number" step="0.01" name="valor" value={formData.valor ?? ''} onChange={handleFormChange} className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fecha inicio</label>
                                        <input type="date" name="fecha_inicio" value={formData.fecha_inicio || ''} onChange={handleFormChange} className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fecha fin</label>
                                        <input type="date" name="fecha_fin" value={formData.fecha_fin || ''} onChange={handleFormChange} className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 items-end">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Usos máximos</label>
                                        <input type="number" name="usos_maximos" value={formData.usos_maximos ?? ''} onChange={handleFormChange} className="mt-1 block w-full rounded border border-gray-200 px-3 py-2 text-sm" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input id="activo" name="activo" type="checkbox" checked={!!formData.activo} onChange={handleFormChange} className="h-4 w-4" />
                                        <label htmlFor="activo" className="text-sm text-gray-700">Activo</label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-end gap-3">
                                <button type="button" onClick={cerrarEditor} className="px-4 py-2 rounded border border-gray-200 text-sm">Cancelar</button>
                                <button type="submit" className="modal-footer-btn">Guardar cambios</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
