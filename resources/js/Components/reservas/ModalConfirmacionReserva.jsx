import { useState, useEffect } from 'react';

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
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl transition-all duration-300 w-full max-w-sm mx-4 ${
                    animarSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100' }`} style={{ zIndex: 1000 }}>
                {/* Header */}
                <div className="p-3">
                    <h2 className="text-lg font-bold text-gray-900">Reserva Confirmada</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        {reserva.pagoAlLlegar ? 'Registrada. Pago en recepción.' : 'Pago procesado.'}
                    </p>
                </div>

                {/* Content */}
                <div className="px-3 pb-3 space-y-2">
                    {/* Localizador */}
                    <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1">Nº Reserva</p>
                        <div className="bg-gray-50 border border-gray-200 p-2 rounded text-center">
                            <p className="text-lg font-mono font-bold text-gray-900">{reserva.localizador}</p>
                        </div>
                    </div>

                    {/* Detalles compacto - 2 x 2 */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                            <p className="font-semibold text-gray-600 uppercase tracking-wider">Huésped</p>
                            <p className="font-medium text-gray-900">{reserva.nombre}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 uppercase tracking-wider">Habitaciones</p>
                            <p className="font-medium text-gray-900">{reserva.cantidad_habitaciones}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 uppercase tracking-wider">Entrada</p>
                            <p className="font-medium text-gray-900">{new Date(reserva.check_in).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-gray-600 uppercase tracking-wider">Salida</p>
                            <p className="font-medium text-gray-900">{new Date(reserva.check_out).toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>

                    {/* Total */}
                    <div className="border-t border-gray-200 pt-2">
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {reserva.pagoAlLlegar ? 'Total a Pagar' : 'Total Pagado'}
                        </p>
                        <p className="text-xl font-bold text-gray-900">{reserva.precio_total?.toFixed(2)} €</p>
                    </div>

                    {/* Información breve */}
                    <div className={`p-2 rounded border text-xs leading-tight ${
                        reserva.pagoAlLlegar
                            ? 'bg-orange-50 border-orange-100'
                            : 'bg-blue-50 border-blue-100'
                    }`}>
                        <p className={reserva.pagoAlLlegar ? 'text-orange-900' : 'text-blue-900'}>
                            {reserva.pagoAlLlegar
                                ? 'Pago en recepción. Presenta tu nº de reserva al llegar.'
                                : 'Confirmación por correo enviada.'}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-2">
                    <button onClick={() => { setAnimarSalida(true); setTimeout(() => { window.location.href = '/'; }, 300);}}
                        className="w-full bg-red-600 text-white py-2 rounded font-semibold text-xs hover:bg-red-700 transition">
                        Ir al Home
                    </button>
                </div>
            </div>
        </>
    );
}
