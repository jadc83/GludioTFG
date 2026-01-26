import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { usePage } from '@inertiajs/react';
import FormularioPago from '@/Components/pagos/FormularioPago';
dayjs.locale('es');

export default function ExtenderReserva({ reserva, onClose }) {
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';
    const [infoExtension, setInfoExtension] = useState(null);
    const [cargandoInfo, setCargandoInfo] = useState(true);
    const [diasSeleccionados, setDiasSeleccionados] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState(null);
    const [precioExtension, setPrecioExtension] = useState(null);
    const [mostrarPago, setMostrarPago] = useState(false);
    const [pagoConfirmado, setPagoConfirmado] = useState(false);

    // Obtener info de extensión al montar el componente
    useEffect(() => {
        const obtenerInfo = async () => {
            try {
                const response = await fetch(`/reservas/${reserva.localizador}/info-extension`);
                const data = await response.json();
                setInfoExtension(data);
            } catch (err) {
                setError('Error al obtener información');
            } finally {
                setCargandoInfo(false);
            }
        };

        obtenerInfo();
    }, [reserva.localizador]);

    if (cargandoInfo) {
        return (
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <div className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Cargando información de extensión...
                </div>
            </div>
        );
    }

    if (!infoExtension?.puede_extender) {
        return (
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Extensión no disponible</h3>
                <p className="text-gray-600">
                    {infoExtension?.razon || 'No se puede extender esta reserva'}
                </p>
            </div>
        );
    }

    const handleSeleccionarDias = async (dias) => {
        setDiasSeleccionados(dias);
        setError(null);
        setCargando(true);

        try {
            const response = await fetch(
                `/reservas/${reserva.localizador}/extender`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken,
                    },
                    body: JSON.stringify({
                        numero_dias: dias,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Error al calcular la extensión');
                setDiasSeleccionados(null);
                return;
            }

            // Mostrar precio de extensión
            const checkOutActual = dayjs(reserva.check_out);
            setPrecioExtension({
                dias,
                precio: data.precio_extension,
                fechaAnterior: checkOutActual.format('dddd DD/MM/YYYY'),
                fechaNueva: dayjs(data.nuevo_check_out).format('dddd DD/MM/YYYY'),
                necesitaPago: data.necesita_pago,
                mensaje: data.necesita_pago
                    ? 'Se procesará un pago adicional por los días extra'
                    : 'Se sumará al total de tu reserva pendiente de pago',
            });

            // Si necesita pago, mostrar formulario
            if (data.necesita_pago) {
                setMostrarPago(true);
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
            setDiasSeleccionados(null);
        } finally {
            setCargando(false);
        }
    };

    const handlePagoExitoso = async () => {
        setPagoConfirmado(true);

        // Confirmar la extensión en el backend después del pago
        try {
            const response = await fetch(
                `/reservas/${reserva.localizador}/extender`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken,
                    },
                    body: JSON.stringify({
                        numero_dias: diasSeleccionados,
                        confirmar: true,
                    }),
                }
            );

            const data = await response.json();

            if (data.nuevo_check_out) {
                onClose(data.nuevo_check_out);
            } else {
                onClose();
            }
        } catch (err) {
            onClose();
        }
    };

    const handleConfirmarSinPago = async () => {
        // Si no necesita pago (pago al llegar), confirmar directamente
        setCargando(true);
        try {
            const response = await fetch(
                `/reservas/${reserva.localizador}/extender`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': csrfToken,
                    },
                    body: JSON.stringify({
                        numero_dias: diasSeleccionados,
                        confirmar: true,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json();
                setError(data.error || 'Error al confirmar la extensión');
                setCargando(false);
                return;
            }

            const data = await response.json();
            setPagoConfirmado(true);

            // Ejecutar el callback inmediatamente con la nueva fecha
            if (data.nuevo_check_out) {
                onClose(data.nuevo_check_out);
            } else {
                onClose();
            }
        } catch (err) {
            setError('Error de conexión: ' + err.message);
            setCargando(false);
        }
    };

    // Mostrar formulario de pago
    if (mostrarPago && precioExtension) {
        return (
            <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4">💳 Pago de extensión</h3>

                <div className="bg-gris rounded-lg p-4 mb-6 space-y-2">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Días adicionales:</span>
                        <span className="font-semibold">{precioExtension.dias}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">Nuevo checkout:</span>
                        <span className="font-semibold capitalize">{precioExtension.fechaNueva}</span>
                    </div>
                    <div className="border-t pt-2 flex justify-between">
                        <span className="font-bold">Precio adicional:</span>
                        <span className="font-bold text-lg accent-1366">
                            €{precioExtension.precio.toFixed(2)}
                        </span>
                    </div>
                </div>

                {pagoConfirmado && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
                        ✅ Pago confirmado. Extensión completada.
                    </div>
                )}

                {!pagoConfirmado && (
                    <FormularioPago monto={precioExtension.precio} onPagoExitoso={handlePagoExitoso} onError={(err) => setError(err)}
                        reservaData={{ reserva_id: reserva.id, es_extension: true, monto_extension: precioExtension.precio }}/>

                )}
            </div>
        );
    }

    // Mostrar resumen después de seleccionar días (sin pago)
    if (precioExtension && !mostrarPago) {
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
                        <span className="text-gray-600">Días adicionales:</span>
                        <span className="font-semibold text-gray-800">
                            {precioExtension.dias} {precioExtension.dias === 1 ? 'día' : 'días'}
                        </span>
                    </div>
                    <div className="border-t pt-3 flex justify-between">
                        <span className="font-bold text-gray-800">Precio adicional:</span>
                        <span className="font-bold text-lg accent-1366">
                            €{precioExtension.precio.toFixed(2)}
                        </span>
                    </div>
                </div>

                {precioExtension.mensaje && (
                    <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-2 rounded-lg mb-4 text-sm">
                        ℹ️ {precioExtension.mensaje}
                    </div>
                )}

                {pagoConfirmado && (
                    <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-lg mb-4 text-sm">
                        ✅ Extensión completada.
                    </div>
                )}

                {!pagoConfirmado && (
                    <button onClick={handleConfirmarSinPago} disabled={cargando} className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:opacity-90 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {cargando ? 'Confirmando...' : 'Confirmar extensión'}
                    </button>
                )}

                {pagoConfirmado && (
                    <button onClick={onClose} className="w-full bg-black text-white font-semibold py-2 rounded-lg hover:opacity-90 transition mt-2">
                        Cerrar
                    </button>
                )}
            </div>
        );
    }

    // Mostrar selector de días
    return (
        <div className="bg-white rounded-xl shadow-xl p-6 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Ampliar reserva</h3>
            <p className="text-gray-600 text-sm mb-4">
                Checkout actual: <span className="font-semibold capitalize">
                    {dayjs(reserva.check_out).format('dddd DD/MM/YYYY')}
                </span>
            </p>

            {error && (
                <div className="text-gray-600 px-4 py-3 mb-4 text-sm">
                    <p className="font-semibold mb-1">Extensión no disponible</p>
                    <p>No es posible extender esta habitación en estos momentos.</p>
                    <p className="mt-2">Para conocer otras opciones, contacta con nuestra recepción:</p>
                    <div className="mt-3 flex flex-wrap gap-4 text-xs">
                        <p>📞 +34 91 234 5678</p>
                        <p>✉️ info@hotelgludio.com</p>
                        <p>⏰ Disponible 24 horas</p>
                    </div>
                </div>
            )}

            {!error && (
                <div className="mb-6">
                    <label className="block text-gray-700 font-semibold mb-3">
                        ¿Cuántos días más?
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        {[1, 2, 3].map((dias) => (
                            <button key={dias} onClick={() => handleSeleccionarDias(dias)} disabled={cargando}
                                className={`py-3 px-4 rounded-xl font-bold text-base transition duration-200 border-2 ${
                                    diasSeleccionados === dias
                                        ? 'bg-black text-white border-black shadow-lg scale-105'
                                        : 'bg-white text-gray-800 border-gray-200 hover:border-gray-400 hover:shadow-md'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}>
                                {dias}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {cargando && (
                <div className="text-center text-gray-600">
                    <span className="inline-block animate-spin mr-2">⌛</span>
                    Procesando...
                </div>
            )}
        </div>
    );
}
