import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import usePayments from '@/hooks/pagos/usePayments';

export default function CardConfirmForm({ clientSecret, paymentIntentId, onSuccess, onError, name, email }) {
    const stripe = useStripe();
    const elements = useElements();
    const [loadingConfirm, setLoadingConfirm] = useState(false);
    const { confirmarPaymentIntent } = usePayments();

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
                const backendResp = await confirmarPaymentIntent(paymentIntentId);
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
