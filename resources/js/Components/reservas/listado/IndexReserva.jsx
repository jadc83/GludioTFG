import Badge from '@/Components/UI/Badge';
import BarraBuscador from '@/Components/UI/BarraBuscador';
import HeaderPanel from '@/Components/UI/HeaderPanel';
import Paginacion from '@/Components/UI/Paginacion';
import {
    HomeIcon,
    InboxIcon,
    PencilIcon,
    TrashIcon,
    UserIcon,
} from '@heroicons/react/24/outline';
import { router } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function IndexReserva({ reservas = [] }) {
    const [filtros, setFiltros] = useState({
        status: 'todos',
        localizador: '',
        cliente: '',
        habitacion: '',
    });
    const [refrescarTabla, setRefrescarTabla] = useState(0);
    const [paginaActual, setPaginaActual] = useState(1);
    const itemsPorPagina = 10;

    const actualizarFiltro = (campo, valor) => {
        setFiltros((prev) => ({ ...prev, [campo]: valor }));
    };

    const limpiarFiltros = () => {
        setFiltros({
            status: 'todos',
            localizador: '',
            cliente: '',
            habitacion: '',
        });
    };

    useEffect(() => {
        const contador = setTimeout(() => {
            const criterios = {
                status: filtros.status !== 'todos' ? filtros.status : undefined,
                localizador: filtros.localizador || undefined,
                cliente: filtros.cliente || undefined,
                habitacion: filtros.habitacion || undefined,
            };
            Object.keys(criterios).forEach(
                (key) => criterios[key] === undefined && delete criterios[key],
            );
            router.get(route('panel'), criterios, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        }, 300);
        return () => clearTimeout(contador);
    }, [filtros, refrescarTabla]);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) return;
        const handler = () => setRefrescarTabla((prev) => prev + 1);
        const channel = window.Echo.private('reservas');
        channel
            .listen('ReservaCreada', handler)
            .listen('ReservaActualizada', handler)
            .listen('ReservaBorrada', handler);
        return () => {
            channel
                .stopListening('ReservaCreada')
                .stopListening('ReservaActualizada')
                .stopListening('ReservaBorrada');
        };
    }, []);

    const eliminarReserva = (id) => {
        if (confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
            router.delete(`/reservas/${id}`, { preserveScroll: true });
        }
    };

    // Cálculo de paginación
    const totalPaginas = Math.ceil(reservas.length / itemsPorPagina);
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    const reservasPaginadas = reservas.slice(inicio, fin);

    // Resetear página cuando cambian las reservas
    useEffect(() => {
        setPaginaActual(1);
    }, [reservas.length]);

    return (
        <div className="space-y-6">
            <HeaderPanel
                titulo="Reservas"
                subtitulo="Panel de control y gestión de reservas"
            />

            {/* Barra de filtros */}
            <BarraBuscador
                filtros={filtros}
                onActualizarFiltro={actualizarFiltro}
                onLimpiarFiltros={limpiarFiltros}
                placeholderBusqueda="Localizador..."
                layout="grid"
                filtrosAdicionales={[
                    {
                        tipo: 'input',
                        nombre: 'cliente',
                        placeholder: 'Nombre del cliente...',
                        icono: <UserIcon className="h-4 w-4" />,
                    },
                    {
                        tipo: 'input',
                        nombre: 'habitacion',
                        placeholder: 'Nº Habitación...',
                        icono: <HomeIcon className="h-4 w-4" />,
                    },
                    {
                        tipo: 'select',
                        nombre: 'status',
                        opciones: [
                            { valor: 'todos', etiqueta: 'Todos los estados' },
                            { valor: 'pendiente', etiqueta: 'Pendiente' },
                            { valor: 'confirmado', etiqueta: 'Confirmada' },
                            { valor: 'en_estancia', etiqueta: 'En Estancia' },
                            { valor: 'finalizado', etiqueta: 'Finalizada' },
                            { valor: 'cancelado', etiqueta: 'Cancelada' },
                            { valor: 'no_presentado', etiqueta: 'No Presentado' },
                            { valor: 'reembolso_parcial_pendiente', etiqueta: 'Reembolso Parcial Pendiente' },
                            { valor: 'reembolso_total_pendiente', etiqueta: 'Reembolso Total Pendiente' },
                            { valor: 'reembolso_parcial_confirmado', etiqueta: 'Reembolso Parcial Confirmado' },
                        ],
                    },
                ]}
            />

            {/* --- TABLA DE RESERVAS --- */}
            <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
                {reservas.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="mb-4 rounded-full bg-gray-50 p-8">
                            <InboxIcon className="h-12 w-12 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight text-gray-900">
                            Sin Reservas
                        </h3>
                        <p className="mt-1 max-w-xs text-sm text-gray-400">
                            No hay registros que coincidan con la búsqueda.
                        </p>
                        <button
                            onClick={limpiarFiltros}
                            className="mt-6 text-xs font-black uppercase tracking-widest text-[#7a0202] hover:underline"
                        >
                            Ver todas
                        </button>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50/50">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Localizador
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Habitación
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Llegada
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Salida
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Precio
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Estado Pago
                                    </th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 text-center">
                                        Estado Reserva
                                    </th>
                                    <th className="px-6 py-5 text-right text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {reservasPaginadas.map((reserva) => {
                                    return (
                                        <tr
                                            key={reserva.id}
                                            className="group transition-colors hover:bg-gray-50/50"
                                        >
                                            {/* Localizador Box */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="flex h-10 w-16 items-center justify-center rounded-xl bg-gray-900 text-white shadow-lg shadow-gray-200 transition-colors group-hover:bg-[#7a0202]">
                                                        <span className="font-mono text-xs font-black tracking-tighter">
                                                            {
                                                                reserva.localizador
                                                            }
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Cliente */}
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-xs font-medium uppercase leading-none tracking-tight text-gray-900">
                                                    {reserva.cliente_name ||
                                                        'Anónimo'}
                                                </span>
                                            </td>

                                            {/* Habitación */}
                                            <td className="px-6 py-6 text-center">
                                                <span className="text-sm font-medium text-gray-600">
                                                    {reserva.habitacion_numero ||
                                                        '—'}
                                                </span>
                                            </td>

                                            {/* Llegada */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="font-mono text-xs font-medium text-gray-600">
                                                    {new Date(
                                                        reserva.check_in,
                                                    ).toLocaleDateString(
                                                        'es-ES',
                                                    )}
                                                </div>
                                            </td>

                                            {/* Salida */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="font-mono text-xs font-medium text-gray-600">
                                                    {new Date(
                                                        reserva.check_out,
                                                    ).toLocaleDateString(
                                                        'es-ES',
                                                    )}
                                                </div>
                                            </td>

                                            {/* Precio */}
                                            <td className="px-6 py-6 text-center">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-medium text-gray-600">
                                                        {(
                                                            parseFloat(
                                                                reserva.precio_total ||
                                                                    0,
                                                            ) -
                                                            parseFloat(
                                                                reserva.descuento_aplicado ||
                                                                    0,
                                                            )
                                                        ).toFixed(2)}{' '}
                                                        €
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Estado Pago */}
                                            <td className="px-6 py-6 text-center">
                                                <Badge
                                                    label={
                                                        reserva.pago ===
                                                        'pagado'
                                                            ? 'Pagado'
                                                            : reserva.pago ===
                                                                'devuelto'
                                                              ? 'Devuelto'
                                                              : reserva.pago ===
                                                                  'reembolso_pendiente'
                                                                ? 'Reembolso Pendiente'
                                                                : reserva.pago ===
                                                                    'reembolso_parcial_procesado'
                                                                  ? 'Parcialmente Reembolsado'
                                                                  : 'Pendiente'
                                                    }
                                                    tipo={
                                                        reserva.pago ||
                                                        'pendiente'
                                                    }
                                                />
                                            </td>

                                            {/* Estado Reserva */}
                                            <td className="px-6 py-6 text-center">
                                                <Badge
                                                    label={
                                                        reserva.status ===
                                                        'confirmado'
                                                            ? 'Confirmada'
                                                            : reserva.status ===
                                                                'en_estancia'
                                                              ? 'En Estancia'
                                                              : reserva.status ===
                                                                  'finalizado'
                                                                ? 'Finalizada'
                                                                : reserva.status ===
                                                                    'cancelado'
                                                                  ? 'Cancelada'
                                                                  : reserva.status ===
                                                                      'no_presentado'
                                                                    ? 'No Presentado'
                                                                    : reserva.status ===
                                                                        'pendiente'
                                                                      ? 'Pendiente'
                                                                      : reserva.status ===
                                                                          'reembolso_parcial_pendiente'
                                                                        ? 'Reembolso Parcial Pendiente'
                                                                        : reserva.status ===
                                                                            'reembolso_total_pendiente'
                                                                          ? 'Reembolso Total Pendiente'
                                                                          : reserva.status ===
                                                                              'reembolso_parcial_confirmado'
                                                                            ? 'Reembolso Parcial Confirmado'
                                                                            : 'Pendiente'
                                                    }
                                                    tipo={
                                                        reserva.status ||
                                                        'pendiente'
                                                    }
                                                />
                                            </td>

                                            {/* Acciones */}
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex translate-x-2 transform justify-end gap-2 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100">
                                                    <button
                                                        onClick={() =>
                                                            router.visit(
                                                                `/reservas/${reserva.id}/edit`,
                                                            )
                                                        }
                                                        className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:border-red-100 hover:text-[#7a0202]"
                                                    >
                                                        <PencilIcon className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() =>
                                                            eliminarReserva(
                                                                reserva.id,
                                                            )
                                                        }
                                                        className="rounded-xl border border-gray-100 bg-white p-2.5 text-gray-400 shadow-sm transition-all hover:text-black"
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

                {/* Paginación */}
                {reservas.length > 0 && (
                    <Paginacion
                        paginaActual={paginaActual}
                        totalPaginas={totalPaginas}
                        inicio={inicio}
                        fin={fin}
                        total={reservas.length}
                        onCambiarPagina={setPaginaActual}
                        etiqueta="Reservas"
                    />
                )}
            </div>
        </div>
    );
}
