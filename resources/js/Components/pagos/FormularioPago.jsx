import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePage } from '@inertiajs/react';
import { formatearMoneda } from '@/utils/formatters';
import React, { useState, useMemo } from 'react';
import PrimaryButton from '../PrimaryButton';

function FormularioPagoInterno({ reservaData, monto, onPagoExitoso, onError }) {
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';
    const stripe = useStripe();
    const elements = useElements();
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    // Obtener datos del usuario logueado
    const user = page?.props?.auth?.user;

    // Estado para dirección de facturación - pre-rellenado con datos del usuario si existe
    const [direccion, setDireccion] = useState({
        calle: user?.direccion || '',
        ciudad: user?.ciudad || '',
        codigo_postal: user?.codigo_postal || '',
        pais: user?.pais || 'ES',
    });

    // Procesar pago completo en un submit
    const procesarPago = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) {
            console.error('Stripe o elements no cargados');
            setMensaje('El formulario no está completamente cargado');
            return;
        }

        setProcesando(true);

        try {
            // PASO 1: Crear reserva
            const datosReservaConDireccion = { ...reservaData, direccion: direccion};

            console.log('📤 Enviando datos de reserva:', datosReservaConDireccion);

            const resReserva = await fetch('/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(datosReservaConDireccion),
            });

            if (!resReserva.ok) {
                const contentType = resReserva.headers.get('content-type');
                let errorMessage = `HTTP ${resReserva.status}`;
                if (contentType?.includes('application/json')) {
                    const error = await resReserva.json();
                    console.error('Error de servidor:', error);
                    errorMessage = error.message || error.error || errorMessage;
                } else {
                    const text = await resReserva.text();
                    console.error('Error de texto:', text);
                    errorMessage = `Error ${resReserva.status}`;
                }
                throw new Error(errorMessage);
            }

            const dataReserva = await resReserva.json();
            const resId = dataReserva.reserva_id;
            if (!resId) throw new Error('No se obtuvo ID de reserva');

            // PASO 2: Crear PaymentIntent
            const resPI = await fetch('/pagos/crear-payment-intent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    reserva_id: resId,
                    monto: monto,
                }),
            });

            if (!resPI.ok) {
                const contentType = resPI.headers.get('content-type');
                let errorMessage = `HTTP ${resPI.status}`;
                if (contentType?.includes('application/json')) {
                    const error = await resPI.json();
                    errorMessage = error.message || error.error || errorMessage;
                } else {
                    const text = await resPI.text();
                    console.error('Response error:', text.substring(0, 500));
                }
                throw new Error(errorMessage);
            }

            const dataPI = await resPI.json();
            if (!dataPI.success) throw new Error(dataPI.error || 'Error al crear PaymentIntent');

            const newClientSecret = dataPI.clientSecret;
            const newPagoId = dataPI.pago_id;
            console.log('✅ PaymentIntent creado:', newClientSecret);

            // PASO 3: Procesar pago con Stripe
            console.log('🔄 Procesando pago con Stripe...');
            const { paymentIntent, error } = await stripe.confirmCardPayment(newClientSecret, {
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
                setMensaje(`Error: ${error.message}`);
                onError(error.message);
                setProcesando(false);
                return;
            }

            if (paymentIntent.status === 'succeeded') {
                const res = await fetch('/pagos/confirmar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': csrfToken,
                    },
                    body: JSON.stringify({
                        payment_intent_id: paymentIntent.id,
                        pago_id: newPagoId,
                    }),
                });

                if (!res.ok) throw new Error('Error al confirmar');

                const data = await res.json();
                setMensaje('¡Pago completado!');
                onPagoExitoso(data);
            } else {
                setMensaje('Pago no completado');
                onError('Pago no completado');
            }
        } catch (err) {
            setMensaje(`Error: ${err.message}`);
            onError(err.message);
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="w-full">
            <form onSubmit={procesarPago} className="space-y-3">
                {procesando && (
                    <div className="space-y-2 text-center py-2">
                        <div className="text-sm text-gray-600">
                            <p>Procesando pago...</p>
                            <div className="mt-2 flex justify-center">
                                <div className="inline-block animate-spin">
                                    <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-medium text-gray-700">Monto a pagar:</span>
                        <span className="text-base font-bold text-gray-900">{formatearMoneda(monto)}</span>
                    </div>
                </div>

                {/* Dirección de Facturación */}
                <div className="rounded-lg p-2 bg-gris">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-2">
                        Dirección de Facturación
                    </label>

                    <div className="mb-2">
                        <input
                            type="text"
                            placeholder="Calle y número"
                            value={direccion.calle}
                            onChange={(e) => setDireccion({...direccion, calle: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-red-600"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-2">
                        <input
                            type="text"
                            placeholder="Ciudad"
                            value={direccion.ciudad}
                            onChange={(e) => setDireccion({...direccion, ciudad: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-red-600"
                            required
                        />
                        <input
                            type="text"
                            placeholder="Código Postal"
                            value={direccion.codigo_postal}
                            onChange={(e) => setDireccion({...direccion, codigo_postal: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-red-600"
                            required
                        />
                        <select
                            value={direccion.pais}
                            onChange={(e) => setDireccion({...direccion, pais: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:border-red-600"
                        >
                            <option value="ES">España</option>
                            <option value="FR">Francia</option>
                            <option value="PT">Portugal</option>
                            <option value="IT">Italia</option>
                            <option value="DE">Alemania</option>
                            <option value="GB">Reino Unido</option>
                        </select>
                    </div>
                </div>

                <div className="rounded-lg p-3 bg-white">
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
        </div>
    );
}

export default function FormularioPago({ reservaData, monto, onPagoExitoso, onError }) {
    // Cachear la Promise de Stripe para que no cambie en cada render
    const stripePromise = useMemo(() => loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY), []);

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
