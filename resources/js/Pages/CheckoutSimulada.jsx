import React, { useEffect, useMemo, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/utils/stripe';
import { crearPaymentIntentStandalone } from '@/api/pagos';
import CardConfirmForm from '@/Components/pagos/CardConfirmForm';

export default function CheckoutSimulada() {
    const page = usePage();
    const reservaId = page.props.reserva_id || null;
    const monto = page.props.monto || null;

    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || page?.props?.stripe_public || null;
    const stripePromise = useMemo(() => getStripePromise(stripePublicKey), [stripePublicKey]);

    const [clientSecret, setClientSecret] = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        const init = async () => {
            if (!monto) return setMensaje('Importe no especificado');
            setLoading(true);
            try {
                const resp = await crearPaymentIntentStandalone(Number(monto), { reserva_id: reservaId });
                if (!resp || resp.success === false) throw new Error(resp?.error || 'No se pudo crear PaymentIntent');
                setClientSecret(resp.clientSecret || null);
                setPaymentIntentId(resp.paymentIntentId || resp.paymentIntent?.id || null);
            } catch (e) {
                setMensaje(e?.message || 'Error creando PaymentIntent');
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [monto, reservaId]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
            <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow">
                <h2 className="text-2xl font-bold">Pagar reserva</h2>
                <p className="mt-2 text-sm text-gray-600">Importe a pagar: <strong className="text-lg">{monto ? `${monto} €` : '—'}</strong></p>
                {mensaje && <div className="mt-4 text-red-600">{mensaje}</div>}

                {loading && <div className="mt-4">Preparando pago…</div>}

                {!loading && clientSecret && stripePromise && (
                    <div className="mt-4">
                        <Elements stripe={stripePromise} options={{ clientSecret }}>
                            <CardConfirmForm
                                clientSecret={clientSecret}
                                paymentIntentId={paymentIntentId}
                                name={page.props?.auth?.user?.name}
                                email={page.props?.auth?.user?.email}
                                onSuccess={async () => {
                                    setMensaje('Pago confirmado. Notificando al servidor...');
                                    try {
                                        const xsrf = document.cookie.match(new RegExp('(^| )XSRF-TOKEN=([^;]+)'));
                                        const headers = {
                                            Accept: 'application/json',
                                            'X-Requested-With': 'XMLHttpRequest',
                                        };
                                        if (xsrf) headers['X-XSRF-TOKEN'] = decodeURIComponent(xsrf[2]);

                                        const resp = await fetch('/pagos/confirmar', {
                                            method: 'POST',
                                            credentials: 'include',
                                            headers: Object.assign(headers, { 'Content-Type': 'application/json' }),
                                            body: JSON.stringify({ payment_intent_id: paymentIntentId }),
                                        });

                                        const data = await resp.json().catch(() => ({}));
                                        if (!resp.ok || data?.success === false) {
                                            throw new Error(data?.error || data?.message || 'Error confirming payment on server');
                                        }

                                        // If the server returns a reserva_id/localizador use it for redirect
                                        if (data?.reserva_id) {
                                            window.location.href = `/reservas/${data.reserva_id}/edit`;
                                            return;
                                        } else if (data?.localizador) {
                                            window.location.href = `/reserva/${data.localizador}`;
                                            return;
                                        }
                                    } catch (e) {
                                        setMensaje('Pago confirmado en Stripe, pero fallo al notificar al servidor: ' + (e?.message || e));
                                        return;
                                    }

                                    // Redirigir al listado / home o a la reserva
                                    if (reservaId) {
                                        window.location.href = `/reservas/${reservaId}`;
                                    } else {
                                        window.location.href = '/';
                                    }
                                }}
                                onError={(msg) => setMensaje(msg)}
                            />
                        </Elements>
                    </div>
                )}

                {!clientSecret && !loading && (
                    <div className="mt-4">
                        <p className="text-sm text-gray-500">No se pudo preparar el pago. Intenta de nuevo más tarde.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
