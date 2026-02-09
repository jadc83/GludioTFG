import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import Modal from '@/Components/Modal';
import { formatearMoneda } from '@/utils/formatters';
import axios from 'axios';
import { emitToast } from '@/utils/toast';
import { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { Elements } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/utils/stripe';
import PaymentBox from '@/Components/pagos/PaymentBox';
import { usePage } from '@inertiajs/react';
import * as pagosApi from '@/api/pagos';

dayjs.locale('es');

export default function ModalFechas({
    mostrar,
    modalCheckIn,
    modalCheckOut,
    setModalCheckIn,
    setModalCheckOut,
    isCheckedIn,
    vistaPrevia,
    vistaPreviaCargada,
    cargandoVistaPrevia,
    errorVistaPrevia,
    onCerrar,
    onConfirmar,
    onApplied,
    procesando,
    reserva,
    clearPreview,
}) {
    if (!mostrar) return null;

    const [creatingPi, setCreatingPi] = useState(false);
    const [needPayment, setNeedPayment] = useState(false);
    const [piClientSecret, setPiClientSecret] = useState(null);
    const [piPaymentIntentId, setPiPaymentIntentId] = useState(null);
    const page = usePage();
    const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY || page?.props?.stripe_public || null;
    const stripePromise = useMemo(() => getStripePromise(stripePublicKey), [stripePublicKey]);
    const mostrarAviso = () => {
        if (!vistaPrevia) return null;
        const delta = Number(vistaPrevia.nuevo_total) - Number(vistaPrevia.viejo_total);
        if (delta > 0) {
            // se debe pagar -> mostrar aviso legal/penalización integrado en el modal (estilo neutro)
            const penalizacion = Number(vistaPrevia.penalizacion ?? 20);
            return (
                <div className="p-3 border border-gray-100 rounded-lg bg-white">
                    <div className="flex flex-col gap-2">
                        <div className="text-sm font-semibold text-gray-800">Aviso: penalización aplicable</div>
                        <div className="text-xs text-gray-600">Esta modificación de fechas conlleva una penalización de {formatearMoneda(penalizacion)} según nuestras condiciones de reserva. Al confirmar, autoriza al establecimiento a cargar este importe en el método de pago proporcionado. La penalización se debe, en parte, a retenciones y tarifas aplicadas por Stripe durante el procesamiento de pagos.</div>
                        <div className="text-[11px] text-gray-500">Nota: las modificaciones realizadas dentro de las 48 horas previas al check-in pueden estar sujetas a penalizaciones. Los cargos se procesan a través de Stripe y están sujetos a sus términos y condiciones.</div>
                    </div>
                </div>
            );
        }

        // reducción de estancia -> mostrar reembolso bruto, penalización y neto
        const rawRefund = Math.max(0, Number(vistaPrevia.estimate_refund_raw ?? (vistaPrevia.viejo_total - vistaPrevia.nuevo_total)));
        const penalizacion = Number(vistaPrevia.penalizacion || 0);
        const finalRefund = Number(vistaPrevia.estimate_refund || 0);

        return (
            <div>
                <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">Reembolso estimado (bruto)</span>
                <span className="text-2xl font-black text-green-600">-{formatearMoneda(rawRefund)}</span>

                <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Penalización</span>
                    <span className="text-xs font-bold text-gray-700">-{formatearMoneda(penalizacion)}</span>
                </div>

                <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-gray-400">Reembolso neto</span>
                    <span className="text-lg font-black text-green-600">-{formatearMoneda(finalRefund)}</span>
                </div>

                {finalRefund <= 0 && penalizacion > 0 && (
                    <div className="mt-1 text-xs text-gray-400">La penalización cubre el reembolso — no se devuelve importe.</div>
                )}
            </div>
        );
    };

    const renderPorNoche = () => {
        if (!vistaPrevia) return null;
        return (
            <div className="flex gap-3 bg-white p-8">

                {/* Si la preview indica cargo, mostrar flujo de pago (Elements + formulario) */}
                {vistaPrevia && vistaPreviaCargada && Number(vistaPrevia.estimate_charge || 0) > 0 ? (
                    <div className="flex-1">
                                                {/* Importe mostrado únicamente en el formulario seguro; eliminado del CTA */}
                        {!needPayment && (
                            <div className="flex justify-end">
                                <button
                                    onClick={async () => {
                                        if (creatingPi) return;
                                        setCreatingPi(true);
                                        try {
                                            // Incluir metadata para que el backend pueda mapear el PaymentIntent a la reserva
                                            const resp = await pagosApi.crearPaymentIntentStandalone(Number(vistaPrevia.estimate_charge || 0), { receipt_email: reserva?.reservable?.email, reserva_id: reserva?.id, localizador: reserva?.localizador });
                                            if (!resp || resp.success === false) throw new Error(resp?.error || 'No se pudo crear PaymentIntent');
                                            setPiClientSecret(resp.clientSecret ?? null);
                                            setPiPaymentIntentId(resp.paymentIntentId ?? null);
                                            setNeedPayment(true);
                                        } catch (e) {
                                            emitToast(e?.message || 'Error creando PaymentIntent', 'error');
                                        } finally {
                                            setCreatingPi(false);
                                        }
                                    }}
                                    className="ml-auto flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-100 transition hover:bg-[#5a0101] disabled:opacity-50"
                                >{creatingPi ? 'Preparando pago...' : 'Estoy de acuerdo'}</button>
                            </div>
                        )}

                        {needPayment && piClientSecret && stripePromise && (
                            <div className="mt-4 w-full">
                                <Elements stripe={stripePromise} options={{ clientSecret: piClientSecret }}>
                                    <PaymentBox
                                        clientSecret={piClientSecret}
                                        paymentIntentId={piPaymentIntentId}
                                        reserva={reserva}
                                        amount={Number(vistaPrevia.penalizacion ?? vistaPrevia.estimate_charge ?? 0)}
                                        onConfirmed={async (paymentIntentId) => {
                                            const getCookie = (name) => {
                                                const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                                                return match ? decodeURIComponent(match[2]) : null;
                                            };
                                            const payload2 = {
                                                check_in: modalCheckIn,
                                                check_out: modalCheckOut,
                                                status: reserva.status || 'pendiente',
                                                pago: typeof reserva.pago === 'string' ? reserva.pago : (reserva.pago?.estado ?? reserva.pago ?? 'pendiente'),
                                                payment_intent_id: paymentIntentId,
                                            };
                                            const xsrf = getCookie('XSRF-TOKEN');
                                            try {
                                                const res2 = await axios.put(`/reservas/${reserva.id}`, payload2, {
                                                    withCredentials: true,
                                                    headers: {
                                                        Accept: 'application/json',
                                                        'X-Requested-With': 'XMLHttpRequest',
                                                        ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                                                    },
                                                });
                                                if (res2?.data?.success) {
                                                    emitToast('Fechas actualizadas', 'success');
                                                    onApplied && onApplied(res2.data);
                                                } else {
                                                    emitToast(res2?.data?.message || 'No se pudo actualizar', 'error');
                                                }
                                            } catch (e) {
                                                emitToast(e?.response?.data?.error || e?.message || 'Error aplicando cambios', 'error');
                                            } finally {
                                                setNeedPayment(false);
                                            }
                                        }}
                                    />
                                </Elements>
                            </div>
                        )}
                    </div>
                ) : (
                    // Sin cargo adicional: botón simple para aplicar cambios
                    <div className="flex-1">
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    try {
                                        if (typeof clearPreview === 'function') clearPreview();
                                    } catch (e) {}
                                    if (typeof setModalCheckIn === 'function' && typeof setModalCheckOut === 'function') {
                                        setModalCheckIn(reserva?.check_in || '');
                                        setModalCheckOut(reserva?.check_out || '');
                                    }
                                }}
                                className="rounded-2xl border border-gray-200 bg-white py-3 px-4 text-xs font-bold uppercase tracking-widest text-gray-700 hover:bg-gray-50"
                            >Limpiar</button>

                            <button
                                onClick={async () => {
                                    const getCookie = (name) => {
                                        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
                                        return match ? decodeURIComponent(match[2]) : null;
                                    };
                                    try {
                                        const payload = {
                                            check_in: modalCheckIn,
                                            check_out: modalCheckOut,
                                            status: reserva.status || 'pendiente',
                                            pago: typeof reserva.pago === 'string' ? reserva.pago : (reserva.pago?.estado ?? reserva.pago ?? 'pendiente'),
                                        };
                                        const xsrf = getCookie('XSRF-TOKEN');
                                        const res = await axios.put(`/reservas/${reserva.id}`, payload, {
                                            withCredentials: true,
                                            headers: {
                                                Accept: 'application/json',
                                                'X-Requested-With': 'XMLHttpRequest',
                                                ...(xsrf ? { 'X-XSRF-TOKEN': xsrf } : {}),
                                            },
                                        });
                                        if (res?.data?.success) {
                                            emitToast('Fechas actualizadas', 'success');
                                            onApplied && onApplied(res.data);
                                        } else {
                                            emitToast(res?.data?.message || 'No se pudo actualizar', 'error');
                                        }
                                    } catch (err) {
                                        const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'Error actualizando fechas';
                                        emitToast(msg, 'error');
                                    }
                                }}
                                className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-100 transition hover:bg-[#5a0101] disabled:opacity-50"
                            >Aplicar Cambios</button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <Modal show={mostrar} onClose={onCerrar} maxWidth="2xl">
            <div className="p-4 rounded-md relative">
                <button aria-label="Cerrar" onClick={onCerrar} className="absolute top-3 right-3 p-2 rounded-full text-gray-600 hover:bg-gray-100">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>

                <div className="grid grid-cols-1 gap-4">
                    <div>{mostrarAviso()}</div>
                    <div className="mt-4">{renderPorNoche()}</div>
                </div>
            </div>
        </Modal>
    );
}

// PaymentConfirm refactorizado a Componentes reutilizables (CardConfirmForm + PaymentBox)
