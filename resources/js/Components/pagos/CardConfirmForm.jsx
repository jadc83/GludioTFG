import usePayments from '@/hooks/pagos/usePayments';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';

export default function CardConfirmForm({
    clientSecret,
    paymentIntentId,
    onCompleted,
    onSuccess,
    onError,
    name,
    email,
    localizador,
    onPrepare,
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [loadingConfirm, setLoadingConfirm] = useState(false);
    const { confirmarPaymentIntent } = usePayments();
    const [cardReady, setCardReady] = useState(false);

    const handleConfirm = async () => {
        if (!stripe || !elements) {
            onError && onError('Stripe no inicializado');
            return;
        }

        if (!cardReady) {
            onError && onError('El formulario de tarjeta no está listo. Espera un momento e inténtalo de nuevo.');
            return;
        }

        setLoadingConfirm(true);
        const card = elements.getElement(CardElement);
        try {
            // If no clientSecret provided yet, call onPrepare to create PaymentIntent/reserva
            let cs = clientSecret;
            let piId = paymentIntentId;
            if (!cs && typeof onPrepare === 'function') {
                try {
                    const prep = await onPrepare();
                    cs = prep?.clientSecret || cs;
                    piId = prep?.paymentIntentId || piId;
                } catch (e) {
                    onError && onError(e?.message || 'Error preparando el pago');
                    setLoadingConfirm(false);
                    return;
                }
            }

            const res = await stripe.confirmCardPayment(cs, {
                payment_method: {
                    card,
                    billing_details: { name: name || '', email: email || '' },
                },
            });

            if (res.error) {
                onError &&
                    onError(res.error.message || 'Error confirmando el pago');
                setLoadingConfirm(false);
                return;
            }

            if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
                const backendResp =
                    await confirmarPaymentIntent(piId || paymentIntentId);
                if (backendResp && backendResp.success) {
                    const loc = backendResp.localizador || localizador;
                    const resultData = {
                        pago_id: backendResp.pago_id,
                        paymentIntentId: piId || paymentIntentId,
                        localizador: loc,
                    };
                    // Notify parent and let it handle UI/redirect; keep showing spinner until
                    // parent unmounts this component or navigates away.
                    onCompleted && onCompleted(resultData);
                    onSuccess && onSuccess(resultData);
                    return;
                } else {
                    onError &&
                        onError(
                            backendResp?.error ||
                                'Confirmado en Stripe, pero fallo al notificar al backend',
                        );
                }
            } else {
                onError && onError('Pago no confirmado');
            }
        } catch (e) {
            onError && onError(e?.message || String(e));
        } finally {
            // keep button disabled if completed; otherwise allow retry
            setLoadingConfirm(false);
        }
    };

    return (
        <div className="mt-4">
            <div className="block text-sm font-medium text-gray-700">
                Datos de tarjeta
            </div>
            <div className="mt-2 rounded-md border border-gray-200 p-3">
                <CardElement options={{ hidePostalCode: true }} onReady={() => setCardReady(true)} />
            </div>
            <div className="mt-3 flex justify-end">
                <button
                    onClick={handleConfirm}
                    disabled={loadingConfirm || !cardReady}
                    aria-busy={loadingConfirm}
                    aria-disabled={loadingConfirm || !cardReady}
                    className={`rounded px-4 py-2 font-bold text-white ${loadingConfirm ? 'opacity-80 cursor-wait bg-[#7a0202]' : 'bg-[#7a0202]'}`}
                >
                    {loadingConfirm ? 'Confirmando...' : 'Confirmar pago'}
                </button>
            </div>
        </div>
    );
}
