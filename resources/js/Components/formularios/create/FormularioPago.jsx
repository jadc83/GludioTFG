import Campo from '@/Components/reservas/utilidades/Campo';
import Modal from '@/Components/Modal';
import { usePage } from '@inertiajs/react';

import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { crearCheckoutSession } from '@/api/pagos';
import usePayments from '@/hooks/pagos/usePayments';
import { useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import { processPaymentIntentResult as processPaymentIntentResultHelper } from '@/utils/pagos/processPaymentIntentResult';

function FormularioPagoInterno({
    reservaData,
    monto,
    onPagoExitoso,
    onError = () => {},
    aceptaTerminos = false,
    mostrarAceptacion = false,
    onCambioAceptaTerminos = null,
}) {
    const page = usePage();
    const csrfToken =
        page?.props?.csrf_token ||
        document.querySelector('meta[name="csrf-token"]')?.content ||
        '';


    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [acepta, setAcepta] = useState(aceptaTerminos);
    const [fieldErrors, setFieldErrors] = useState({});
    const [debugErrorJson, setDebugErrorJson] = useState(null);

    const { createPaymentIntent, confirmarPaymentIntent } = usePayments();

    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || page?.props?.stripe_public || null;
    const stripePromise = useMemo(() => (stripePublicKey ? loadStripe(stripePublicKey) : null), [stripePublicKey]);

    const [piClientSecret, setPiClientSecret] = useState(null);
    const [piPaymentIntentId, setPiPaymentIntentId] = useState(null);
    const [showCardForm, setShowCardForm] = useState(false);

    // Manejo de clientes existentes (409)
    const [clienteExistente, setClienteExistente] = useState(null);
    const [showClienteModal, setShowClienteModal] = useState(false);
    const crearPayloadRef = useRef(null);

    useEffect(() => {
        setAcepta(aceptaTerminos);
    }, [aceptaTerminos]);

    const user = page?.props?.auth?.user;
    // Dirección retirada del formulario: no almacenamos ni pedimos calle/ciudad/código/pais aquí

    const [name, setName] = useState(reservaData?.name || user?.name || '');
    const [email, setEmail] = useState(reservaData?.email || user?.email || '');
    const [telefono, setTelefono] = useState(
        reservaData?.telefono || user?.telefono || '',
    );

    // Refs for focusing invalid fields
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const telefonoRef = useRef(null);

    // Continuación del flujo de pago después de crear la reserva
    const continuarConPago = async (reservaId, monto) => {
        let dataPI = null;
        try {
            const resPI = await createPaymentIntent(reservaId, monto);
            dataPI = resPI;
            if (!dataPI || dataPI.success === false) throw new Error(dataPI?.error || 'Error en comunicación');
        } catch (err) {
            const message = err?.message || err?.error || 'Error en comunicación';
            throw new Error(message);
        }

        // If server already confirmed the PaymentIntent (e.g. local test confirm),
        // delegate to helper which will call confirmarPaymentIntent and onPagoExitoso
        const handled = await processPaymentIntentResultHelper({ dataPI, confirmarPaymentIntent, onPagoExitoso });
        if (handled) return;


        if (!telefono || !telefono.trim()) {
            setMensaje('Por favor, ingresa tu teléfono.');
            telefonoRef.current?.focus();
            setProcesando(false);
            return;
        }

        setProcesando(true);
        let crearPayload = null;
        try {
            setFieldErrors({});
            setDebugErrorJson(null);
            const esExtension = Boolean(
                reservaData?.es_extension || reservaData?.es_edicion_pago,
            );
            let resId = reservaData?.reserva_id;

            if (!esExtension) {
                const service = await import('@/hooks/reservas/service');
                const nuevoPayload = { ...reservaData, name, email, telefono };
                crearPayloadRef.current = nuevoPayload;
                try {
                    const dataReserva = await service.crearReserva(
                        crearPayloadRef.current,
                    );

                    // Handle expected error shape: { success: false, error: 'message' }
                    if (!dataReserva) {
                        console.error('crearReserva returned null/undefined:', dataReserva);
                        throw new Error('No se pudo crear la reserva. Respuesta vacía del servidor.');
                    }

                    if (dataReserva.success === false) {
                        const serverMsg = dataReserva.error || dataReserva.message || JSON.stringify(dataReserva);
                        console.error('crearReserva responded with success=false:', dataReserva);
                        throw new Error(serverMsg);
                    }

                    // Validate response: must contain reserva_id (or nested reserva)
                    if (!dataReserva.reserva_id && !(dataReserva.reserva && dataReserva.reserva.id)) {
                        console.error('crearReserva returned invalid response:', dataReserva);
                        throw new Error('No se pudo crear la reserva. Respuesta inesperada del servidor.');
                    }

                    resId = dataReserva.reserva_id ?? dataReserva.reserva?.id ?? resId;
                } catch (err) {
                    if (err && err.status === 409 && err.cliente_existente) {
                        setClienteExistente(err.cliente_existente);
                        setShowClienteModal(true);
                        throw err;
                    }
                    // Re-throw with friendly message if it's a generic Error
                    if (err instanceof Error && !err.status) {
                        throw err;
                    }
                    throw err;
                }
            }

            await continuarConPago(resId, monto);
        } catch (err) {
            // If the backend returned validation errors (422), they are usually in err.errors
            if (err && typeof err === 'object' && err.errors) {
                setFieldErrors(err.errors || {});

                // Friendly handling for missing dates (backend returns check_in/check_out required)
                const hasCheckIn = Object.prototype.hasOwnProperty.call(
                    err.errors,
                    'check_in',
                );
                const hasCheckOut = Object.prototype.hasOwnProperty.call(
                    err.errors,
                    'check_out',
                );
                if (hasCheckIn || hasCheckOut) {
                    setMensaje('Selecciona fechas de entrada y salida.');
                    // Notify parent UI to open/scroll to date selector if it wants to
                    try {
                        if (typeof window !== 'undefined')
                            window.dispatchEvent(
                                new CustomEvent('faltanFechas', { detail: {} }),
                            );
                    } catch (e) {}
                } else {
                    const joined = Object.values(err.errors).flat().join('; ');
                    setMensaje(joined || err.message || 'Error de validación');
                }

                try {
                    if (typeof onError === 'function')
                        onError(
                            err?.message ||
                                Object.values(err?.errors || {})
                                    .flat()
                                    .join('; ') ||
                                JSON.stringify(err),
                        );
                } catch (cbErr) {
                    console.error('onError callback threw', cbErr);
                }
            } else {
                const msg =
                    err?.message ||
                    err?.error ||
                    (err && err.error && err.error.message) ||
                    'Error procesando pago';
                setMensaje(msg);
                try {
                    if (typeof onError === 'function')
                        onError(msg || err?.message || JSON.stringify(err));
                } catch (cbErr) {
                    console.error('onError callback threw', cbErr);
                }
            }

            // Autoselect/focus first invalid field for better UX
            setTimeout(() => {
                const errorsObj =
                    err && err.errors ? err.errors : fieldErrors || {};
                const order = ['name', 'email', 'telefono'];
                const first = order.find((k) =>
                    Object.prototype.hasOwnProperty.call(errorsObj, k),
                );
                try {
                    if (first === 'name') {
                        nameRef.current?.focus();
                        nameRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        });
                    } else if (first === 'email') {
                        emailRef.current?.focus();
                        emailRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        });
                    } else if (first === 'telefono') {
                        telefonoRef.current?.focus();
                        telefonoRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                        });
                    }
                } catch (e) {
                    /* noop */
                }
            }, 50);

            // Store debug JSON for developer inspection (copy-able)
            try {
                setDebugErrorJson(
                    JSON.stringify(
                        { error: err, payload: crearPayloadRef.current },
                        null,
                        2,
                    ),
                );
            } catch (e) {
                setDebugErrorJson(String(err));
            }
        } finally {
            setProcesando(false);
        }
    };

    // Reintentar usando el cliente existente (respuesta 409)
    const retryUsingExistingClient = async () => {
        if (!clienteExistente || !crearPayloadRef.current) return;
        setShowClienteModal(false);
        setProcesando(true);
        try {
            const service = await import('@/hooks/reservas/service');
            crearPayloadRef.current = {
                ...(crearPayloadRef.current || {}),
                reservable_id: clienteExistente.id,
            };
            const dataReserva = await service.crearReserva(
                crearPayloadRef.current,
            );
            setClienteExistente(null);
            await continuarConPago(dataReserva.reserva_id, monto);
        } catch (err) {
            setMensaje(
                err?.message || 'Error al crear reserva con cliente existente',
            );
            try {
                setDebugErrorJson(
                    JSON.stringify(
                        { error: err, payload: crearPayloadRef.current },
                        null,
                        2,
                    ),
                );
            } catch (e) {
                /* noop */
            }
        } finally {
            setProcesando(false);
        }
    };

    const editClientDocument = () => {
        setShowClienteModal(false);
        setMensaje('Edita el documento para continuar');
        try {
            if (typeof window !== 'undefined')
                window.dispatchEvent(
                    new CustomEvent('editarDocumento', {
                        detail: {
                            numero_documento:
                                clienteExistente?.numero_documento,
                        },
                    }),
                );
        } catch (e) {}
    };

    // Componente interno: formulario de tarjeta para confirmar PaymentIntent
    function CardConfirmForm({ clientSecret, paymentIntentId, onSuccess, onError, name, email }) {
        const stripe = useStripe();
        const elements = useElements();
        const [loadingConfirm, setLoadingConfirm] = useState(false);
        const { confirmarPaymentIntent: confirmarPI } = usePayments();

        const handleConfirm = async () => {
            if (!stripe || !elements) {
                onError && onError('Stripe no inicializado');
                return;
            }
            setLoadingConfirm(true);
            const card = elements.getElement(CardElement);
            try {
                const res = await stripe.confirmCardPayment(clientSecret, {
                    payment_method: {
                        card,
                        billing_details: { name: name || '', email: email || '' },
                    },
                });

                if (res.error) {
                    onError && onError(res.error.message || 'Error confirmando el pago');
                    setLoadingConfirm(false);
                    return;
                }

                if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
                    const backendResp = await confirmarPI(paymentIntentId);
                    if (backendResp && backendResp.success) {
                        onSuccess && onSuccess({ pago_id: backendResp.pago_id, paymentIntentId });
                    } else {
                        onError && onError(backendResp?.error || 'Confirmado en Stripe, pero fallo al notificar al backend');
                    }
                } else {
                    onError && onError('Pago no confirmado');
                }
            } catch (e) {
                onError && onError(e?.message || String(e));
            } finally {
                setLoadingConfirm(false);
            }
        };

        return (
            <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Datos de tarjeta</label>
                <div className="mt-2 rounded-md border border-gray-200 p-3">
                    <CardElement options={{ hidePostalCode: true }} />
                </div>
                <div className="mt-3 flex justify-end">
                    <button onClick={handleConfirm} disabled={loadingConfirm} className="rounded bg-[#7a0202] px-4 py-2 font-bold text-white">
                        {loadingConfirm ? 'Confirmando...' : 'Confirmar pago'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="relative mx-auto w-full bg-gris px-2">
            {/* Modal: Cliente existente (409) */}
            <Modal
                show={Boolean(showClienteModal)}
                onClose={() => setShowClienteModal(false)}
                maxWidth="md"
            >
                <div className="p-6">
                    <h3 className="mb-2 text-lg font-black text-gray-900">
                        Cliente existente detectado
                    </h3>
                    <p className="mb-4 text-[12px] text-gray-600">
                        Parece que el DNI ya está registrado. ¿Quieres usar este
                        cliente para la reserva?
                    </p>
                    {clienteExistente && (
                        <div className="mb-4 rounded bg-gray-50 p-4">
                            <p className="font-bold">{clienteExistente.name}</p>
                            <p className="text-sm text-gray-600">
                                {clienteExistente.email}
                            </p>
                            <p className="text-sm text-gray-600">
                                DNI: {clienteExistente.numero_documento}
                            </p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setShowClienteModal(false)}
                            className="rounded border border-gray-200 bg-white px-4 py-2"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={editClientDocument}
                            className="rounded bg-yellow-500 px-4 py-2 font-bold text-white"
                        >
                            Editar documento
                        </button>
                        <button
                            onClick={retryUsingExistingClient}
                            className="rounded bg-[#7a0202] px-4 py-2 font-bold text-white"
                        >
                            Usar este cliente
                        </button>
                    </div>
                </div>
            </Modal>
            <div role="form" className="w-full space-y-6">
                {/* SECCIÓN: DATOS (Solo si no vienen por props o están vacíos) */}
                <div className="space-y-4">
                    {!reservaData?.name && (
                        <div>
                            <Campo
                                id="name"
                                label="Titular de la tarjeta"
                                ref={nameRef}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nombre completo"
                                error={fieldErrors['name']}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {!reservaData?.email && (
                            <div>
                                <Campo
                                    id="email"
                                    label="Email"
                                    ref={emailRef}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email de contacto"
                                    error={fieldErrors['email']}
                                />
                            </div>
                        )}

                        {!reservaData?.telefono && (
                            <div>
                                <Campo
                                    id="telefono"
                                    label="Teléfono"
                                    ref={telefonoRef}
                                    value={telefono}
                                    onChange={(e) =>
                                        setTelefono(e.target.value)
                                    }
                                    placeholder="Teléfono"
                                    error={fieldErrors['telefono']}
                                />
                            </div>
                        )}
                    </div>
                </div>



                {/* ACEPTACIÓN Y ACCIÓN */}
                <div className="space-y-6">
                    {mostrarAceptacion && (
                        <label className="group flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:bg-gray-50">
                            <input
                                type="checkbox"
                                checked={acepta}
                                onChange={(e) => {
                                    setAcepta(e.target.checked);
                                    onCambioAceptaTerminos?.(e.target.checked);
                                }}
                                className="mt-0.5 h-5 w-5 cursor-pointer rounded border-gray-300 text-black focus:ring-black"
                            />
                            <span className="text-[10px] font-bold uppercase leading-relaxed tracking-tight text-gray-500 transition-colors group-hover:text-gray-700">
                                He leído y acepto los{' '}
                                <span className="text-gray-900 underline decoration-black decoration-2 underline-offset-4">
                                    términos y condiciones
                                </span>
                                , así como la política de cancelación.
                            </span>
                        </label>
                    )}

                    <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-3">
                            <button
                                type="button"
                                onClick={async () => {
                                    try {
                                        if (!acepta) {
                                            setMensaje('Acepta los términos para continuar.');
                                            return;
                                        }
                                        setProcesando(true);

                                        const esExtension = Boolean(
                                            reservaData?.es_extension || reservaData?.es_edicion_pago,
                                        );
                                        let resId = reservaData?.reserva_id;

                                        if (!esExtension) {
                                            // Crear PaymentIntent standalone primero para asegurar que el pago quede ligado a Stripe
                                            const pagosApi = await import('@/api/pagos');
                                            const montoFloat = Number(monto) || 0;
                                            let piResp = null;
                                            try {
                                                piResp = await pagosApi.crearPaymentIntentStandalone(montoFloat, { receipt_email: email });
                                                if (!piResp || piResp.success === false) {
                                                    throw new Error(piResp?.error || 'No se pudo crear PaymentIntent');
                                                }
                                            } catch (e) {
                                                setMensaje(e?.message || 'Error creando PaymentIntent');
                                                throw e;
                                            }

                                            const service = await import('@/hooks/reservas/service');
                                            const nuevoPayload = { ...reservaData, name, email, telefono };
                                            // Incluir payment_intent_id para que el backend cree el Pago ligado
                                            if (piResp && piResp.paymentIntentId) {
                                                nuevoPayload.payment_intent_id = piResp.paymentIntentId;
                                                nuevoPayload.pago_monto = montoFloat;
                                                // Guardar clientSecret para confirmar en cliente
                                                if (piResp.clientSecret) {
                                                    setPiClientSecret(piResp.clientSecret);
                                                    setPiPaymentIntentId(piResp.paymentIntentId);
                                                }
                                            }

                                            try {
                                                const dataReserva = await service.crearReserva(nuevoPayload);
                                                if (!dataReserva || dataReserva.success === false) {
                                                    throw new Error(dataReserva?.error || dataReserva?.message || 'Error creando reserva');
                                                }
                                                resId = dataReserva.reserva_id ?? dataReserva.reserva?.id ?? resId;
                                            } catch (e) {
                                                setMensaje(e?.message || 'Error creando la reserva');
                                                throw e;
                                            }
                                            // Nota: la confirmación del PaymentIntent (recolección de tarjeta) debe realizarse
                                            // en un paso posterior usando `piResp.clientSecret` con Stripe.js / Elements.
                                            // Aquí sólo nos aseguramos de crear el PaymentIntent y persistir la reserva con payment_intent_id.
                                        }

                                        // Si creamos un PaymentIntent standalone con clientSecret, mostrar el formulario
                                        if (piClientSecret && stripePromise) {
                                            // Mostrar formulario de tarjeta para confirmar el PaymentIntent
                                            setShowCardForm(true);
                                            // No redirigimos a Checkout
                                        } else {
                                            // Crear checkout session y redirigir (nueva forma: usar session.url)
                                            const ck = await crearCheckoutSession(resId, { monto });
                                            if (!ck || (!ck.sessionUrl && !ck.sessionId)) {
                                                throw new Error(ck?.error || 'No se pudo iniciar Stripe Checkout');
                                            }

                                            if (ck.sessionUrl) {
                                                window.location.href = ck.sessionUrl;
                                            } else {
                                                // Fallback antiguo: usar redirectToCheckout si aún disponible
                                                const stripe = await loadStripe(ck.publicKey);
                                                await stripe.redirectToCheckout({ sessionId: ck.sessionId });
                                            }
                                        }
                                    } catch (e) {
                                        console.error('Error checkout:', e);
                                        setMensaje(e?.message || e?.error || 'Error al iniciar Checkout');
                                    } finally {
                                        setProcesando(false);
                                    }
                                }}
                                disabled={procesando || !name?.trim() || !email?.trim() || !telefono?.trim()}
                                className="flex w-full items-center justify-center rounded-xl bg-yellow-600 py-3 text-[12px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-yellow-700 disabled:opacity-50"
                            >Pagar con Stripe (Checkout)</button>
                        </div>

                        <p className="text-center text-[10px] font-medium text-gray-400">
                            Transacción segura encriptada vía Stripe
                        </p>
                    </div>
                    {/* Si se requiere confirmación cliente (PaymentIntent creado), mostrar Elements + CardConfirmForm */}
                    {showCardForm && piClientSecret && stripePromise && (
                        <div className="mt-4">
                            <Elements stripe={stripePromise} options={{ clientSecret: piClientSecret }}>
                                <CardConfirmForm
                                    clientSecret={piClientSecret}
                                    paymentIntentId={piPaymentIntentId}
                                    name={name}
                                    email={email}
                                    onSuccess={(data) => {
                                        setShowCardForm(false);
                                        if (typeof onPagoExitoso === 'function') onPagoExitoso(data);
                                    }}
                                    onError={(msg) => setMensaje(msg)}
                                />
                            </Elements>
                        </div>
                    )}
                </div>

                {/* ERRORES */}
                {debugErrorJson && (
                    <div className="mb-2 rounded-md bg-gray-900 p-3 text-white">
                        <div className="flex items-center justify-between">
                            <strong className="text-sm">
                                Debug: respuesta de validación (422)
                            </strong>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigator.clipboard?.writeText(
                                            debugErrorJson,
                                        )
                                    }
                                    className="text-xs underline"
                                >
                                    Copiar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDebugErrorJson(null)}
                                    className="text-white hover:text-gray-300"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <pre className="mt-2 max-h-40 overflow-auto font-mono text-xs">
                            {debugErrorJson}
                        </pre>
                    </div>
                )}
                {mensaje && (
                    <div className="flex items-center gap-3 rounded-xl border border-red-100 bg-red-50/50 p-4 transition-all duration-300">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-red-600"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-red-900">
                            {mensaje}
                        </span>
                    </div>
                )}
            </div>

            {/* OVERLAY DE CARGA */}
            {procesando && (
                <div className="absolute inset-0 z-50 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-[3px]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="h-10 w-10 animate-spin rounded-full border-[4px] border-gray-100 border-t-[#7a0202]"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">
                            Sincronizando...
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FormularioPago(props) {
    // Ahora utilizamos exclusivamente Stripe Checkout (session.url). No es necesario el wrapper de Elements.
    return <FormularioPagoInterno {...props} />;
}
