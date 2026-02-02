import Campo from '@/Components/formulario/Campo';
import Modal from '@/Components/Modal';
import { usePage } from '@inertiajs/react';
import {
    CardElement,
    Elements,
    useElements,
    useStripe,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useMemo, useRef, useState } from 'react';

function FormularioPagoInterno({
    reservaData,
    monto,
    onPagoExitoso,
    onError = () => {},
    aceptaTerminos = false,
    mostrarAceptacion = false,
    onAceptaChange = null,
}) {
    const page = usePage();
    const csrfToken =
        page?.props?.csrf_token ||
        document.querySelector('meta[name="csrf-token"]')?.content ||
        '';
    const stripe = useStripe();
    const elements = useElements();

    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [acepta, setAcepta] = useState(aceptaTerminos);
    const [fieldErrors, setFieldErrors] = useState({});
    const [debugErrorJson, setDebugErrorJson] = useState(null);

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
        const resPI = await fetch('/pagos/crear-payment-intent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': csrfToken,
            },
            body: JSON.stringify({ reserva_id: reservaId, monto }),
        });

        let dataPI = null;
        if (!resPI.ok) {
            try {
                dataPI = await resPI.json();
            } catch (parseErr) {
                /* ignore */
            }
            let message = `Error en comunicación (${resPI.status})`;
            if (dataPI) {
                if (dataPI.errors)
                    message = Object.values(dataPI.errors).flat().join('; ');
                else if (dataPI.error) message = dataPI.error;
                else if (dataPI.message) message = dataPI.message;
            }
            throw new Error(message);
        }
        dataPI = await resPI.json();
        if (!dataPI.success)
            throw new Error(dataPI.error || 'Error en comunicación');

        // If server already confirmed the PaymentIntent (e.g. local test confirm),
        // skip calling stripe.confirmCardPayment to avoid "already confirmed" errors
        if (
            dataPI.paymentIntentStatus === 'succeeded' ||
            dataPI.paymentIntentStatus === 'succeeded'
        ) {
            // Inform app that payment is confirmed
            const resConfirm = await fetch('/pagos/confirmar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    payment_intent_id: dataPI.paymentIntentId,
                    pago_id: dataPI.pago_id,
                }),
            });
            if (!resConfirm.ok) {
                let errText = `Error confirmando pago (${resConfirm.status})`;
                try {
                    const jd = await resConfirm.json();
                    errText = jd?.message || jd?.error || errText;
                } catch (e) {}
                throw new Error(errText);
            }
            onPagoExitoso({ pago_id: dataPI.pago_id });
            return;
        }

        const { paymentIntent, error } = await stripe.confirmCardPayment(
            dataPI.clientSecret,
            {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: { name, email },
                },
            },
        );

        if (error) throw new Error(error.message);

        if (paymentIntent.status === 'succeeded') {
            await fetch('/pagos/confirmar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({
                    payment_intent_id: paymentIntent.id,
                    pago_id: dataPI.pago_id,
                }),
            });
            onPagoExitoso({ pago_id: dataPI.pago_id });
        }
    };

    const procesarPago = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || !acepta) {
            console.error('❌ Validación inicial fallida:', {
                stripe: !!stripe,
                elements: !!elements,
                acepta,
            });
            return;
        }

        // Validar que CardElement tenga datos
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            console.error('❌ CardElement no encontrado');
            setMensaje('Error: elemento de tarjeta no encontrado.');
            return;
        }

        console.log('🔍 Validando tarjeta...');

        // Crear un payment method para validar que la tarjeta está completa
        const { paymentMethod, error: pmError } =
            await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: { name, email },
            });

        if (pmError) {
            console.error('❌ Error tarjeta:', pmError);
            setMensaje(`Tarjeta inválida: ${pmError.message}`);
            return;
        }

        if (!paymentMethod) {
            console.error('❌ No se creó payment method');
            setMensaje(
                'Por favor, completa los datos de tu tarjeta correctamente.',
            );
            return;
        }

        console.log('✅ Tarjeta válida, procediendo con pago');

        // Guard: evitar enviar si faltan fechas u habitaciones en el payload
        if (!reservaData || !reservaData.check_in || !reservaData.check_out) {
            setMensaje('Selecciona fechas de entrada y salida.');
            try {
                if (typeof window !== 'undefined')
                    window.dispatchEvent(new CustomEvent('faltanFechas'));
            } catch (e) {}
            setProcesando(false);
            return;
        }
        if (
            !Array.isArray(reservaData.habitaciones) ||
            reservaData.habitaciones.length === 0
        ) {
            setMensaje('Selecciona al menos una habitación.');
            try {
                if (typeof window !== 'undefined')
                    window.dispatchEvent(new CustomEvent('faltanHabitaciones'));
            } catch (e) {}
            setProcesando(false);
            return;
        }

        // Validar campos de formulario
        if (!name || !name.trim()) {
            setMensaje('Por favor, ingresa tu nombre.');
            nameRef.current?.focus();
            setProcesando(false);
            return;
        }
        if (
            !email ||
            !email.trim() ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
        ) {
            setMensaje('Por favor, ingresa un email válido.');
            emailRef.current?.focus();
            setProcesando(false);
            return;
        }
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
                    resId = dataReserva.reserva_id;
                } catch (err) {
                    if (err && err.status === 409 && err.cliente_existente) {
                        setClienteExistente(err.cliente_existente);
                        setShowClienteModal(true);
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
            <form onSubmit={procesarPago} className="w-full space-y-6">
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

                {/* SECCIÓN: TARJETA */}
                <div className="space-y-4">
                    <div className="flex items-center gap-3 border-l-4 border-black pl-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-900">
                            Tarjeta Bancaria
                        </h4>
                    </div>
                    <div className="rounded-xl border-2 border-gray-100 bg-white p-4 shadow-sm transition-all focus-within:border-black">
                        <CardElement
                            options={{
                                style: {
                                    base: {
                                        fontSize: '14px',
                                        color: '#111827',
                                        fontFamily: 'system-ui, sans-serif',
                                        letterSpacing: '0.025em',
                                        fontSmoothing: 'antialiased',
                                        '::placeholder': { color: '#9ca3af' },
                                    },
                                    invalid: {
                                        color: '#dc2626',
                                        iconColor: '#dc2626',
                                    },
                                },
                            }}
                        />
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
                                    onAceptaChange?.(e.target.checked);
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
                        <button
                            type="submit"
                            disabled={
                                procesando ||
                                !stripe ||
                                !elements ||
                                !acepta ||
                                !name?.trim() ||
                                !email?.trim() ||
                                !telefono?.trim()
                            }
                            className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-black py-4 text-[12px] font-black uppercase tracking-[0.2em] text-white transition-all hover:bg-gray-900 active:scale-[0.98] disabled:opacity-20 disabled:grayscale"
                        >
                            {procesando ? (
                                <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white"></div>
                                    Procesando...
                                </span>
                            ) : (
                                `Pagar y Confirmar €${Number(monto).toFixed(2)}`
                            )}
                        </button>

                        <p className="text-center text-[10px] font-medium text-gray-400">
                            Transacción segura encriptada vía Stripe
                        </p>
                    </div>
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
            </form>

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
    const stripePromise = useMemo(
        () => loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY),
        [],
    );
    return (
        <Elements stripe={stripePromise}>
            <FormularioPagoInterno {...props} />
        </Elements>
    );
}
