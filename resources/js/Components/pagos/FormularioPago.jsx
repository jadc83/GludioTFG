import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePage } from '@inertiajs/react';
import Campo from '@/Components/Campo';
import React, { useState, useMemo, useEffect } from 'react';

function FormularioPagoInterno({ reservaData, monto, onPagoExitoso, onError, aceptaTerminos = false }) {
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';
    const stripe = useStripe();
    const elements = useElements();
    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');

    // Obtener datos del usuario logueado
    const user = page?.props?.auth?.user;
    const [direccion, setDireccion] = useState(() => {
        const defaults = { calle: '', ciudad: '', codigo_postal: '', pais: 'ES' };

        if (reservaData && reservaData.direccion) {
            if (typeof reservaData.direccion === 'string') {
                return { ...defaults, calle: reservaData.direccion };
            }
            // Mezclar valores del objeto con los defaults
            return { ...defaults, ...reservaData.direccion };
        }

        return {
            calle: user?.direccion || '',
            ciudad: user?.ciudad || '',
            codigo_postal: user?.codigo_postal || '',
            pais: user?.pais || 'ES',
        };
    });

    // Si reservaData viene del formulario, queremos mostrar y editar los datos del huésped
    const [name, setName] = useState(reservaData?.name || user?.name || 'Huésped Hotel');
    const [email, setEmail] = useState(reservaData?.email || user?.email || '');
    const [telefono, setTelefono] = useState(reservaData?.telefono || user?.telefono || '');
    const [tipoDocumento, setTipoDocumento] = useState(reservaData?.tipo_documento || '');
    const [numeroDocumento, setNumeroDocumento] = useState(reservaData?.numero_documento || '');
    const [nacionalidad, setNacionalidad] = useState(reservaData?.nacionalidad || '');

    // Sincronizar si reservaData cambia después del montaje
    useEffect(() => {
        if (!reservaData) return;

        // Dirección: puede ser string u objeto
        if (reservaData.direccion) {
            if (typeof reservaData.direccion === 'string') {
                setDireccion((d) => ({ ...d, calle: reservaData.direccion }));
            } else if (typeof reservaData.direccion === 'object') {
                setDireccion((d) => ({ ...d, ...reservaData.direccion }));
            }
        }

        if (reservaData.name) setName(reservaData.name);
        if (reservaData.email) setEmail(reservaData.email);
        if (reservaData.telefono) setTelefono(reservaData.telefono);
        if (reservaData.tipo_documento) setTipoDocumento(reservaData.tipo_documento);
        if (reservaData.numero_documento) setNumeroDocumento(reservaData.numero_documento);
        if (reservaData.nacionalidad) setNacionalidad(reservaData.nacionalidad);
    }, [reservaData]);


    useEffect(() => {
        try {
            console.log('FormularioPago - auth.user:', user);
        } catch (e) {
            console.error('Error al acceder a user en FormularioPago:', e);
        }

        if (!user) return;

        setDireccion((prev) => {
            const next = { ...prev };
            if ((!next.ciudad || next.ciudad === '') && user.ciudad) next.ciudad = user.ciudad;
            if ((!next.codigo_postal || next.codigo_postal === '') && (user.codigo_postal || user.cp)) next.codigo_postal = user.codigo_postal || user.cp || '';
            return next;
        });
    }, [user]);

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
            // Crear una reserva nueva o usar una existente.
            // En caso de edición (es_edicion_pago) o extensión (es_extension) no crear Reserva.
            const esExtension = Boolean(reservaData?.es_extension || reservaData?.es_edicion_pago);
            let resId = reservaData?.reserva_id;

            if (!esExtension) {
                // PASO 1: Crear reserva (solo si no es extensión/edición)
                const datosReservaConDireccion = {
                    ...reservaData,
                    direccion: direccion,
                    name,
                    email,
                    telefono,
                    tipo_documento: tipoDocumento,
                    numero_documento: numeroDocumento,
                    nacionalidad,
                };

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
                resId = dataReserva.reserva_id;
                if (!resId) throw new Error('No se obtuvo ID de reserva');
            }

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

            // PASO 3: Procesar pago con Stripe
            const { paymentIntent, error } = await stripe.confirmCardPayment(newClientSecret, {
                    payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: {
                        name: name || reservaData.name || 'Huésped Hotel',
                        email: email || reservaData.email || undefined,
                        phone: telefono || reservaData.telefono || undefined,
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
        <div className="w-full text-xs md:text-[13px]">
            <form onSubmit={procesarPago} className="space-y-1">
                {procesando && (
                    <div className="bg-blue-100 border border-blue-300 rounded-lg p-3 text-center">
                        <div className="flex justify-center mb-2">
                            <div className="inline-block animate-spin">
                                <div className="w-5 h-5 border-2 border-blue-300 border-t-blue-600 rounded-full"></div>
                            </div>
                        </div>
                        <p className="text-xs font-medium text-blue-900">Procesando pago...</p>
                        <p className="text-xs text-blue-700 mt-0.5">No cierres esta ventana</p>
                    </div>
                )}

                {/* Dirección de Facturación */}
                <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Dirección de Facturación
                    </label>

                    <div className="mb-1">
                        <Campo
                            id="direccion_calle"
                            name="direccion_calle"
                            value={direccion.calle}
                            onChange={(e) => setDireccion({...direccion, calle: e.target.value})}
                            placeholder="Calle y número"
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-1">
                        <Campo
                            id="direccion_ciudad"
                            name="direccion_ciudad"
                            value={direccion.ciudad}
                            onChange={(e) => setDireccion({...direccion, ciudad: e.target.value})}
                            placeholder="Ciudad"
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                            required
                        />
                        <Campo
                            id="direccion_codigo_postal"
                            name="direccion_codigo_postal"
                            value={direccion.codigo_postal}
                            onChange={(e) => setDireccion({...direccion, codigo_postal: e.target.value})}
                            placeholder="Código Postal"
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                            required
                        />
                        <select value={direccion.pais} onChange={(e) => setDireccion({...direccion, pais: e.target.value})}
                            className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition bg-white">
                            <option value="ES">España</option>
                            <option value="FR">Francia</option>
                            <option value="PT">Portugal</option>
                            <option value="IT">Italia</option>
                            <option value="DE">Alemania</option>
                            <option value="GB">Reino Unido</option>
                        </select>
                    </div>

                    {/* Si venimos del formulario, mostrar datos del huésped junto a la dirección */}
                    {(reservaData?.name || reservaData?.email || reservaData?.telefono) && (
                        <div className="mt-2">
                            <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                                Datos del Huésped
                            </label>

                            <div className="mb-1">
                                <Campo
                                    id="huésped_nombre"
                                    name="huésped_nombre"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Nombre completo"
                                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-1">
                                <Campo
                                    id="huésped_email"
                                    name="huésped_email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                    required
                                />
                                <Campo
                                    id="huésped_telefono"
                                    name="huésped_telefono"
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    placeholder="Teléfono"
                                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                    required
                                />
                                <Campo
                                    id="huésped_nacionalidad"
                                    name="huésped_nacionalidad"
                                    value={nacionalidad}
                                    onChange={(e) => setNacionalidad(e.target.value)}
                                    placeholder="Nacionalidad"
                                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-1 mt-1">
                                <select value={tipoDocumento} onChange={(e) => setTipoDocumento(e.target.value)}
                                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition bg-white">
                                    <option value="">Tipo Documento</option>
                                    <option value="dni">DNI</option>
                                    <option value="pasaporte">Pasaporte</option>
                                    <option value="otro">Otro</option>
                                </select>
                                <Campo
                                    id="huésped_numero_documento"
                                    name="huésped_numero_documento"
                                    value={numeroDocumento}
                                    onChange={(e) => setNumeroDocumento(e.target.value)}
                                    placeholder="Número de documento"
                                    className="px-2 py-1 border border-gray-300 rounded-lg text-xs focus:outline-none focus:border-gray-500 focus:ring-2 focus:ring-gray-200 transition"
                                />
                            </div>
                        </div>
                    )}
                </div>



                {/* Datos de la tarjeta */}
                <div>
                    <label className="block text-[11px] font-semibold text-gray-600 uppercase tracking-wider mb-1">
                        Datos de la Tarjeta
                    </label>
                    <div className="border border-gray-300 rounded-lg p-2 bg-white">
                        <CardElement
                            options={{
                                hidePostalCode: true,
                                style: {
                                    base: {
                                        fontSize: '12px',
                                        color: '#1f2937',
                                        fontFamily: '"Inter", sans-serif',
                                        '::placeholder': {
                                            color: '#9ca3af',
                                        },
                                    },
                                    invalid: {
                                        color: '#dc2626',
                                    },
                                },
                            }}
                        />
                    </div>
                </div>

                {/* Mensaje de estado */}
                {mensaje && (
                    <div className={`rounded-lg p-3 text-xs border ${
                        mensaje.includes('Error') ? 'bg-red-100 border-red-300 text-red-800' : 'bg-green-100 border-green-300 text-green-800'  }`}>
                        <p className="font-medium mb-0.5">
                            {mensaje.includes('Error') ? 'Error' : 'Éxito'}
                        </p>
                        <p className="opacity-90">{mensaje}</p>
                    </div>
                )}

                {/* Botón de confirmación */}
                <button type="submit" disabled={procesando || !stripe || !aceptaTerminos}
                    className={`w-full py-2 rounded-lg font-semibold text-xs uppercase tracking-wider transition-all duration-200 ${
                        procesando || !stripe || !aceptaTerminos ? 'bg-gray-400 text-gray-600 cursor-not-allowed' : 'bg-black text-white hover:bg-[#7a0202] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2'
                    }`}>
                    {procesando ? 'Procesando pago...' : 'Confirmar Pago'}
                </button>

                {!aceptaTerminos && (
                    <p className="text-xs text-red-600 mt-1">Debes aceptar los términos y condiciones para continuar.</p>
                )}
            </form>
        </div>
    );
}

export default function FormularioPago({ reservaData, monto, onPagoExitoso, onError, aceptaTerminos = false }) {
    const stripePromise = useMemo(() => loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY), []);

    return (
        <Elements stripe={stripePromise}>
            <FormularioPagoInterno reservaData={reservaData} monto={monto} onPagoExitoso={onPagoExitoso} onError={onError} aceptaTerminos={aceptaTerminos} />
        </Elements>
    );
}
