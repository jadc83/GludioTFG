import { useState, useEffect } from 'react';
import { formatearMoneda } from '@/utils/formatters';

export default function ModalConfirmacionReserva({ reserva, isOpen, onClose }) {
    const [animarSalida, setAnimarSalida] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setAnimarSalida(false);
        }
    }, [isOpen]);

    // Debug: log de los datos recibidos
    useEffect(() => {
        if (isOpen && reserva) {
            console.log('📋 ModalConfirmacionReserva abierto. Datos recibidos:', reserva);
        }
    }, [isOpen, reserva]);

    const handleClose = () => {
        setAnimarSalida(true);
        setTimeout(onClose, 300);
    };

    if (!isOpen || !reserva) return null;

    return (
        <>
            {/* Overlay */}
            <div className={`fixed inset-0 bg-black/40 transition-opacity duration-300  ${ animarSalida ? 'opacity-0' : 'opacity-100' }`}
                onClick={handleClose} style={{ zIndex: 999 }} />

            {/* Modal */}
            <div className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2
                    bg-white rounded-xl shadow-xl transition-all duration-300
                    w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col
                    border border-gray-100
                    ${animarSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100' }`}
                style={{ zIndex: 1000 }}>

                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 bg-white">
                    <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">✓</span>
                        <h2 className="text-lg font-bold text-gray-900">Reserva Confirmada</h2>
                    </div>
                    <p className="text-sm text-gray-600">
                        {reserva.pagoAlLlegar ? 'Pago pendiente en recepción' : 'Pago confirmado'}
                    </p>
                </div>

                {/* Content - scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                    {/* Localizador destacado */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-25 border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Número de Reserva</p>
                        <p className="font-mono text-xl font-bold text-gray-900 tracking-wider">{reserva.localizador}</p>
                    </div>

                    {/* Detalles principales */}
                    <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Detalles de tu Estancia</h3>
                        <div className="grid grid-cols-2 gap-4">
                            {/* Huésped */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Huésped</p>
                                <p className="font-medium text-gray-900">{reserva.nombre}</p>
                            </div>

                            {/* Habitaciones */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Habitaciones</p>
                                <p className="font-medium text-gray-900">{reserva.cantidad_habitaciones}</p>
                            </div>

                            {/* Check-in */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Check-in</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(reserva.check_in).toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </p>
                            </div>

                            {/* Check-out */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Check-out</p>
                                <p className="font-medium text-gray-900">
                                    {new Date(reserva.check_out).toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-100"></div>

                    {/* Total */}
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {reserva.pagoAlLlegar ? 'Importe Total' : 'Importe Pagado'}
                        </p>
                        <p className="font-mono text-2xl font-bold text-gray-900">
                            {formatearMoneda(reserva.precio_total)}
                        </p>
                    </div>

                    {/* Información del pago */}
                    <div className={`rounded-lg p-4 border text-sm leading-relaxed ${
                        reserva.pagoAlLlegar ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
                        {reserva.pagoAlLlegar ? (
                            <div>
                                <p className="font-semibold mb-1">Pago en Recepción</p>
                                <p className="text-xs opacity-90">
                                    Presenta tu número de reserva al hacer check-in
                                </p>
                            </div>
                        ) : (
                            <div>
                                <p className="font-semibold mb-1">Confirmación Enviada</p>
                                <p className="text-xs opacity-90">
                                    Revisa tu correo electrónico para los detalles
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-100 px-6 py-4 bg-gray-50">
                    <button onClick={() => { setAnimarSalida(true); setTimeout(() => { window.location.href = '/'; }, 300); }}
                        className="w-full bg-black text-white py-2.5 rounded-lg font-semibold text-sm
                            hover:bg-[#7a0202] transition-colors duration-200
                            focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2">
                        Volver al Inicio
                    </button>
                </div>
            </div>
        </>
    );
}
