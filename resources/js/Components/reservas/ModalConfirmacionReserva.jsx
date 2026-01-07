import { useState, useEffect } from 'react';
import { formatearMoneda } from '../../utils/formatters';

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
            <div className={`fixed inset-0 bg-black transition-opacity duration-300 ${ animarSalida ? 'opacity-0' : 'opacity-40' }`}
                onClick={handleClose} style={{ zIndex: 999 }} />
            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl transition-all duration-300 w-full max-w-xs mx-4 max-h-[85vh] overflow-hidden flex flex-col ${
                    animarSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100' }`} style={{ zIndex: 1000 }}>
                {/* Header */}
                <div className="p-2.5 bg-gradient-to-r from-[#7a0202] to-[#8b0303] text-white">
                    <h2 className="text-sm font-bold">✓ Reserva Confirmada</h2>
                    <p className="text-xs mt-0.5 opacity-90">
                        {reserva.pagoAlLlegar ? 'Registrada. Pago en recepción.' : 'Pago procesado.'}
                    </p>
                </div>

                {/* Content - scrollable */}
                <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2">
                    {/* Localizador */}
                    <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-0.5">Nº Reserva</p>
                        <div className="bg-gray-50 border border-gray-200 p-1.5 rounded text-center">
                            <p className="text-sm font-mono font-bold text-[#7a0202]">{reserva.localizador}</p>
                        </div>
                    </div>

                    {/* Detalles compacto - 2 x 2 */}
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                        <div className="bg-gray-50 p-1.5 rounded">
                            <p className="font-semibold text-gray-600 uppercase text-xs tracking-wider mb-0.5 line-clamp-1">Huésped</p>
                            <p className="font-medium text-gray-900 text-xs line-clamp-1">{reserva.nombre}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded">
                            <p className="font-semibold text-gray-600 uppercase text-xs tracking-wider mb-0.5">Habitaciones</p>
                            <p className="font-medium text-gray-900 text-xs">{reserva.cantidad_habitaciones}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded">
                            <p className="font-semibold text-gray-600 uppercase text-xs tracking-wider mb-0.5">Entrada</p>
                            <p className="font-medium text-gray-900 text-xs">{new Date(reserva.check_in).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div className="bg-gray-50 p-1.5 rounded">
                            <p className="font-semibold text-gray-600 uppercase text-xs tracking-wider mb-0.5">Salida</p>
                            <p className="font-medium text-gray-900 text-xs">{new Date(reserva.check_out).toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="bg-gradient-to-r from-[#7a0202]/10 to-[#7a0202]/5 border border-[#7a0202]/20 p-2 rounded">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-0.5">
                            {reserva.pagoAlLlegar ? 'Total a Pagar' : 'Total Pagado'}
                        </p>
                        <p className="text-base font-bold text-[#7a0202]">{formatearMoneda(reserva.precio_total)}</p>
                    </div>

                    {/* Información breve */}
                    <div className={`p-1.5 rounded border text-xs leading-tight ${
                        reserva.pagoAlLlegar
                            ? 'bg-orange-50 border-orange-100 text-orange-900'
                            : 'bg-blue-50 border-blue-100 text-blue-900'
                    }`}>
                        <p>
                            {reserva.pagoAlLlegar
                                ? '💳 Pago en recepción. Presenta tu nº de reserva.'
                                : '✓ Confirmación enviada por correo.'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-2 bg-gray-50">
                    <button onClick={() => { setAnimarSalida(true); setTimeout(() => { window.location.href = '/'; }, 300);}}
                        className="w-full bg-[#7a0202] text-white py-1.5 rounded font-semibold text-xs hover:bg-[#8b0303] transition">
                        Ir al Home
                    </button>
                </div>
            </div>
        </>
    );
}
