import ErrorBoundary from '@/Components/ErrorBoundary';
import FormularioPago from '@/Components/pagos/FormularioPago';
import { formatearMoneda } from '@/utils/formatters';
import { loadStripe } from '@stripe/stripe-js';
import { crearCheckoutSession } from '@/api/pagos';
import { useState } from 'react';

export default function ModalPago({
    mostrar,
    monto,
    onCerrar,
    onPagoExitoso,
    onError,
    reservaData,
    aceptaTerminos,
    mostrarAceptacion,
    onCambioAceptaTerminos,
}) {
    const [checkoutLoading, setCheckoutLoading] = useState(false);

    if (!mostrar) return null;

    const handleCheckout = async () => {
        try {
            setCheckoutLoading(true);
            const res = await crearCheckoutSession(reservaData.reserva_id, { monto });
            if (!res || (!res.sessionUrl && !res.sessionId)) {
                throw new Error(res?.error || 'No se pudo crear sesión de Checkout');
            }

            // Nuevo flujo: Stripe ya no soporta redirectToCheckout; usar la URL de sesión si está presente.
            if (res.sessionUrl) {
                window.location.href = res.sessionUrl;
                return;
            }

            // Compatibilidad antigua (fallback)
            const stripe = await loadStripe(res.publicKey);
            const { error } = await stripe.redirectToCheckout({ sessionId: res.sessionId });
            if (error) throw error;
        } catch (e) {
            console.error('Error creando checkout session:', e);
            onError?.(e);
        } finally {
            setCheckoutLoading(false);
        }
    };

    const canCheckout = !(mostrarAceptacion && !aceptaTerminos) && !checkoutLoading;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
            <div className="animate-in zoom-in w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl duration-200">
                <div className="mb-8 flex items-start justify-between">
                    <div>
                        <h2 className="text-2xl font-black uppercase leading-tight text-gray-900">Pago Adicional</h2>
                        <p className="mt-1 text-sm font-medium text-gray-400">Se requiere saldar la diferencia para aplicar cambios.</p>
                    </div>
                    <button onClick={onCerrar} className="font-bold text-gray-300 hover:text-gray-500">✕</button>
                </div>

                <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total a pagar ahora</span>
                    <div className="mt-1 text-4xl font-black text-[#7a0202]">{formatearMoneda(monto)}</div>
                </div>

                <ErrorBoundary>
                    <FormularioPago
                        monto={monto}
                        onPagoExitoso={onPagoExitoso}
                        onError={onError}
                        reservaData={reservaData}
                        aceptaTerminos={aceptaTerminos}
                        mostrarAceptacion={mostrarAceptacion}
                        onCambioAceptaTerminos={onCambioAceptaTerminos}
                    />
                </ErrorBoundary>

                <div className="mt-6 space-y-3">
                    <button onClick={handleCheckout} disabled={!canCheckout} className="w-full rounded-2xl bg-yellow-600 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-yellow-700 disabled:opacity-50">
                        {checkoutLoading ? 'Redirigiendo...' : 'Pagar con Stripe (Checkout)'}
                    </button>

                    <button onClick={onCerrar} className="w-full py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:text-gray-600">Cancelar operación</button>
                </div>
            </div>
        </div>
    );
}
