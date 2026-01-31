import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePage } from '@inertiajs/react';
import Campo from '@/Components/formulario/Campo';
import Modal from '@/Components/Modal';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CreditCardIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

function FormularioPagoInterno({ reservaData, monto, onPagoExitoso, onError = () => {}, aceptaTerminos = false, mostrarAceptacion = false, onAceptaChange = null }) {
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';
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

    useEffect(() => { setAcepta(aceptaTerminos); }, [aceptaTerminos]);

    const user = page?.props?.auth?.user;
    // Dirección retirada del formulario: no almacenamos ni pedimos calle/ciudad/código/pais aquí

    const [name, setName] = useState(reservaData?.name || user?.name || '');
    const [email, setEmail] = useState(reservaData?.email || user?.email || '');
    const [telefono, setTelefono] = useState(reservaData?.telefono || user?.telefono || '');

    // Refs for focusing invalid fields
    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const telefonoRef = useRef(null);

    // Continuación del flujo de pago después de crear la reserva
    const continuarConPago = async (reservaId, monto) => {
        const resPI = await fetch('/pagos/crear-payment-intent', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
            body: JSON.stringify({ reserva_id: reservaId, monto }),
        });

        let dataPI = null;
        if (!resPI.ok) {
            try { dataPI = await resPI.json(); } catch (parseErr) { /* ignore */ }
            let message = `Error en comunicación (${resPI.status})`;
            if (dataPI) {
                if (dataPI.errors) message = Object.values(dataPI.errors).flat().join('; ');
                else if (dataPI.error) message = dataPI.error;
                else if (dataPI.message) message = dataPI.message;
            }
            throw new Error(message);
        }
        dataPI = await resPI.json();
        if (!dataPI.success) throw new Error(dataPI.error || 'Error en comunicación');

        // If server already confirmed the PaymentIntent (e.g. local test confirm),
        // skip calling stripe.confirmCardPayment to avoid "already confirmed" errors
        if (dataPI.paymentIntentStatus === 'succeeded' || dataPI.paymentIntentStatus === 'succeeded') {
            // Inform app that payment is confirmed
            const resConfirm = await fetch('/pagos/confirmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ payment_intent_id: dataPI.paymentIntentId, pago_id: dataPI.pago_id }),
            });
            if (!resConfirm.ok) {
                let errText = `Error confirmando pago (${resConfirm.status})`;
                try { const jd = await resConfirm.json(); errText = jd?.message || jd?.error || errText; } catch(e){}
                throw new Error(errText);
            }
            onPagoExitoso({ pago_id: dataPI.pago_id });
            return;
        }

        const { paymentIntent, error } = await stripe.confirmCardPayment(dataPI.clientSecret, {
            payment_method: {
                card: elements.getElement(CardElement),
                billing_details: { name, email },
            },
        });

        if (error) throw new Error(error.message);

        if (paymentIntent.status === 'succeeded') {
            await fetch('/pagos/confirmar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ payment_intent_id: paymentIntent.id, pago_id: dataPI.pago_id }),
            });
            onPagoExitoso({ pago_id: dataPI.pago_id });
        }
    };

    const procesarPago = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || !acepta) return;

        // Guard: evitar enviar si faltan fechas u habitaciones en el payload
        if (!reservaData || !reservaData.check_in || !reservaData.check_out) {
            setMensaje('Selecciona fechas de entrada y salida.');
            try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('faltanFechas')); } catch (e) {}
            setProcesando(false);
            return;
        }
        if (!Array.isArray(reservaData.habitaciones) || reservaData.habitaciones.length === 0) {
            setMensaje('Selecciona al menos una habitación.');
            try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('faltanHabitaciones')); } catch (e) {}
            setProcesando(false);
            return;
        }

        setProcesando(true);
        let crearPayload = null;
        try {
            setFieldErrors({});
            setDebugErrorJson(null);
            const esExtension = Boolean(reservaData?.es_extension || reservaData?.es_edicion_pago);
            let resId = reservaData?.reserva_id;

            if (!esExtension) {
                const service = await import('@/hooks/reservas/service');
                        const nuevoPayload = { ...reservaData, name, email, telefono };
                crearPayloadRef.current = nuevoPayload;
                try {
                    const dataReserva = await service.crearReserva(crearPayloadRef.current);
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
                const hasCheckIn = Object.prototype.hasOwnProperty.call(err.errors, 'check_in');
                const hasCheckOut = Object.prototype.hasOwnProperty.call(err.errors, 'check_out');
                if (hasCheckIn || hasCheckOut) {
                    setMensaje('Selecciona fechas de entrada y salida.');
                    // Notify parent UI to open/scroll to date selector if it wants to
                    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('faltanFechas', { detail: {} })); } catch (e) {}
                } else {
                    const joined = Object.values(err.errors).flat().join('; ');
                    setMensaje(joined || (err.message || 'Error de validación'));
                }

                try { if (typeof onError === 'function') onError(err?.message || Object.values(err?.errors || {}).flat().join('; ') || JSON.stringify(err)); } catch (cbErr) { console.error('onError callback threw', cbErr); }
            } else {
                const msg = err?.message || err?.error || (err && err.error && err.error.message) || 'Error procesando pago';
                setMensaje(msg);
                try { if (typeof onError === 'function') onError(msg || err?.message || JSON.stringify(err)); } catch (cbErr) { console.error('onError callback threw', cbErr); }
            }

            // Autoselect/focus first invalid field for better UX
            setTimeout(() => {
                    const errorsObj = (err && err.errors) ? err.errors : fieldErrors || {};
                    const order = ['name','email','telefono'];
                const first = order.find(k => Object.prototype.hasOwnProperty.call(errorsObj, k));
                try {
                    if (first === 'name') { nameRef.current?.focus(); nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                    else if (first === 'email') { emailRef.current?.focus(); emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
                    else if (first === 'telefono') { telefonoRef.current?.focus(); telefonoRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }

                } catch (e) { /* noop */ }
            }, 50);

            // Store debug JSON for developer inspection (copy-able)
            try { setDebugErrorJson(JSON.stringify({ error: err, payload: crearPayloadRef.current }, null, 2)); } catch (e) { setDebugErrorJson(String(err)); }
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
            crearPayloadRef.current = { ...(crearPayloadRef.current || {}), reservable_id: clienteExistente.id };
            const dataReserva = await service.crearReserva(crearPayloadRef.current);
            setClienteExistente(null);
            await continuarConPago(dataReserva.reserva_id, monto);
        } catch (err) {
            setMensaje(err?.message || 'Error al crear reserva con cliente existente');
            try { setDebugErrorJson(JSON.stringify({ error: err, payload: crearPayloadRef.current }, null, 2)); } catch (e) { /* noop */ }
        } finally {
            setProcesando(false);
        }
    };

    const editClientDocument = () => {
        setShowClienteModal(false);
        setMensaje('Edita el documento para continuar');
        try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('editarDocumento', { detail: { numero_documento: clienteExistente?.numero_documento } })); } catch (e) {}
    };

    return (
        <div className="w-full mx-auto relative px-2 bg-gris">
            {/* Modal: Cliente existente (409) */}
            <Modal show={Boolean(showClienteModal)} onClose={() => setShowClienteModal(false)} maxWidth="md">
                <div className="p-6">
                    <h3 className="text-lg font-black text-gray-900 mb-2">Cliente existente detectado</h3>
                    <p className="text-[12px] text-gray-600 mb-4">Parece que el DNI ya está registrado. ¿Quieres usar este cliente para la reserva?</p>
                    {clienteExistente && (
                        <div className="bg-gray-50 p-4 rounded mb-4">
                            <p className="font-bold">{clienteExistente.name}</p>
                            <p className="text-sm text-gray-600">{clienteExistente.email}</p>
                            <p className="text-sm text-gray-600">DNI: {clienteExistente.numero_documento}</p>
                        </div>
                    )}

                    <div className="flex justify-end gap-3">
                        <button onClick={() => setShowClienteModal(false)} className="py-2 px-4 rounded bg-white border border-gray-200">Cancelar</button>
                        <button onClick={editClientDocument} className="py-2 px-4 rounded bg-yellow-500 text-white font-bold">Editar documento</button>
                        <button onClick={retryUsingExistingClient} className="py-2 px-4 rounded bg-[#7a0202] text-white font-bold">Usar este cliente</button>
                    </div>
                </div>
            </Modal>
            <form onSubmit={procesarPago} className="space-y-10 w-full">

                {/* SECCIÓN: DIRECCIÓN */}
                <div className="px-6">
                    <div className="flex items-center gap-4 mb-6">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                        <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">Detalles de Facturación</h2>
                    </div>

                    <div className="space-y-4">
                        {/* Campos del titular */}
                        <div>
                            <Campo
                                id="name"
                                ref={nameRef}
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Nombre completo"
                                className={`w-full border-gray-200 rounded-lg py-3 px-4 text-[12px] font-bold ${fieldErrors['name'] ? 'border-red-600' : ''}`}
                                error={fieldErrors['name']}
                            />
                            {fieldErrors['name'] && <p className="text-[11px] text-red-600 mt-1">{fieldErrors['name'].join(', ')}</p>}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <Campo
                                    id="email"
                                    ref={emailRef}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    className={`border-gray-200 rounded-lg py-3 px-4 text-[12px] font-bold ${fieldErrors['email'] ? 'border-red-600' : ''}`}
                                    error={fieldErrors['email']}
                                />
                                {fieldErrors['email'] && <p className="text-[11px] text-red-600 mt-1">{fieldErrors['email'].join(', ')}</p>}
                            </div>

                            <div>
                                <Campo
                                    id="telefono"
                                    ref={telefonoRef}
                                    value={telefono}
                                    onChange={(e) => setTelefono(e.target.value)}
                                    placeholder="Teléfono"
                                    className={`border-gray-200 rounded-lg py-3 px-4 text-[12px] font-bold ${fieldErrors['telefono'] ? 'border-red-600' : ''}`}
                                    error={fieldErrors['telefono']}
                                />
                                {fieldErrors['telefono'] && <p className="text-[11px] text-red-600 mt-1">{fieldErrors['telefono'].join(', ')}</p>}
                            </div>
                        </div>

                    </div>
                </div>

                {/* SECCIÓN: TARJETA */}
                <div className="px-6">
                    <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm">
                        <CardElement options={{
                            style: { base: { fontSize: '14px', color: '#111827', letterSpacing: '0.05em', fontSmoothing: 'antialiased', '::placeholder': { color: '#d1d5db' } } }
                        }} />
                    </div>
                </div>

                {/* ACEPTACIÓN Y ACCIÓN */}
                <div className="space-y-4">
                    {mostrarAceptacion && (
                        <label className="flex items-center justify-center gap-4 cursor-pointer group px-2 text-center">
                            <input type="checkbox" checked={acepta}
                                onChange={(e) => { setAcepta(e.target.checked); onAceptaChange?.(e.target.checked); }}
                                className="h-5 w-5 rounded border-gray-300 text-[#7a0202] focus:ring-[#7a0202] cursor-pointer"
                            />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight leading-relaxed group-hover:text-gray-700 transition-colors text-center">
                                Acepto los <span className="text-gray-900 underline decoration-[#7a0202] decoration-2 underline-offset-4">términos y condiciones</span>.
                            </span>
                        </label>
                    )}

                    <button type="submit" disabled={procesando || !stripe || !acepta} className="w-full py-6 mt-4 rounded-xl bg-[#7a0202] text-white font-black text-[12px] uppercase tracking-[0.35em] shadow-2xl shadow-red-900/20 hover:bg-black hover:shadow-none transition-all active:scale-[0.97] disabled:opacity-20 disabled:grayscale">
                        {procesando ? 'Procesando...' : 'Pagar'}
                    </button>
                </div>

                {/* ERRORES */}
                {debugErrorJson && (
                    <div className="p-3 bg-gray-900 text-white rounded-md mb-2">
                        <div className="flex items-center justify-between">
                            <strong className="text-sm">Debug: respuesta de validación (422)</strong>
                            <div className="flex items-center gap-2">
                                <button type="button" onClick={() => navigator.clipboard?.writeText(debugErrorJson)} className="text-xs underline">Copiar</button>
                                <button type="button" onClick={() => setDebugErrorJson(null)} className="text-xs">Cerrar</button>
                            </div>
                        </div>
                        <pre className="mt-2 text-xs max-h-40 overflow-auto">{debugErrorJson}</pre>
                    </div>
                )}
                {mensaje && (
                    <div className="p-5 bg-red-50 border-l-4 border-red-600 rounded-r-xl flex items-center gap-4 animate-pulse">
                        <span className="text-[11px] font-black text-red-800 uppercase tracking-widest">{mensaje}</span>
                    </div>
                )}
            </form>

            {/* OVERLAY DE CARGA */}
            {procesando && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-[3px] rounded-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-[4px] border-gray-100 border-t-[#7a0202] rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-900">Sincronizando...</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function FormularioPago(props) {
    const stripePromise = useMemo(() => loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY), []);
    return (
        <Elements stripe={stripePromise}>
            <FormularioPagoInterno {...props} />
        </Elements>
    );
}
