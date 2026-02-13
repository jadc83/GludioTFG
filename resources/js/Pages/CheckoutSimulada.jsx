import { crearPaymentIntentStandalone } from '@/api/pagos';
import LatveriaCard from '@/Components/pagos/LatveriaCard';
import { getStripePromise } from '@/utils/stripe';
import {
    ArrowLeftIcon,
    LockClosedIcon,
    ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import { router, usePage } from '@inertiajs/react';
import { Elements } from '@stripe/react-stripe-js';
import { useEffect, useMemo, useState } from 'react';

export default function CheckoutSimulada() {
    const page = usePage();
    const reservaId = page.props.reserva_id || null;
    const monto = page.props.monto || null;

    const stripePublicKey =
        import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
        page?.props?.stripe_public ||
        null;
    const stripePromise = useMemo(
        () => getStripePromise(stripePublicKey),
        [stripePublicKey],
    );

    const [clientSecret, setClientSecret] = useState(null);
    const [paymentIntentId, setPaymentIntentId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState('');

    useEffect(() => {
        const init = async () => {
            if (!monto) return setMensaje('Importe de reserva no especificado');
            setLoading(true);
            try {
                const resp = await crearPaymentIntentStandalone(Number(monto), {
                    reserva_id: reservaId,
                });
                if (!resp || resp.success === false)
                    throw new Error(
                        resp?.error || 'No se pudo crear la sesión de pago',
                    );
                setClientSecret(resp.clientSecret || null);
                setPaymentIntentId(
                    resp.paymentIntentId || resp.paymentIntent?.id || null,
                );
            } catch (e) {
                setMensaje(
                    e?.message || 'Error al conectar con la pasarela de pagos',
                );
            } finally {
                setLoading(false);
            }
        };
        init();
    }, [monto, reservaId]);

    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white to-gray-50 font-sans text-gray-900">
            {/* BACKGROUND DINÁMICO */}
            <div className="absolute inset-0 z-0">
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-white via-white/80 to-transparent" />
                <div className="bg-[#7a0202]/6 absolute inset-0 z-10 mix-blend-multiply" />
                <img
                    src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
                    className="opacity-12 animate-slow-zoom h-full w-full scale-110 object-cover"
                    alt="Hotel Gludio Interior"
                />
            </div>

            <style
                dangerouslySetInnerHTML={{
                    __html: `
				@keyframes slow-zoom {
					0% { transform: scale(1); }
					100% { transform: scale(1.1); }
				}
				.animate-slow-zoom { animation: slow-zoom 20s infinite alternate ease-in-out; }
			`,
                }}
            />

            {/* Header */}
            <header className="relative z-20 flex items-center justify-between border-b border-gray-200 bg-white/60 p-8 backdrop-blur-sm">
                <button
                    onClick={() => window.history.back()}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 transition-colors hover:text-[#7a0202]"
                >
                    <ArrowLeftIcon className="h-4 w-4" /> Volver al inicio
                </button>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-full border border-[#7a0202]/30 px-3 py-1">
                        <ShieldCheckIcon className="h-3 w-3 text-[#7a0202]" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">
                            Garantía Hotel Gludio
                        </span>
                    </div>
                    <a
                        href="/ayuda"
                        className="rounded px-3 py-1 text-sm font-bold text-gray-700/90 hover:text-gray-900"
                    >
                        Asistencia
                    </a>
                </div>
            </header>

            <main className="relative z-20 mx-auto grid min-h-[calc(100vh-100px)] max-w-7xl grid-cols-1 items-center px-8 lg:grid-cols-12">
                {/* Info de la Reserva */}
                <div className="py-12 lg:col-span-5">
                    <div className="mb-12 space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7a0202]">
                            Proceso de Pago Seguro
                        </span>
                        <h1 className="text-5xl font-black uppercase italic leading-[0.9] tracking-tighter text-gray-900">
                            Confirmar <br />{' '}
                            <span className="text-gray-600">Reserva</span>
                        </h1>
                    </div>

                    <div className="space-y-8">
                        <div className="flex flex-col">
                            <span className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                                Total
                            </span>
                            <div className="flex items-baseline gap-2">
                                <span className="text-7xl font-black tracking-tighter text-gray-900">
                                    {monto || '0'}
                                </span>
                                <span className="text-2xl font-light text-[#7a0202]">
                                    EUR
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Área de Pago */}
                <div className="flex flex-col items-center justify-center p-8 lg:col-span-7">
                    {loading ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative">
                                <div className="absolute h-12 w-12 animate-ping rounded-full border border-[#7a0202]/20" />
                                <div className="relative h-12 w-12 animate-spin rounded-full border-2 border-[#7a0202] border-t-transparent" />
                            </div>
                            <p className="animate-pulse text-[10px] font-black uppercase tracking-[0.4em] text-[#7a0202]">
                                Preparando entorno de pago seguro...
                            </p>
                        </div>
                    ) : clientSecret && stripePromise ? (
                        <div className="animate-in fade-in slide-in-from-right-8 flex w-full justify-center duration-1000">
                            <Elements key={clientSecret} stripe={stripePromise} options={{ clientSecret }}>
                                <LatveriaCard
                                    clientSecret={clientSecret}
                                    paymentIntentId={paymentIntentId}
                                    name={page.props?.auth?.user?.name}
                                    email={page.props?.auth?.user?.email}
                                    onSuccess={() => {
                                        if (reservaId) {
                                            try {
                                                router.visit(
                                                    `/reservas/${reservaId}/edit`,
                                                );
                                            } catch (e) {
                                                window.location.href = `/reservas/${reservaId}/edit`;
                                            }
                                        } else {
                                            try {
                                                router.visit('/reservas');
                                            } catch (e) {
                                                window.location.href =
                                                    '/reservas';
                                            }
                                        }
                                    }}
                                    onError={(msg) => setMensaje(msg)}
                                />
                            </Elements>
                        </div>
                    ) : (
                        <div className="max-w-sm rounded-3xl border border-gray-100 bg-white p-10 text-center shadow-xl">
                            <LockClosedIcon className="mx-auto mb-4 h-8 w-8 text-[#7a0202]" />
                            <p className="mb-6 text-xs font-medium leading-relaxed text-gray-500">
                                {mensaje ||
                                    'No ha sido posible inicializar la sesión. Por favor, contacte con recepción o inténtelo más tarde.'}
                            </p>
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full rounded-xl bg-[#7a0202] py-4 text-[10px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-black"
                            >
                                Reintentar conexión
                            </button>
                        </div>
                    )}

                    {/* Footer de Seguridad */}
                    <div className="mt-12 flex items-center gap-8 opacity-30 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0">
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg"
                            className="h-4"
                            alt="Visa"
                        />
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg"
                            className="h-6"
                            alt="Mastercard"
                        />
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg"
                            className="h-4"
                            alt="Paypal"
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
