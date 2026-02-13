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
}) {
    const stripe = useStripe();
    const elements = useElements();
    const [loadingConfirm, setLoadingConfirm] = useState(false);
    const [completed, setCompleted] = useState(false);
    const { confirmarPaymentIntent } = usePayments();

    const handleConfirm = async () => {
        if (completed) return; // prevent double submits when already completed
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
                onError &&
                    onError(res.error.message || 'Error confirmando el pago');
                setLoadingConfirm(false);
                return;
            }

            if (res.paymentIntent && res.paymentIntent.status === 'succeeded') {
                const backendResp =
                    await confirmarPaymentIntent(paymentIntentId);
                if (backendResp && backendResp.success) {
                    setCompleted(true);
                    const loc = backendResp.localizador || localizador;
                    const resultData = {
                        pago_id: backendResp.pago_id,
                        paymentIntentId,
                        localizador: loc,
                    };
                    onCompleted && onCompleted(resultData);
                    onSuccess && onSuccess(resultData);
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
                <CardElement options={{ hidePostalCode: true }} />
            </div>
            <div className="mt-3 flex justify-end">
                <button
                    onClick={handleConfirm}
                    disabled={loadingConfirm || completed}
                    aria-busy={loadingConfirm}
                    aria-disabled={loadingConfirm || completed}
                    className={`rounded px-4 py-2 font-bold text-white ${completed ? 'bg-green-600' : 'bg-[#7a0202]'}`}
                >
                    {completed
                        ? 'Confirmado'
                        : loadingConfirm
                          ? 'Confirmando...'
                          : 'Confirmar pago'}
                </button>
            </div>
        </div>
    );
}
