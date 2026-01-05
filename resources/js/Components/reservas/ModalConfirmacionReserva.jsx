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
            <div
                className={`fixed inset-0 bg-black transition-opacity duration-300 ${
                    animarSalida ? 'opacity-0' : 'opacity-40'
                }`}
                onClick={handleClose}
                style={{ zIndex: 999 }}
            />

            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-2xl transition-all duration-300 w-full max-w-2xl mx-4 ${
                    animarSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                }`}
                style={{ zIndex: 1000 }}
            >
                {/* Header */}
                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-900">Reserva Confirmada</h2>
                    <p className="text-sm text-gray-500 mt-2">Tu pago ha sido procesado correctamente</p>
                </div>

                {/* Content */}
                <div className="px-8 pb-8 space-y-6">
                    {/* Localizador */}
                    <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-3">Número de Reserva</p>
                        <div className="bg-white border border-gray-200 p-5 rounded-lg text-center">
                            <p className="text-2xl font-mono font-bold text-gray-900">{reserva.localizador}</p>
                        </div>
                    </div>

                    {/* Detalles - Grid 2 columnas */}
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Huésped</p>
                            <p className="text-sm font-medium text-gray-900">{reserva.nombre}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Habitaciones</p>
                            <p className="text-sm font-medium text-gray-900">{reserva.cantidad_habitaciones}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Entrada</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(reserva.check_in).toLocaleDateString('es-ES')}</p>
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Salida</p>
                            <p className="text-sm font-medium text-gray-900">{new Date(reserva.check_out).toLocaleDateString('es-ES')}</p>
                        </div>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-gray-200" />

                    {/* Total pagado */}
                    <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Total Pagado</p>
                        <p className="text-3xl font-bold text-gray-900">{reserva.precio_total?.toFixed(2)} €</p>
                    </div>

                    {/* Información */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-900 leading-relaxed">Se ha enviado un correo de confirmación a tu dirección de correo electrónico. Conserva tu número de reserva para futuras referencias.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 p-6 flex gap-3">
                    <button
                        onClick={handleClose}
                        className="flex-1 bg-red-600 text-white py-2 rounded font-semibold text-sm hover:bg-red-700 transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </>
    );
}
