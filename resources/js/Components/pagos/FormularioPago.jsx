import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { usePage } from '@inertiajs/react';
import Campo from '@/Components/formulario/Campo';
import React, { useState, useMemo, useEffect } from 'react';
import { CreditCardIcon, MapPinIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

function FormularioPagoInterno({ reservaData, monto, onPagoExitoso, onError, aceptaTerminos = false, mostrarAceptacion = false, onAceptaChange = null }) {
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || document.querySelector('meta[name="csrf-token"]')?.content || '';
    const stripe = useStripe();
    const elements = useElements();

    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [acepta, setAcepta] = useState(aceptaTerminos);

    useEffect(() => { setAcepta(aceptaTerminos); }, [aceptaTerminos]);

    const user = page?.props?.auth?.user;
    const [direccion, setDireccion] = useState({
        calle: reservaData?.direccion?.calle || user?.direccion || '',
        ciudad: reservaData?.direccion?.ciudad || user?.ciudad || '',
        codigo_postal: reservaData?.direccion?.codigo_postal || user?.codigo_postal || '',
        pais: reservaData?.direccion?.pais || 'ES',
    });

    const [name, setName] = useState(reservaData?.name || user?.name || '');
    const [email, setEmail] = useState(reservaData?.email || user?.email || '');
    const [telefono, setTelefono] = useState(reservaData?.telefono || user?.telefono || '');

    const procesarPago = async (e) => {
        e.preventDefault();
        if (!stripe || !elements || !acepta) return;

        setProcesando(true);
        try {
            const esExtension = Boolean(reservaData?.es_extension || reservaData?.es_edicion_pago);
            let resId = reservaData?.reserva_id;

            if (!esExtension) {
                const service = await import('@/hooks/reservas/service');
                const dataReserva = await service.crearReserva({ ...reservaData, direccion, name, email, telefono });
                resId = dataReserva.reserva_id;
            }

            const resPI = await fetch('/pagos/crear-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ reserva_id: resId, monto }),
            });

            const dataPI = await resPI.json();
            if (!dataPI.success) throw new Error(dataPI.error || 'Error en comunicación');

            const { paymentIntent, error } = await stripe.confirmCardPayment(dataPI.clientSecret, {
                payment_method: {
                    card: elements.getElement(CardElement),
                    billing_details: { name, email, address: { line1: direccion.calle, city: direccion.ciudad, postal_code: direccion.codigo_postal, country: direccion.pais } },
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
        } catch (err) {
            setMensaje(err.message);
            onError(err.message);
        } finally {
            setProcesando(false);
        }
    };

    return (
        <div className="w-full mx-auto relative px-2 bg-gris">
            <form onSubmit={procesarPago} className="space-y-10 w-full">

                {/* SECCIÓN: DIRECCIÓN */}
                <div className="px-6">
                    <div className="flex items-center gap-4 mb-6">
                        <MapPinIcon className="h-5 w-5 text-gray-400" />
                        <h2 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.25em]">Detalles de Facturación</h2>
                    </div>

                    <div className="space-y-4">
                        <Campo
                            value={direccion.calle}
                            onChange={(e) => setDireccion({...direccion, calle: e.target.value})}
                            placeholder="DIRECCIÓN COMPLETA (CALLE, NÚMERO, PISO)"
                            className="w-full border-gray-200 rounded-lg py-3 px-4 text-[12px] font-bold placeholder:text-gray-300 focus:ring-[#7a0202] focus:border-[#7a0202]"
                        />
                        {/* Grid responsivo: 1 columna en móvil, 3 en tablets/desktop */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Campo value={direccion.ciudad} onChange={(e) => setDireccion({...direccion, ciudad: e.target.value})} placeholder="CIUDAD" className="border-gray-200 rounded-lg py-3 px-4 text-[12px] font-bold" />
                            <Campo value={direccion.codigo_postal} onChange={(e) => setDireccion({...direccion, codigo_postal: e.target.value})} placeholder="CÓDIGO POSTAL" className="border-gray-200 rounded-lg py-3 px-4 text-[12px] font-bold" />
                            <select value={direccion.pais} onChange={(e) => setDireccion({...direccion, pais: e.target.value})} className="border-gray-200 rounded-lg text-[11px] font-black uppercase bg-white px-3 h-[46px] focus:ring-[#7a0202]">
                                <option value="ES">España (ES)</option>
                                <option value="FR">Francia (FR)</option>
                                <option value="PT">Portugal (PT)</option>
                            </select>
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
