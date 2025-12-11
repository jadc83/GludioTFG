import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { FunnelIcon, InboxIcon, EyeIcon, PencilIcon } from '@heroicons/react/24/outline';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar } from 'recharts';
import '@/../css/createReserva.css';

export default function IndexReserva({ reservas = [], estadisticas = {} }) {
    const [filtros, setFiltros] = useState({
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: ''
    });

    const actualizarFiltro = (campo, valor) => {
        setFiltros(prev => ({ ...prev, [campo]: valor }));
    };

    const hayFiltrosActivos = filtros.status !== 'todos' ||
                              filtros.localizador !== '' ||
                              filtros.cliente !== '' ||
                              filtros.habitacion !== '';

    const limpiarFiltros = () => {
        setFiltros({
            status: 'todos',
            localizador: '',
            cliente: '',
            habitacion: ''
        });
    };

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

        return () => clearTimeout(timer);
    }, [filtros]);

    const [reservaEditar, setReservaEditar] = useState(null);
    const [drawerAbierto, setDrawerAbierto] = useState(false);

    const abrirEdicion = (reserva) => {
        setReservaEditar(reserva);
        setDrawerAbierto(true); };

    const cerrarEdicion = () => {
        setDrawerAbierto(false);
        setTimeout(() => setReservaEditar(null), 300); };

    const obtenerColorStatus = (status) => {
        const colores = {
            'confirmado': 'badge-success',
            'checked_in': 'badge-warning',
            'checked_out': 'badge-info',
            'cancelado': 'badge-error',
            'no_presentado': 'badge-ghost',
            'pendiente': 'badge-neutral'
        };
        return colores[status] || 'badge-neutral';
    };

    const obtenerColorPago = (pago) => {
        const colores = {
            'pagado': 'badge-success',
            'parcial': 'badge-warning',
            'devuelto': 'badge-info',
            'pendiente': 'badge-error'
        };
        return colores[pago] || 'badge-error';
    };

    const dataChart = [{
        name: 'Reservas',
        confirmado: estadisticas.confirmado || 0,
        pendiente: estadisticas.pendiente || 0,
        checked_in: estadisticas.checked_in || 0,
        checked_out: estadisticas.checked_out || 0,
        cancelado: estadisticas.cancelado || 0
    }];

    return (
        <>

            <div className="grafico-estadisticas">
                <div className="grafico-header">
                    <h3>Estado de las Reservas</h3>
                    <div className="leyenda-estados">
                        <div className="leyenda-item">
                            <div className="leyenda-color confirmado"></div>
                            <span>Confirmado ({estadisticas.confirmado || 0})</span>
                        </div>
                        <div className="leyenda-item">
                            <div className="leyenda-color pendiente"></div>
                            <span>Pendiente ({estadisticas.pendiente || 0})</span>
                        </div>
                        <div className="leyenda-item">
                            <div className="leyenda-color checked-in"></div>
                            <span>Check-in ({estadisticas.checked_in || 0})</span>
                        </div>
                        <div className="leyenda-item">
                            <div className="leyenda-color checked-out"></div>
                            <span>Check-out ({estadisticas.checked_out || 0})</span>
                        </div>
                        <div className="leyenda-item">
                            <div className="leyenda-color cancelado"></div>
                            <span>Cancelado ({estadisticas.cancelado || 0})</span>
                        </div>
                    </div>
                </div>
                <div className="grafico-contenedor">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={dataChart} layout="vertical" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
                            <defs>
                                <linearGradient id="gradConfirmado" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#22c55e" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#16a34a" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="gradPendiente" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#6b7280" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#4b5563" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="gradCheckedIn" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#fbbf24" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="gradCheckedOut" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#38bdf8" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#0284c7" stopOpacity="1" />
                                </linearGradient>
                                <linearGradient id="gradCancelado" x1="0" x2="1">
                                    <stop offset="0%" stopColor="#f87171" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#dc2626" stopOpacity="1" />
                                </linearGradient>
                            </defs>
                            <XAxis type="number" domain={[0, estadisticas.total]} axisLine={false} tick={false} tickLine={false} />
                            <YAxis type="category" dataKey="name" axisLine={false} tick={false} tickLine={false} />
                            <Bar dataKey="confirmado" stackId="a" fill="url(#gradConfirmado)" />
                            <Bar dataKey="pendiente" stackId="a" fill="url(#gradPendiente)" />
                            <Bar dataKey="checked_in" stackId="a" fill="url(#gradCheckedIn)" />
                            <Bar dataKey="checked_out" stackId="a" fill="url(#gradCheckedOut)" />
                            <Bar dataKey="cancelado" stackId="a" fill="url(#gradCancelado)" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="filtros-grid">
                <div>
                    <label className="label">
                        <span className="label-text font-medium">Localizador</span>
                    </label>
                    <input type="text" placeholder="CLI58C95..." className="input input-bordered w-full" value={filtros.localizador}
                        onChange={(e) => actualizarFiltro('localizador', e.target.value)}/>
                </div>

                <div>
                    <label className="label">
                        <span className="label-text font-medium">Cliente</span>
                    </label>
                    <input type="text" placeholder="Juan Pérez..." className="input input-bordered w-full"
                        value={filtros.cliente} onChange={(e) => actualizarFiltro('cliente', e.target.value)}/>
                </div>

                <div>
                    <label className="label">
                        <span className="label-text font-medium">Habitación</span>
                    </label>
                    <input type="text" placeholder="101, 102..." className="input input-bordered w-full" value={filtros.habitacion}
                        onChange={(e) => actualizarFiltro('habitacion', e.target.value)}/>
                </div>

                <div>
                    <label className="label">
                        <span className="label-text font-medium">Estado</span>
                    </label>
                    <select className="select select-bordered w-full" value={filtros.status}
                        onChange={(e) => actualizarFiltro('status', e.target.value)}>
                            <option value="todos">Todos los estados</option>
                            <option value="pendiente">Pendiente</option>
                            <option value="confirmado">Confirmado</option>
                            <option value="checked_in">Check-in</option>
                            <option value="checked_out">Check-out</option>
                            <option value="cancelado">Cancelado</option>
                    </select>
                </div>
            </div>

            <div className="acciones-filtros">
                <button onClick={limpiarFiltros} className="btn btn-outline btn-sm" disabled={!hayFiltrosActivos}>
                    <FunnelIcon className="w-4 h-4 mr-2" />
                    Limpiar filtros
                </button>
                <div className="contador-resultados">
                    {hayFiltrosActivos && (
                        <span className="badge badge-info">
                            {reservas.length} resultado{reservas.length !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {estadisticas.total === 0 ? (
                <div className="estado-vacio">
                    <InboxIcon className="estado-vacio-icono" />
                    <div className="estado-vacio-texto">
                        <p className="estado-vacio-titulo">No hay reservas</p>
                        <p className="estado-vacio-descripcion">Crea tu primera reserva</p>
                    </div>
                </div>
            ) : reservas.length === 0 ? (
                <div className="estado-vacio">
                    <InboxIcon className="estado-vacio-icono" />
                    <div className="estado-vacio-texto">
                        <p className="estado-vacio-titulo">No se encontraron reservas</p>
                        <p className="estado-vacio-descripcion">Intenta cambiar los filtros de búsqueda</p>
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
                                    <div className="fecha-checkout">
                                        → {new Date(reserva.check_out).toLocaleDateString('es-ES')}
                                    </div>
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
                                    {reserva.notas ? (
                                        <div className="notas-texto">{reserva.notas}</div>
                                    ) : (
                                        <span className="notas-sin">Sin notas</span>
                                    )}
                                </td>
                                <td className="text-center">
                                    <div className="acciones-celda">
                                        <button className="btn btn-ghost btn-xs" title="Ver detalles">
                                            <EyeIcon className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => abrirEdicion(reserva)} title="Editar">
                                            <PencilIcon className="w-5 h-5" />
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
