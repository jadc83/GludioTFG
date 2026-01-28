import Campo from '@/Components/formulario/Campo';
import { FunnelIcon, InboxIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon, CalendarIcon, UserIcon, HomeIcon } from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState, useMemo } from 'react';

export default function IndexReserva({ reservas = [] }) {
    const [filtros, setFiltros] = useState({ status: 'todos', localizador: '', cliente: '', habitacion: '' });
    const [refrescarTabla, setRefrescarTabla] = useState(0);

    const actualizarFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    };

    const limpiarFiltros = () => {
        setFiltros({ status: 'todos', localizador: '', cliente: '', habitacion: '' });
    };

    // --- LÓGICA DE FILTRADO Y REVERB (Sincronización en tiempo real) ---
    useEffect(() => {
        const contador = setTimeout(() => {
            const criterios = {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: filtros.localizador || undefined,
                cliente: filtros.cliente || undefined,
                habitacion: filtros.habitacion || undefined,
            };
            Object.keys(criterios).forEach((key) => criterios[key] === undefined && delete criterios[key]);
            router.get(route('panel'), criterios, { preserveState: true, preserveScroll: true, replace: true });
        }, 300);
        return () => clearTimeout(contador);
    }, [filtros, refrescarTabla]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) return;
        const handler = () => setRefrescarTabla((prev) => prev + 1);
        const channel = window.Echo.private('reservas');
        channel.listen('ReservaCreada', handler).listen('ReservaActualizada', handler).listen('ReservaBorrada', handler);
        return () => {
            channel.stopListening('ReservaCreada').stopListening('ReservaActualizada').stopListening('ReservaBorrada');
        };
    }, []);

    // --- CONFIGURACIÓN DE ESTADOS PROFESIONALES ---
    const configEstado = {
        confirmado: { clase: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Confirmada' },
        checked_in: { clase: 'bg-amber-50 text-amber-700 border-amber-100', label: 'En Estancia' },
        checked_out: { clase: 'bg-blue-50 text-blue-700 border-blue-100', label: 'Finalizada' },
        cancelado: { clase: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Cancelada' },
        no_presentado: { clase: 'bg-gray-100 text-gray-500 border-gray-200', label: 'No Presentado' },
        pendiente: { clase: 'bg-purple-50 text-purple-700 border-purple-100', label: 'Pendiente' },
    };

    const configPago = (reserva) => {
        const reembolsos = reserva.reembolsos_total || 0;
        if (reembolsos > 0 && reembolsos < reserva.precio_total) return { clase: 'bg-orange-50 text-orange-700 border-orange-100', label: 'Parcial' };

        const estados = {
            pagado: { clase: 'bg-emerald-50 text-emerald-700 border-emerald-100', label: 'Pagado' },
            devuelto: { clase: 'bg-sky-50 text-sky-700 border-sky-100', label: 'Devuelto' },
            pendiente: { clase: 'bg-rose-50 text-rose-700 border-rose-100', label: 'Pendiente' },
        };
        return estados[reserva.pago] || estados.pendiente;
    };

    const eliminarReserva = (id) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
            router.delete(`/reservas/${id}`, { preserveScroll: true });
        }
    };

    return (
        <div className="space-y-6">

            {/* --- CABECERA --- */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                        Gestión de <span className="text-[#7a0202]">Reservas</span>
                    </h1>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Panel de control y gestión de reservas</p>
                </div>
                <div className="h-12 w-12 bg-gray-50 rounded-2xl flex items-center justify-center border border-gray-100">
                    <InboxIcon className="h-6 w-6 text-gray-400" />
                </div>
            </div>

            {/* --- ÚNICA BARRA DE FILTROS PREMIUM --- */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col xl:flex-row gap-4 items-end xl:items-center">

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-full flex-1">
                    {/* Localizador */}
                    <div className="relative">
                        <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Localizador..."
                            className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7a0202]/10 transition"
                            value={filtros.localizador}
                            onChange={(e) => actualizarFiltro('localizador', e.target.value)}
                        />
                    </div>

                    {/* Cliente */}
                    <div className="relative">
                        <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Nombre del cliente..."
                            className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7a0202]/10 transition"
                            value={filtros.cliente}
                            onChange={(e) => actualizarFiltro('cliente', e.target.value)}
                        />
                    </div>

                    {/* Habitación */}
                    <div className="relative">
                        <HomeIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Nº Habitación..."
                            className="w-full bg-gray-50 border-none rounded-xl pl-10 py-3 text-sm font-medium focus:ring-2 focus:ring-[#7a0202]/10 transition"
                            value={filtros.habitacion}
                            onChange={(e) => actualizarFiltro('habitacion', e.target.value)}
                        />
                    </div>

                    {/* Estado */}
                    <select
                        value={filtros.status}
                        onChange={(e) => actualizarFiltro('status', e.target.value)}
                        className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-[#7a0202]/10"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="checked_in">Check-in</option>
                        <option value="checked_out">Check-out</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                <button
                    onClick={limpiarFiltros}
                    className="p-3 bg-gray-100 text-gray-500 rounded-xl hover:bg-gray-200 transition h-[46px]"
                    title="Limpiar Filtros"
                >
                    <FunnelIcon className="h-5 w-5" />
                </button>
            </div>

            {/* --- TABLA DE RESERVAS --- */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                {reservas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="bg-gray-50 p-8 rounded-full mb-4">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Sin Reservas</h3>
                        <p className="text-sm text-gray-400 mt-1 max-w-xs">No hay registros que coincidan con la búsqueda.</p>
                        <button onClick={limpiarFiltros} className="mt-6 text-[#7a0202] font-black text-xs uppercase tracking-widest hover:underline">Ver todas</button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-100">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Localizador</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Cliente / Hab</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estadía</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Finanzas</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Estado</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reservas.map((reserva) => {
                                    const estado = configEstado[reserva.status] || configEstado.pendiente;
                                    const pago = configPago(reserva);
                                    return (
                                        <tr key={reserva.id} className="group hover:bg-gray-50/50 transition-colors">
                                            {/* Localizador Box */}
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-16 bg-gray-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-gray-200 group-hover:bg-[#7a0202] transition-colors">
                                                        <span className="font-mono text-xs font-black tracking-tighter">{reserva.localizador}</span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Cliente / Habitación */}
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-gray-900 uppercase text-sm tracking-tight leading-none mb-1">
                                                        {reserva.cliente_name || 'Anónimo'}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                        Hab: {reserva.habitacion_numero || '—'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Fechas */}
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2 text-xs font-mono font-medium text-gray-600">
                                                    <CalendarIcon className="h-3 w-3 text-gray-300" />
                                                    <span>{new Date(reserva.check_in).toLocaleDateString('es-ES')}</span>
                                                    <span className="text-gray-300">→</span>
                                                    <span>{new Date(reserva.check_out).toLocaleDateString('es-ES')}</span>
                                                </div>
                                            </td>

                                            {/* Precio y Pago */}
                                            <td className="px-6 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-sm font-black text-gray-900">{parseFloat(reserva.precio_total || 0).toFixed(2)} €</span>
                                                    <span className={`inline-flex w-fit px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-tighter border ${pago.clase}`}>
                                                        {pago.label}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Estado Reserva */}
                                            <td className="px-6 py-6">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${estado.clase}`}>
                                                    {estado.label}
                                                </span>
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                                                    <button
                                                        onClick={() => router.visit(`/reservas/${reserva.id}/edit`)}
                                                        className="p-2.5 bg-white text-gray-400 hover:text-[#7a0202] border border-gray-100 hover:border-red-100 rounded-xl shadow-sm transition-all"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => eliminarReserva(reserva.id)}
                                                        className="p-2.5 bg-white text-gray-400 hover:text-black border border-gray-100 rounded-xl shadow-sm transition-all"
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Contador de resultados minimalista */}
            {reservas.length > 0 && (
                <div className="text-center">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                        Sincronización en vivo activa <span className="mx-2 text-gray-200">|</span> {reservas.length} Reservas Cargadas
                    </span>
                </div>
            )}
        </div>
    );
}
