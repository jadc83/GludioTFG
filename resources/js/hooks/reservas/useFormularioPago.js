import { useEffect, useMemo, useRef, useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import { getStripePromise } from '@/utils/stripe';
import usePayments from '@/hooks/pagos/usePayments';
import { processPaymentIntentResult as processPaymentIntentResultHelper } from '@/utils/pagos/processPaymentIntentResult';

export default function useFormularioPago({
    reservaData = {},
    monto = 0,
    onPagoExitoso = () => {},
    onError = () => {},
    aceptaTerminos = false,
    mostrarAceptacion = false,
    onCambioAceptaTerminos = null,
} = {}) {
    const page = usePage();
    const { createPaymentIntent, confirmarPaymentIntent } = usePayments();

    const stripePublicKey =
        import.meta.env.VITE_STRIPE_PUBLIC_KEY || page?.props?.stripe_public || null;
    const stripePromise = useMemo(() => getStripePromise(stripePublicKey), [stripePublicKey]);

    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [acepta, setAcepta] = useState(aceptaTerminos);
    const [fieldErrors, setFieldErrors] = useState({});
    const [debugErrorJson, setDebugErrorJson] = useState(null);
    const [piClientSecret, setPiClientSecret] = useState(null);
    const [piPaymentIntentId, setPiPaymentIntentId] = useState(null);
    const [showCardForm, setShowCardForm] = useState(false);
    const [clienteExistente, setClienteExistente] = useState(null);
    const [showClienteModal, setShowClienteModal] = useState(false);

    const crearPayloadRef = useRef(null);

    useEffect(() => setAcepta(aceptaTerminos), [aceptaTerminos]);

    const user = page?.props?.auth?.user;
    const [name, setName] = useState(reservaData?.name || user?.name || '');
    const [email, setEmail] = useState(reservaData?.email || user?.email || '');
    const [telefono, setTelefono] = useState(reservaData?.telefono || user?.telefono || '');

    const nameRef = useRef(null);
    const emailRef = useRef(null);
    const telefonoRef = useRef(null);

    const requireAcceptance = mostrarAceptacion || typeof onCambioAceptaTerminos === 'function';
    const isDisabled =
        procesando ||
        !name?.trim() ||
        !email?.trim() ||
        !telefono?.trim() ||
        !user ||
        (requireAcceptance && !acepta);

    // helpers
    const focusFirstField = (errorsObj = {}) => {
        const order = ['name', 'email', 'telefono'];
        const first = order.find((k) => Object.prototype.hasOwnProperty.call(errorsObj, k));
        try {
            if (first === 'name') nameRef.current?.focus();
            else if (first === 'email') emailRef.current?.focus();
            else if (first === 'telefono') telefonoRef.current?.focus();
        } catch (e) {}
    };

    const crearReserva = async (payload) => {
        const service = await import('@/hooks/reservas/service');
        return await service.crearReserva(payload);
    };

    const startCheckout = async () => {
        setProcesando(true);
        setFieldErrors({});
        setDebugErrorJson(null);
        setMensaje('');
        try {
            const esExtension = Boolean(reservaData?.es_extension || reservaData?.es_edicion_pago);
            let resId = reservaData?.reserva_id;

            // Create PaymentIntent first if running standalone flow (matching original flow)
            let piResp = null;
            if (!esExtension) {
                try {
                    const pagosApi = await import('@/api/pagos');
                    const montoFloat = Number(monto) || 0;
                    piResp = await pagosApi.crearPaymentIntentStandalone(montoFloat, {
                        receipt_email: email,
                        allow_without_metadata: true,
                    });
                    if (!piResp || piResp.success === false) {
                        throw new Error(piResp?.error || 'No se pudo crear PaymentIntent');
                    }
                } catch (e) {
                    setMensaje(e?.message || 'Error creando PaymentIntent');
                    throw e;
                }
            }

            if (!esExtension) {
                const nuevoPayload = { ...reservaData, name, email, telefono };
                if (piResp && piResp.paymentIntentId) {
                    nuevoPayload.payment_intent_id = piResp.paymentIntentId;
                    nuevoPayload.pago_monto = Number(monto) || 0;
                    // Note: do not set local state for clientSecret here to avoid
                    // forcing a remount of the Elements provider while the
                    // confirmation flow is happening. The clientSecret is
                    // returned to the caller so the confirm logic can use it
                    // directly.
                }

                try {
                    const dataReserva = await crearReserva(nuevoPayload);
                    if (!dataReserva || dataReserva.success === false) {
                        throw new Error(dataReserva?.error || dataReserva?.message || 'Error creando reserva');
                    }
                    resId = dataReserva.reserva_id ?? dataReserva.reserva?.id ?? resId;
                } catch (err) {
                    if (err && err.status === 409 && err.cliente_existente) {
                        setClienteExistente(err.cliente_existente);
                        setShowClienteModal(true);
                        throw err;
                    }
                    throw err;
                }
            }

            // If we have a client secret, show card form, else redirect to checkout-simulado
            if (piClientSecret || (piResp && piResp.clientSecret)) {
                setShowCardForm(true);
                // Keep `procesando` = true so spinner remains during card confirmation.
                return {
                    clientSecret: piResp?.clientSecret || piClientSecret,
                    paymentIntentId: piResp?.paymentIntentId || piPaymentIntentId,
                    reservaId: resId,
                };
            } else {
                const params = new URLSearchParams({ reserva_id: String(resId), monto: String(monto) });
                // stop procesando before navigation
                setProcesando(false);
                router.visit(`/checkout-simulado?${params.toString()}`);
                return { clientSecret: null, paymentIntentId: null, reservaId: resId };
            }
        } catch (err) {
            // turn off procesando on error and surface validation or other errors
            setProcesando(false);
            if (err && typeof err === 'object' && err.errors) {
                setFieldErrors(err.errors || {});
                const hasCheckIn = Object.prototype.hasOwnProperty.call(err.errors, 'check_in');
                const hasCheckOut = Object.prototype.hasOwnProperty.call(err.errors, 'check_out');
                if (hasCheckIn || hasCheckOut) {
                    setMensaje('Selecciona fechas de entrada y salida.');
                    try { if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('faltanFechas', { detail: {} })); } catch (e) {}
                } else {
                    const joined = Object.values(err.errors).flat().join('; ');
                    setMensaje(joined || err.message || 'Error de validación');
                }
                try { if (typeof onError === 'function') onError(err?.message || Object.values(err?.errors || {}).flat().join('; ') || JSON.stringify(err)); } catch (cbErr) {}
            } else {
                const msg = err?.message || err?.error || (err && err.error && err.error.message) || 'Error procesando pago';
                setMensaje(msg);
                try { if (typeof onError === 'function') onError(msg || err?.message || JSON.stringify(err)); } catch (cbErr) {}
            }

            setTimeout(() => {
                focusFirstField(err && err.errors ? err.errors : fieldErrors || {});
            }, 50);

            try {
                setDebugErrorJson(JSON.stringify({ error: err, payload: crearPayloadRef.current }, null, 2));
            } catch (e) {
                setDebugErrorJson(String(err));
            }

            throw err;
        }
    };

    const retryUsingExistingClient = async () => {
        if (!clienteExistente || !crearPayloadRef.current) return;
        setShowClienteModal(false);
        setProcesando(true);
        try {
            crearPayloadRef.current = { ...(crearPayloadRef.current || {}), reservable_id: clienteExistente.id };
            const dataReserva = await crearReserva(crearPayloadRef.current);
            setClienteExistente(null);
            const resId = dataReserva.reserva_id ?? dataReserva.reserva?.id;
            const params = new URLSearchParams({ reserva_id: String(resId), monto: String(monto) });
            router.visit(`/checkout-simulado?${params.toString()}`);
        } catch (err) {
            setMensaje(err?.message || 'Error al crear reserva con cliente existente');
            try { setDebugErrorJson(JSON.stringify({ error: err, payload: crearPayloadRef.current }, null, 2)); } catch (e) {}
        } finally {
            setProcesando(false);
        }
    };

    const editClientDocument = () => {
        setShowClienteModal(false);
        setMensaje('Edita el documento para continuar');
        try {
            if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('editarDocumento', { detail: { numero_documento: clienteExistente?.numero_documento } }));
        } catch (e) {}
    };

    return {
        // state
        procesando,
        mensaje,
        acepta,
        fieldErrors,
        debugErrorJson,
        piClientSecret,
        piPaymentIntentId,
        showCardForm,
        clienteExistente,
        showClienteModal,
        isDisabled,
        name,
        email,
        telefono,
        nameRef,
        emailRef,
        telefonoRef,
        stripePromise,
        // actions
        setName,
        setEmail,
        setTelefono,
        setAcepta,
        setShowCardForm,
        setPiClientSecret,
        setPiPaymentIntentId,
        setShowClienteModal,
        setClienteExistente,
        startCheckout,
        retryUsingExistingClient,
        editClientDocument,
        // expose setter so parent can clear procesando after modal shown
        setProcesando,
        setMensaje,
    };
}
