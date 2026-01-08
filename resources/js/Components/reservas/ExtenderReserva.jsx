import { useState } from 'react';
import { router } from '@inertiajs/react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
dayjs.locale('es');

export default function ExtenderReserva({ reserva, onClose }) {
    const [nuevoCheckOut, setNuevoCheckOut] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [precioExtension, setPrecioExtension] = useState(null);

    // Calcular horas hasta checkout
    const checkOutActual = dayjs(reserva.check_out);
    const ahora = dayjs();
    const horasHasta = checkOutActual.diff(ahora, 'hour');
    const puedeExtender = horasHasta < 24;

    if (!puedeExtender) {
        return (
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-2">❌ Extensión no disponible</h3>
                <p className="text-gray-600">
                    La extensión solo está disponible 24 horas antes del checkout.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                    Tiempo restante: {horasHasta} horas
                </p>
            </div>
        );
    }

    const handleExtender = async () => {
        if (!nuevoCheckOut) {
            setError('Selecciona una fecha de checkout');
            return;
        }

        const fechaNueva = dayjs(nuevoCheckOut);
        if (fechaNueva.lte(checkOutActual)) {
            setError('La nueva fecha debe ser posterior a la actual');
            return;
        }

        setCargando(true);
        setError(null);

        try {
            const response = await fetch(
                `/reservas/${reserva.localizador}/extender`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content,
                    },
                    body: JSON.stringify({
                        nuevo_check_out: nuevoCheckOut,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Error al extender la reserva');
                return;
            }

            // Mostrar resumen de la extensión
            const noches = fechaNueva.diff(checkOutActual, 'day');
            setPrecioExtension({
                noches,
                precio: data.precio_extension,
                fechaAnterior: checkOutActual.format('dddd DD/MM/YYYY'),
                fechaNueva: fechaNueva.format('dddd DD/MM/YYYY'),
            });
        } catch (err) {
            setError('Error de conexión: ' + err.message);
        } finally {
            setCargando(false);
        }
    };

    if (precioExtension) {
        return (
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">✅ Extensión confirmada</h3>

                <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Checkout anterior:</span>
                        <span className="font-semibold text-gray-800 capitalize">
                            {precioExtension.fechaAnterior}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Nuevo checkout:</span>
                        <span className="font-semibold text-gray-800 capitalize">
                            {precioExtension.fechaNueva}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Noches adicionales:</span>
                        <span className="font-semibold text-gray-800">
                            {precioExtension.noches} {precioExtension.noches === 1 ? 'noche' : 'noches'}
                        </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                        <span className="font-bold text-gray-800">Precio adicional:</span>
                        <span className="font-bold text-lg" style={{ color: '#7a0202' }}>
                            €{precioExtension.precio.toFixed(2)}
                        </span>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:opacity-90 transition"
                >
                    Cerrar
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-2">🏨 Extender estadía</h3>
            <p className="text-gray-600 text-sm mb-4">
                Checkout actual: <span className="font-semibold capitalize">
                    {checkOutActual.format('dddd DD/MM/YYYY')}
                </span>
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg mb-4 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-4 mb-4">
                <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                        Nuevo checkout
                    </label>
                    <input
                        type="date"
                        value={nuevoCheckOut}
                        onChange={(e) => setNuevoCheckOut(e.target.value)}
                        min={checkOutActual.add(1, 'day').format('YYYY-MM-DD')}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none"
                        style={{ borderColor: '#7a0202' }}
                    />
                </div>

                {nuevoCheckOut && dayjs(nuevoCheckOut).isValid() && (
                    <div className="bg-gris rounded-lg p-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Noches adicionales:</span>
                            <span className="font-semibold">
                                {dayjs(nuevoCheckOut).diff(checkOutActual, 'day')} noches
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <button
                onClick={handleExtender}
                disabled={cargando || !nuevoCheckOut}
                className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {cargando ? 'Procesando...' : 'Solicitar extensión'}
            </button>
        </div>
    );
}
