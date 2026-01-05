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
                    animarSalida ? 'opacity-0' : 'opacity-30'
                }`}
                onClick={handleClose}
                style={{ zIndex: 999 }}
            />

            {/* Modal */}
            <div
                className={`fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded shadow transition-all duration-300 max-w-md w-full mx-4 ${
                    animarSalida ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                }`}
                style={{ zIndex: 1000 }}
            >
                {/* Header - Estilo simple como el resto del sitio */}
                <div className="bg-gris border-b border-gray-300 p-4 rounded-t text-center">
                    <h2 className="text-xl font-bold text-gray-800">✓ Reserva Confirmada</h2>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                    {/* Localizador - Destacado */}
                    <div className="text-center bg-gris p-3 rounded border-l-4 border-red-600">
                        <p className="text-xs text-gray-600 mb-1">Identificador de reserva</p>
                        <p className="text-lg font-mono font-bold text-gray-800">{reserva.localizador}</p>
                    </div>

                    {/* Detalles en tabla simple */}
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-700">Huésped:</span>
                            <span className="font-semibold">{reserva.nombre}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Check-in:</span>
                            <span className="font-semibold">{new Date(reserva.check_in).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Check-out:</span>
                            <span className="font-semibold">{new Date(reserva.check_out).toLocaleDateString('es-ES')}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-700">Habitaciones:</span>
                            <span className="font-semibold">{reserva.cantidad_habitaciones}</span>
                        </div>
                        <hr className="border-gray-200 my-2" />
                        <div className="flex justify-between">
                            <span className="text-gray-700 font-semibold">Monto pagado:</span>
                            <span className="font-bold text-gray-800">{reserva.precio_total?.toFixed(2)} €</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-300 p-4 bg-gris rounded-b text-center">
                    <button
                        onClick={handleClose}
                        className="w-full bg-red-600 text-white py-2 rounded font-medium hover:bg-red-700 transition"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </>
    );
}
