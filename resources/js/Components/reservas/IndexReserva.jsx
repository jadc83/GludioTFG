import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { FunnelIcon, InboxIcon, EyeIcon } from '@heroicons/react/24/outline';
import '@/../css/createReserva.css';

export default function IndexReserva({ reservas = [] }) {
    const [filtros, setFiltros] = useState({ status: 'todos', localizador: '', cliente: '', habitacion: '' });
    const actualizarFiltro = (campo, valor) => { setFiltros(prev => ({ ...prev, [campo]: valor }));};
    const hayFiltrosActivos = filtros.status !== 'todos' || filtros.localizador !== '' || filtros.cliente !== '' || filtros.habitacion !== '';
    const limpiarFiltros = () => { setFiltros({ status: 'todos', localizador: '', cliente: '', habitacion: '' });};

    useEffect(() => {
        const timer = setTimeout(() => {
            const params = {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: filtros.localizador || undefined,
                cliente: filtros.cliente || undefined,
                habitacion: filtros.habitacion || undefined
            };

            Object.keys(params).forEach(key => params[key] === undefined && delete params[key]);

            router.get(route('panel'), params, {
                preserveState: true,
                preserveScroll: true
            });
        }, 300);

        return () => clearTimeout(timer); }, [filtros]);

    const obtenerColorStatus = (status) => {

        const colores = { 'confirmado': 'badge-success', 'checked_in': 'badge-warning',
                          'checked_out': 'badge-info', 'cancelado': 'badge-error',
                          'no_presentado': 'badge-ghost', 'pendiente': 'badge-neutral'};

        return colores[status] || 'badge-neutral';
    };

    const obtenerColorPago = (pago) => {
        const colores = { 'pagado': 'badge-success', 'parcial': 'badge-warning', 'devuelto': 'badge-info', 'pendiente': 'badge-error' };
        return colores[pago] || 'badge-error';
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div>
                    <label className="label">Localizador</label>
                    <input type="text"
                        placeholder="CLI58C95..."
                        value={filtros.localizador}
                        onChange={(e) => actualizarFiltro('localizador', e.target.value)}
                        className="input input-bordered w-full" />
                </div>

                <div>
                    <label className="label">Cliente</label>
                    <input type="text"
                        placeholder="Juan Pérez..."
                        value={filtros.cliente}
                        onChange={(e) => actualizarFiltro('cliente', e.target.value)}
                        className="input input-bordered w-full"/>
                </div>

                <div>
                    <label className="label">Habitación</label>
                    <input type="text"
                        placeholder="101, 102..."
                        value={filtros.habitacion}
                        onChange={(e) => actualizarFiltro('habitacion', e.target.value)}
                        className="input input-bordered w-full" />
                </div>

                <div>
                    <label className="label">Estado</label>
                    <select value={filtros.status}
                            onChange={(e) => actualizarFiltro('status', e.target.value)}
                            className="select select-bordered w-full">
                                <option value="todos">Todos los estados</option>
                                <option value="pendiente">Pendiente</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="checked_in">Check-in</option>
                                <option value="checked_out">Check-out</option>
                                <option value="cancelado">Cancelado</option>
                    </select>

                </div>

                <div className="self-end">
                    <button type="button"  onClick={limpiarFiltros} className="btn btn-outline btn-info w-full hover:btn-info">
                        <FunnelIcon className="w-4 h-4 mr-2" /> Limpiar filtros
                    </button>
                </div>

            </div>

            {hayFiltrosActivos && (
                <div className="flex justify-end mb-4">
                    {reservas.length} resultados encontrados
                </div>
            )}

            {reservas.length === 0 ? (
                <div className="estado-vacio">
                    <InboxIcon className="estado-vacio-icono" />
                    <div className="estado-vacio-texto">
                        <p className="estado-vacio-titulo">No se encontraron reservas</p>
                        <p className="estado-vacio-descripcion">Seleccione otros criterios de búsqueda</p>
                        <button onClick={limpiarFiltros} className="btn btn-primary btn-sm mt-4">
                            Limpiar filtros
                        </button>
                    </div>
                </div>
                ) : (
                <div className="tabla-reservas-contenedor">
                    <table className="table table-zebra table-lg w-full">
                        <thead className="bg-base-100/50">
                            <tr>
                                <th>Localizador</th>
                                <th>Cliente / Habitación</th>
                                <th>Estadía</th>
                                <th>Precio</th>
                                <th>Estado</th>
                                <th>Pago</th>
                                <th>Notas</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservas.map((reserva) => (
                            <tr key={reserva.id} className="hover">

                                <td className="font-mono font-semibold">
                                    {reserva.localizador}
                                </td>

                                <td className="celda-info-cliente">

                                    <div className="cliente-info-stack">

                                        <div className="cliente-nombre">
                                            {reserva.cliente_name || 'Sin cliente'}
                                        </div>

                                        <div className="cliente-habitacion">
                                            {reserva.habitacion_numero || 'Sin habitación'}
                                        </div>

                                    </div>

                                </td>

                                <td className="celda-fechas font-mono">

                                    <div>{new Date(reserva.check_in).toLocaleDateString('es-ES')}</div>
                                    <div className="fecha-checkout"> → {new Date(reserva.check_out).toLocaleDateString('es-ES')} </div>

                                </td>

                                <td className="celda-precio text-success font-mono">
                                    €{parseFloat(reserva.precio_total || 0).toFixed(2)}
                                </td>

                                <td>
                                    <span className={`badge ${obtenerColorStatus(reserva.status)} gap-2`}>
                                        {reserva.status?.replace('_', ' ')}
                                    </span>
                                </td>

                                <td>
                                    <span className={`badge ${obtenerColorPago(reserva.pago)}`}>
                                        {reserva.pago}
                                    </span>
                                </td>

                                <td className="celda-notas">
                                    {reserva.notas ? ( <div className="notas-texto">{reserva.notas}</div> ) : ( <span className="notas-sin">Sin notas</span>)}
                                </td>

                                <td className="text-center">
                                    <div className="acciones-celda">

                                        <button className="btn btn-ghost btn-xs" title="Ver detalles">
                                            <EyeIcon className="w-4 h-4" />
                                        </button>

                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            )}
        </>
    );
}
