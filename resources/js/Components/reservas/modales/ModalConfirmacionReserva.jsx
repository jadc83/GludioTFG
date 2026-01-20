import { useState, useEffect } from 'react';
import { formatearMoneda } from '@/utils/formatters';

export default function ModalConfirmacionReserva({ reserva, isOpen, onClose }) {
    const [animarSalida, setAnimarSalida] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setAnimarSalida(false);
        }
    }, [isOpen]);

    const handleClose = () => {
        setAnimarSalida(true);
        setTimeout(onClose, 300);
    };

    if (!isOpen || !reserva) return null;

    return (
        <>
            {/* Overlay */}
            <div className={`modal-overlay ${ animarSalida ? 'opacity-0' : 'opacity-100' }`} onClick={handleClose} />

            {/* Modal */}
            <div className={`modal-wrapper ${animarSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100' } text-sm flex flex-col items-center justify-center`} style={{maxWidth:'360px', margin:'0 auto'}}>

                {/* Header */}
                <div className="px-4 py-3 border-b border-gray-100 bg-white w-full text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                        <span className="text-xl">✓</span>
                        <h2 className="text-base font-bold text-gray-900">Reserva Confirmada</h2>
                    </div>
                    <p className="text-xs text-gray-600">
                        {reserva.pagoAlLlegar ? 'Pago pendiente en recepción' : 'Pago confirmado'}
                    </p>
                </div>

                {/* Content - scrollable */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 w-full">

                    {/* Localizador destacado */}
                    <div className="bg-gradient-to-br from-gray-50 to-gray-25 border border-gray-200 rounded-lg p-2 text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Número de Reserva</p>
                        <p className="font-mono text-lg font-bold text-gray-900 tracking-wider break-words">{reserva.localizador}</p>
                    </div>

                    {/* Detalles principales */}
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">Detalles de tu Estancia</h3>
                        <div className="grid grid-cols-2 gap-3 w-full mx-auto">
                            {/* Huésped */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 text-center">Huésped</p>
                                <p className="font-medium text-gray-900 text-xs text-center">{reserva.nombre}</p>
                            </div>

                            {/* Habitaciones */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 text-center">Habitaciones</p>
                                <p className="font-medium text-gray-900 text-xs text-center">{reserva.cantidad_habitaciones}</p>
                            </div>

                            {/* Check-in */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 text-center">Check-in</p>
                                <p className="font-medium text-gray-900 text-xs text-center">
                                    {new Date(reserva.check_in).toLocaleDateString('es-ES', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short'
                                    })}
                                </p>
                            </div>

                            {/* Check-out */}
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider mb-1 text-center">Check-out</p>
                                <p className="font-medium text-gray-900 text-xs text-center">
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
                    <div className="bg-white border border-gray-200 rounded-lg p-2 text-center">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                            {reserva.pagoAlLlegar ? 'Importe Total' : 'Importe Pagado'}
                        </p>
                        <p className="font-mono text-lg font-bold text-gray-900">
                            {formatearMoneda(reserva.precio_total)}
                        </p>
                    </div>

                    {/* Información del pago */}
                    <div className={`rounded-lg p-2 border text-xs leading-relaxed text-center ${ reserva.pagoAlLlegar ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'}`}>
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
                <div className="border-t border-gray-100 px-3 py-2 bg-gray-50 w-full text-center">
                    <button onClick={() => { setAnimarSalida(true); setTimeout(() => { window.location.href = '/'; }, 300); }}
                        className="modal-footer-btn mx-auto min-w-[120px]">
                        Volver al Inicio
                    </button>
                </div>
            </div>
        </>
    );
}
