import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePage } from '@inertiajs/react';
import React, { useState } from 'react';
import PrimaryButton from '../PrimaryButton';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function FormularioPagoInterno({ reservaData, monto, onPagoExitoso, onError }) {
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';
    const stripe = useStripe();
    const elements = useElements();
    const [procesando, setProcesando] = useState(false);
    const [clientSecret, setClientSecret] = useState(null);
    const [pagoId, setPagoId] = useState(null);
    const [reservaId, setReservaId] = useState(null);
    const [localizador, setLocalizador] = useState(null);
    const [mensaje, setMensaje] = useState('');
    const [iniciado, setIniciado] = useState(false);

    // Obtener datos del usuario logueado
    const user = page?.props?.auth?.user;

    // Estado para dirección de facturación - pre-rellenado con datos del usuario si existe
    const [direccion, setDireccion] = useState({
        calle: user?.direccion || '',
        ciudad: user?.ciudad || '',
        codigo_postal: user?.codigo_postal || '',
        pais: user?.pais || 'ES',
    });

    // Auto-iniciar al montar el componente
    React.useEffect(() => {
        if (!iniciado && !clientSecret) {
            crearReservaYPaymentIntent();
            setIniciado(true);
        }

        // Suprimir errores de telemetría de Stripe bloqueados
        const handleUnhandledRejection = (event) => {
            if (event.reason?.message?.includes('Failed to fetch') && event.reason?.message?.includes('r.stripe.com')) {
                event.preventDefault();
            }
        };

        window.addEventListener('unhandledrejection', handleUnhandledRejection);
        return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    }, []);

    // Crear reserva y PaymentIntent
    const crearReservaYPaymentIntent = async () => {
        try {
            setProcesando(true);

            // Primero crear la reserva
            const resReserva = await fetch('/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(reservaData),
            });

            if (!resReserva.ok) {
                let errorMessage = `HTTP ${resReserva.status}: Error al crear la reserva`;
                try {
                    const contentType = resReserva.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const error = await resReserva.json();
                        errorMessage = error.message || error.error || errorMessage;
                    } else {
                        const text = await resReserva.text();
                        console.error('Response no-JSON de /reservas:', text.substring(0, 500));
                        errorMessage = `Error del servidor al crear reserva (HTTP ${resReserva.status})`;
                    }
                } catch (e) {
                    console.error('Error al parsear respuesta de reserva:', e);
                }
                throw new Error(errorMessage);
            }

            const dataReserva = await resReserva.json();

            if (!dataReserva.success && !dataReserva.reserva_id) {
                throw new Error(dataReserva.message || 'No se recibió el ID de la reserva');
            }

            console.log('✅ Reserva creada:', { reserva_id: dataReserva.reserva_id, localizador: dataReserva.localizador });
            setReservaId(dataReserva.reserva_id);
            setLocalizador(dataReserva.localizador);

            // Luego crear el payment intent
            const res = await fetch('/pagos/crear-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    reserva_id: dataReserva.reserva_id,
                    monto: monto,
                }),
            });

            if (!res.ok) {
                let errorMessage = `HTTP ${res.status}: Error al crear PaymentIntent`;
                try {
                    const contentType = res.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const errorData = await res.json();
                        errorMessage = errorData.error || errorData.message || errorMessage;
                    } else {
                        const text = await res.text();
                        console.error('Response no-JSON:', text.substring(0, 500));
                        errorMessage = `Error del servidor (HTTP ${res.status}). Verifica la consola del servidor.`;
                    }
                } catch (e) {
                    console.error('Error al parsear respuesta de error:', e);
                }
                throw new Error(errorMessage);
            }

            const data = await res.json();

            if (!data.success) {
                throw new Error(data.error || 'Error al crear PaymentIntent');
            }

            setClientSecret(data.clientSecret);
            setPagoId(data.pago_id);
            setProcesando(false);
        } catch (err) {
            console.error('Stripe PaymentIntent Error:', err);
            setMensaje(`Error: ${err.message}`);
            onError(err.message);
            setProcesando(false);
        }
    };

    // Procesar pago
    const procesarPago = async (e) => {
        e.preventDefault();

        if (!stripe || !elements || !clientSecret) {
            setMensaje('El formulario no está completamente cargado');
            return;
        }

        setProcesando(true);

        try {
            // Confirmar pago
            const { paymentIntent, error } = await stripe.confirmCardPayment(clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: reservaData.name || 'Huésped Hotel',
                        address: {
                            line1: direccion.calle,
                            city: direccion.ciudad,
                            postal_code: direccion.codigo_postal,
                            country: direccion.pais,
                        },
                    },
                },
            });

            if (error) {
                setMensaje(`Error en el pago: ${error.message}`);
                onError(error.message);
                setProcesando(false);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                // Confirmar pago en backend
                const res = await fetch('/pagos/confirmar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        pago_id: pagoId,
                    }),
                });

                if (!res.ok) throw new Error('Error al confirmar pago');

                const data = await res.json();
                console.log('💳 Pago confirmado en backend:', data);
                setMensaje('¡Pago completado exitosamente!');
                // Pasar localizador junto con otros datos al callback
                onPagoExitoso({ ...data, localizador });
            } else {
                setMensaje('El pago no se pudo procesar');
                onError('El pago no se pudo procesar');
            }
        } catch (err) {
            setMensaje(`Error: ${err.message}`);
            onError(err.message);
        }

        setProcesando(false);
    };

    return (
        <div className="w-full">
            {!clientSecret ? (
                <div className="space-y-2 text-center py-2">
                    <div className="text-sm text-gray-600">
                        <p>Preparando pago...</p>
                        <div className="mt-2 flex justify-center">
                            <div className="inline-block animate-spin">
                                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <form onSubmit={procesarPago} className="space-y-3">
                    <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-700">Monto a pagar:</span>
                            <span className="text-lg font-bold text-gray-900">{monto.toFixed(2)} €</span>
                        </div>
                    </div>

                    {/* Dirección de Facturación */}
                    <div className="border border-gray-300 rounded-lg p-3 bg-white">
                        <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-3">
                            Dirección de Facturación
                        </label>

                        <div className="mb-3">
                            <input
                                type="text"
                                placeholder="Calle y número"
                                value={direccion.calle}
                                onChange={(e) => setDireccion({...direccion, calle: e.target.value})}
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <input
                                type="text"
                                placeholder="Ciudad"
                                value={direccion.ciudad}
                                onChange={(e) => setDireccion({...direccion, ciudad: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Código Postal"
                                value={direccion.codigo_postal}
                                onChange={(e) => setDireccion({...direccion, codigo_postal: e.target.value})}
                                className="px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
                                required
                            />
                        </div>

                        <select
                            value={direccion.pais}
                            onChange={(e) => setDireccion({...direccion, pais: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-red-600"
                        >
                            <option value="ES">España</option>
                            <option value="FR">Francia</option>
                            <option value="PT">Portugal</option>
                            <option value="IT">Italia</option>
                            <option value="DE">Alemania</option>
                            <option value="GB">Reino Unido</option>
                        </select>
                    </div>

                    <div className="border border-gray-300 rounded-lg p-3 bg-white">
                        <label className="block text-xs font-medium text-gray-700 mb-2">
                            Datos de la tarjeta
                        </label>
                        <CardElement
                            options={{
                                hidePostalCode: true,
                                style: {
                                    base: {
                                        fontSize: '14px',
                                        color: '#424770',
                                        fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif',
                                        '::placeholder': {
                                            color: '#aab7c4',
                                        },
                                    },
                                    invalid: {
                                        color: '#fa755a',
                                    },
                                },
                            }}
                        />
                    </div>

                    {mensaje && (
                        <div className={`p-2 rounded text-xs ${
                            mensaje.includes('Error')
                                ? 'bg-red-50 border border-red-200 text-red-700'
                                : 'bg-green-50 border border-green-200 text-green-700'
                        }`}>
                            {mensaje}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={procesando || !stripe}
                        className={`w-full py-2 px-3 rounded font-medium text-sm transition ${
                            procesando || !stripe
                                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                                : 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800'
                        }`}
                    >
                        {procesando ? 'Procesando pago...' : 'Confirmar pago'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default function FormularioPago({ reservaData, monto, onPagoExitoso, onError }) {
    return (
        <Elements stripe={stripePromise}>
            <FormularioPagoInterno
                reservaData={reservaData}
                monto={monto}
                onPagoExitoso={onPagoExitoso}
                onError={onError}
            />
        </Elements>
    );
}
