import { CheckCircleIcon, DocumentArrowDownIcon, ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon, CreditCardIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useState } from 'react';
import ExtenderReserva from '@/Components/reservas/utilidades/ExtenderReserva';

export default function DetalleReserva({ reserva }) {
    const [mostrarExtender, setMostrarExtender] = useState(false);

    const getStatusBadge = (status) => {
        const colors = {
            'pendiente': 'badge-warning',
            'confirmada': 'badge-success',
            'completada': 'badge-success',
            'cancelada': 'badge-error',
        };
        return colors[status] || 'badge-gray';
    };

    const getPagoBadge = (pago) => {
        const colors = {
            'pendiente': 'badge-warning',
            'pagado': 'badge-success',
            'fallido': 'badge-error',
        };
        return colors[pago] || 'badge-gray';
    };

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris pt-6 pb-6">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="space-y-3">
                        {/* Header compacto */}
                        <div className="rounded-lg bg-white p-3 shadow-md flex items-center justify-between">
                            <div className="flex items-baseline gap-3">
                                <h1 className="text-2xl font-bold text-gray-800">Reserva</h1>
                                <span className="font-mono font-bold text-[#7a0202] text-base">{reserva.localizador}</span>
                            </div>
                            <CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0" />
                        </div>

                        {/* Info principal en una línea */}
                        <div className="rounded-lg bg-white p-3 shadow-md">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p className="text-xs font-bold text-[#7a0202] uppercase">Huésped</p>
                                    <p className="text-gray-800 font-semibold">{reserva.cliente.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#7a0202] uppercase">Check-in</p>
                                    <p className="text-gray-800 font-semibold">{formatearFecha(reserva.check_in)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#7a0202] uppercase">Check-out</p>
                                    <p className="text-gray-800 font-semibold">{formatearFecha(reserva.check_out)}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-[#7a0202] uppercase">Estado</p>
                                    <div className="flex gap-1">
                                        <span className={`badge ${getStatusBadge(reserva.status)} text-xs py-0.5 px-2`}>
                                            {reserva.status.charAt(0).toUpperCase() + reserva.status.slice(1)}
                                        </span>
                                        <span className={`badge ${getPagoBadge(reserva.pago)} text-xs py-0.5 px-2`}>
                                            {reserva.pago.charAt(0).toUpperCase() + reserva.pago.slice(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Habitaciones compacto */}
                        <div className="rounded-lg bg-white p-3 shadow-md">
                            <h3 className="text-sm font-bold text-gray-800 mb-2">Habitaciones</h3>
                            <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                                {reserva.habitaciones.map((hab, idx) => (
                                    <div key={idx} className="border border-gris p-2 rounded text-xs flex justify-between items-center">
                                        <span className="font-semibold">{hab.tipo.charAt(0).toUpperCase() + hab.tipo.slice(1)} #{hab.numero}</span>
                                        <span className="text-[#7a0202] font-bold">{formatearMoneda(hab.precio)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resumen */}
                        <div className="rounded-lg bg-gradient-to-r from-[#7a0202] to-[#920303] p-3 shadow-md text-white flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold opacity-90">TOTAL</p>
                                <p className="text-2xl font-bold">{formatearMoneda(reserva.precio_total)}</p>
                            </div>
                            <button
                                onClick={() => window.location.href = `/reservas/${reserva.localizador}/pdf`}
                                className="bg-transparent border-0 text-white px-3 py-2 rounded flex items-center gap-2 text-sm hover:opacity-80"
                            >
                                <DocumentArrowDownIcon className="h-4 w-4" />
                                PDF
                            </button>
                        </div>

                        {/* Hotel info compacto */}
                        <div className="rounded-lg bg-white p-3 shadow-md">
                            <h3 className="text-sm font-bold text-gray-800 mb-3">Hotel Gludio</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="flex gap-2">
                                    <MapPinIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-600">Dirección</p>
                                        <p className="text-gray-800">Calle Principal 123</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <PhoneIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-600">Teléfono</p>
                                        <p className="text-gray-800">+34 91 234 5678</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <EnvelopeIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-600">Email</p>
                                        <p className="text-gray-800">info@hotel.com</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <ClockIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="font-semibold text-gray-600">Atención</p>
                                        <p className="text-gray-800">24h disponible</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Horarios, Políticas y Servicios en línea */}
                        <div className="rounded-lg bg-white p-3 shadow-md">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                {/* Horarios */}
                                <div>
                                    <p className="font-bold text-gray-800 mb-2">Horarios</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between"><span className="text-gray-600">Check-in:</span> <span className="font-semibold">15:00</span></div>
                                        <div className="flex justify-between"><span className="text-gray-600">Check-out:</span> <span className="font-semibold">11:00</span></div>
                                        <div className="flex justify-between"><span className="text-gray-600">Conserjería:</span> <span className="font-semibold">24/7</span></div>
                                    </div>
                                </div>

                                {/* Políticas */}
                                <div>
                                    <p className="font-bold text-gray-800 mb-2">Políticas</p>
                                    <div className="space-y-1">
                                        <div className="flex justify-between"><span className="text-gray-600">Cancelación:</span> <span className="font-semibold">48h gratis</span></div>
                                        <div className="flex justify-between"><span className="text-gray-600">Modificación:</span> <span className="font-semibold">Sin costo</span></div>
                                        <div className="flex justify-between"><span className="text-gray-600">Mascotas:</span> <span className="font-semibold">No</span></div>
                                    </div>
                                </div>

                                {/* Servicios */}
                                <div>
                                    <p className="font-bold text-gray-800 mb-2">Servicios</p>
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3 text-[#7a0202]" /> WiFi gratis</div>
                                        <div className="flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3 text-[#7a0202]" /> Desayuno</div>
                                        <div className="flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3 text-[#7a0202]" /> Aparcamiento</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Botón de extensión de estadía */}
                        {mostrarExtender && (
                            <ExtenderReserva
                                reserva={reserva}
                                onClose={() => {
                                    setMostrarExtender(false);
                                    // Opcionalmente recargar los datos de la reserva
                                    window.location.reload();
                                }}
                            />
                        )}

                        {!mostrarExtender && (
                            <button
                                onClick={() => setMostrarExtender(true)}
                                className="w-full bg-gradient-to-r from-[#7a0202] to-[#920303] text-white font-semibold py-3 rounded-lg hover:opacity-90 transition"
                            >
                                🏨 Extender tu estadía
                            </button>
                        )}

                        {/* Botón Volver */}
                        <Link href="/" className="inline-flex items-center gap-1 text-[#7a0202] hover:text-[#6b0101] font-semibold text-sm">
                            <ArrowLeftIcon className="h-4 w-4" />
                            Volver
                        </Link>
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
