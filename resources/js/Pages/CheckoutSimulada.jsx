import React, { useEffect, useMemo, useState } from 'react';
import { usePage, router } from '@inertiajs/react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/utils/stripe';
import { crearPaymentIntentStandalone } from '@/api/pagos';
import LatveriaCard from '@/Components/pagos/LatveriaCard';
import { ShieldCheckIcon, LockClosedIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

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
			if (!monto) return setMensaje('Importe de reserva no especificado');
			setLoading(true);
			try {
				const resp = await crearPaymentIntentStandalone(Number(monto), { reserva_id: reservaId });
				if (!resp || resp.success === false) throw new Error(resp?.error || 'No se pudo crear la sesión de pago');
				setClientSecret(resp.clientSecret || null);
				setPaymentIntentId(resp.paymentIntentId || resp.paymentIntent?.id || null);
			} catch (e) {
				setMensaje(e?.message || 'Error al conectar con la pasarela de pagos');
			} finally {
				setLoading(false);
			}
		};
		init();
	}, [monto, reservaId]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-900 font-sans overflow-hidden relative">

			{/* BACKGROUND DINÁMICO */}
			<div className="absolute inset-0 z-0">
				<div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
				<div className="absolute inset-0 bg-[#7a0202]/6 z-10 mix-blend-multiply" />
				<img
					src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=2070&auto=format&fit=crop"
					className="w-full h-full object-cover opacity-12 scale-110 animate-slow-zoom"
					alt="Hotel Gludio Interior"
				/>
			</div>

			<style dangerouslySetInnerHTML={{ __html: `
				@keyframes slow-zoom {
					0% { transform: scale(1); }
					100% { transform: scale(1.1); }
				}
				.animate-slow-zoom { animation: slow-zoom 20s infinite alternate ease-in-out; }
			`}} />

			{/* Header */}
			<header className="relative z-20 p-8 flex justify-between items-center border-b border-gray-200 backdrop-blur-sm bg-white/60">
				<button onClick={() => window.history.back()} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 hover:text-[#7a0202] transition-colors">
					<ArrowLeftIcon className="w-4 h-4" /> Volver al inicio
				</button>
				<div className="flex items-center gap-4">
					<div className="flex items-center gap-2 px-3 py-1 border border-[#7a0202]/30 rounded-full">
						<ShieldCheckIcon className="w-3 h-3 text-[#7a0202]" />
						<span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Garantía Hotel Gludio</span>
					</div>
					<a href="/ayuda" className="text-sm font-bold text-gray-700/90 hover:text-gray-900 px-3 py-1 rounded">Asistencia</a>
				</div>
			</header>

			<main className="relative z-20 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 min-h-[calc(100vh-100px)] items-center px-8">

				{/* Info de la Reserva */}
				<div className="lg:col-span-5 py-12">
					<div className="space-y-2 mb-12">
						<span className="text-[10px] font-black uppercase tracking-[0.5em] text-[#7a0202]">Proceso de Pago Seguro</span>
						<h1 className="text-5xl font-black uppercase tracking-tighter leading-[0.9] italic text-gray-900">
							Confirmar <br /> <span className="text-gray-600">Reserva</span>
						</h1>
					</div>

					<div className="space-y-8">
						<div className="flex flex-col">
							<span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">Total</span>
							<div className="flex items-baseline gap-2">
								<span className="text-7xl font-black tracking-tighter text-gray-900">{monto || '0'}</span>
								<span className="text-2xl font-light text-[#7a0202]">EUR</span>
							</div>
						</div>
					</div>
				</div>

				{/* Área de Pago */}
				<div className="lg:col-span-7 flex flex-col items-center justify-center p-8">
					{loading ? (
						<div className="flex flex-col items-center gap-6">
							<div className="relative">
								<div className="w-12 h-12 border border-[#7a0202]/20 rounded-full animate-ping absolute" />
								<div className="w-12 h-12 border-2 border-[#7a0202] border-t-transparent rounded-full animate-spin relative" />
							</div>
							<p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#7a0202] animate-pulse">Preparando entorno de pago seguro...</p>
						</div>
					) : clientSecret && stripePromise ? (
						<div className="w-full flex justify-center animate-in fade-in slide-in-from-right-8 duration-1000">
							<Elements stripe={stripePromise} options={{ clientSecret }}>
								<LatveriaCard
									clientSecret={clientSecret}
									paymentIntentId={paymentIntentId}
									name={page.props?.auth?.user?.name}
									email={page.props?.auth?.user?.email}
									onSuccess={(data) => {
										if (reservaId) {
											try {
												router.visit(`/reservas/${reservaId}/edit`);
											} catch (e) {
												window.location.href = `/reservas/${reservaId}/edit`;
											}
										} else {
											try {
												router.visit('/reservas');
											} catch (e) {
												window.location.href = '/reservas';
											}
										}
									}}
									onError={(msg) => setMensaje(msg)}
								/>
							</Elements>
						</div>
					) : (
						<div className="bg-white p-10 border border-gray-100 rounded-3xl text-center shadow-xl max-w-sm">
							<LockClosedIcon className="w-8 h-8 mx-auto mb-4 text-[#7a0202]" />
							<p className="text-xs text-gray-500 leading-relaxed mb-6 font-medium">
								{mensaje || 'No ha sido posible inicializar la sesión. Por favor, contacte con recepción o inténtelo más tarde.'}
							</p>
							<button onClick={() => window.location.reload()} className="w-full py-4 bg-[#7a0202] text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-xl hover:bg-black transition-all">
								Reintentar conexión
							</button>
						</div>
					)}

					{/* Footer de Seguridad */}
					<div className="mt-12 flex items-center gap-8 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
						<img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" className="h-4" alt="Visa" />
						<img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" className="h-6" alt="Mastercard" />
						<img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" className="h-4" alt="Paypal" />
					</div>
				</div>
			</main>
		</div>
	);
}
