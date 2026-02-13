import usePayments from '@/hooks/pagos/usePayments';
import { CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { useState } from 'react';

const LatveriaCard = ({
    clientSecret,
    paymentIntentId,
    onSuccess,
    onError,
    name,
    email,
}) => {
    const stripe = useStripe();
    const elements = useElements();
    const [loadingConfirm, setLoadingConfirm] = useState(false);
    const [completed, setCompleted] = useState(false);
    const { confirmarPaymentIntent } = usePayments();

    // Configuración de Stripe
    const stripeOptions = {
        style: {
            base: {
                fontSize: '18px',
                color: '#111827', // dark text for white input
                letterSpacing: '0.05em',
                fontFamily: 'monospace',
                '::placeholder': { color: 'rgba(0, 0, 0, 0.4)' },
            },
            invalid: { color: '#ef4444' },
        },
        hidePostalCode: true,
    };

    const handleConfirm = async () => {
        if (completed) return; // prevent duplicate submissions after success
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
                    onSuccess &&
                        onSuccess({
                            pago_id: backendResp.pago_id,
                            paymentIntentId,
                            localizador: backendResp.localizador,
                        });
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
            setLoadingConfirm(false);
        }
    };

    return (
        <div className="latveria-container">
            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .latveria-container {
                    perspective: 1200px;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    padding: 40px;
                }
                .hover-3d-wrapper {
                    position: relative;
                    transform-style: preserve-3d;
                    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                }
                .hover-3d-wrapper:hover {
                    transform: rotateX(12deg) rotateY(-12deg);
                }
                .card-layer {
                    position: absolute;
                    inset: 0;
                    border-radius: 1rem;
                    border: 1px solid rgba(255, 255, 255, 0.05);
                    pointer-events: none;
                    transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1);
                }
                .hover-3d-wrapper:hover .layer-1 { transform: translateZ(2px); }
                .hover-3d-wrapper:hover .layer-2 { transform: translateZ(4px); }
                .hover-3d-wrapper:hover .layer-3 { transform: translateZ(6px); }
                .hover-3d-wrapper:hover .layer-4 { transform: translateZ(8px); }
                .hover-3d-wrapper:hover .layer-5 { transform: translateZ(10px); }
                .stripe-input-container {
                    background: #ffffff;
                    border: 1px solid rgba(0,0,0,0.08);
                    padding: 1rem;
                    border-radius: 0.75rem;
                    transition: border 0.3s ease;
                }
                .stripe-input-container:focus-within {
                    border-color: rgba(0,0,0,0.12);
                }
            `,
                }}
            />

            <div className="hover-3d-wrapper">
                <div className="card-layer layer-1"></div>
                <div className="card-layer layer-2"></div>
                <div className="card-layer layer-3"></div>
                <div className="card-layer layer-4"></div>
                <div className="card-layer layer-5"></div>

                <div
                    className="card relative z-10 w-[40rem] overflow-hidden border border-white/10 text-white shadow-2xl"
                    style={{
                        backgroundImage: `linear-gradient(135deg, #8b0000 0%, #3b0000 100%), radial-gradient(circle at bottom left, #ffffff04 35%, transparent 36%), radial-gradient(circle at top right, #ffffff04 35%, transparent 36%)`,
                        backgroundSize: 'cover, 4.95em 4.95em, 4.95em 4.95em',
                        backgroundBlendMode: 'normal, overlay, overlay',
                    }}
                >
                    <div className="card-body p-8">
                        <div className="mb-10 flex items-start justify-between">
                            <div className="text-[10px] font-black tracking-[0.2em] text-white/90">
                                BANCO DE GLUDIO
                            </div>
                            <div className="select-none text-5xl leading-none opacity-10">
                                ❁
                            </div>
                        </div>

                        <div className="stripe-input-container">
                            <CardElement options={stripeOptions} />
                        </div>

                        <div className="mt-3 flex justify-end">
                            <button
                                onClick={handleConfirm}
                                disabled={loadingConfirm || completed}
                                aria-busy={loadingConfirm}
                                aria-disabled={loadingConfirm || completed}
                                className={`mt-4 rounded px-4 py-2 font-bold text-white ${completed ? 'bg-green-600' : 'bg-[#7a0202]'}`}
                            >
                                {completed
                                    ? 'Confirmado'
                                    : loadingConfirm
                                      ? 'Confirmando...'
                                      : 'Confirmar pago'}
                            </button>
                        </div>

                        <div className="mt-8 flex items-end justify-between">
                            <div className="space-y-1">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] opacity-30">
                                    Titular
                                </div>
                                <div className="text-sm font-bold uppercase italic tracking-tight">
                                    {name || 'Titular'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LatveriaCard;
