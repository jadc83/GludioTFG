import { CheckCircleIcon, DocumentArrowDownIcon, ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon, CreditCardIcon, ShieldCheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useState, useRef } from 'react';
import FormularioPago from '@/Components/pagos/FormularioPago';
import dayjs from 'dayjs';

export default function DetalleReserva({ reserva: initialReserva }) {
    const [reserva, setReserva] = useState(initialReserva);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [modalCheckIn, setModalCheckIn] = useState('');
    const [modalCheckOut, setModalCheckOut] = useState('');
    const dateModalRef = useRef(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [pendingApplyAfterPayment, setPendingApplyAfterPayment] = useState(false);
    const [aceptaTerminosPago, setAceptaTerminosPago] = useState(false);
    const [paymentModalHeight, setPaymentModalHeight] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    };

    const applyDateChange = async (newCheckIn, newCheckOut, pagoId = null) => {
        try {
            setIsProcessing(true);
            const axios = (await import('axios')).default;
            const payload = { check_in: newCheckIn.format('YYYY-MM-DD'), check_out: newCheckOut.format('YYYY-MM-DD') };
            if (pagoId) payload.pago_id = pagoId;
            const res = await axios.post(`/reservas/${reserva.localizador}/modificar-estancia`, payload);
            showToast(res?.data?.message || 'Reserva actualizada', 'success');
            if (res?.data?.reserva) setReserva(prev => ({ ...prev, ...res.data.reserva }));
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error al actualizar fechas';
            showToast(msg, 'error');
        } finally { setIsProcessing(false); }
    };

    const fetchPreview = async (checkInStr, checkOutStr) => {
        try {
            setPreviewError(null);
            setPreviewLoading(true);
            const axios = (await import('axios')).default;
            const res = await axios.get(`/reservas/${reserva.localizador}/preview-modificar-estancia`, { params: { check_in: checkInStr, check_out: checkOutStr } });
            setPreview(res?.data || null);
            return res?.data || null;
        } catch (err) {
            setPreview(null);
            setPreviewError(err?.response?.data?.message || err?.message || 'Error calculando vista previa');
            return null;
        } finally { setPreviewLoading(false); }
    };

    const openDateModal = () => {
        const ci = dayjs(reserva.check_in).format('YYYY-MM-DD');
        const co = dayjs(reserva.check_out).format('YYYY-MM-DD');
        setModalCheckIn(ci);
        setModalCheckOut(co);
            setShowDateModal(true);
        fetchPreview(ci, co);
    };

    // Modal confirm handler: re-use applyDateChange after re-checking preview
    const confirmDateModal = async () => {
        try {
            setIsProcessing(true);
            const newCheckIn = dayjs(modalCheckIn);
            const newCheckOut = dayjs(modalCheckOut);
            if (!newCheckOut.isAfter(newCheckIn)) { showToast('Fechas inválidas.', 'error'); return; }

            // Refetch preview to ensure availability
            const latestPreview = await fetchPreview(modalCheckIn, modalCheckOut);
            if (latestPreview && latestPreview.available === false) { showToast('No hay disponibilidad para las fechas seleccionadas.', 'error'); return; }

            // Si hay cargo adicional, abrimos modal de pago y aplicamos el cambio tras el pago
            if (latestPreview && latestPreview.estimate_charge > 0) {
                setPaymentAmount(latestPreview.estimate_charge);
                setPendingApplyAfterPayment(true);
                // medir la altura del modal de fecha y usarla en la modal de pago
                try {
                    const h = dateModalRef?.current?.offsetHeight || null;
                    setPaymentModalHeight(h);
                } catch (e) {
                    setPaymentModalHeight(null);
                }
                setShowPaymentModal(true);
                return;
            }

            // Si hay reembolso estimado, aplicamos el cambio y solicitamos reembolso automáticamente
            await applyDateChange(newCheckIn, newCheckOut);
            if (latestPreview && latestPreview.estimate_refund > 0) {
                try {
                    const axios = (await import('axios')).default;
                    const monto = latestPreview.estimate_refund;
                    const r = await axios.post(`/reservas/${reserva.id}/reembolsar`, { monto });
                    showToast(r?.data?.message || 'Reembolso solicitado correctamente.', 'success');
                    const refreshed = await axios.get(`/reservas/buscar/${reserva.localizador}`);
                    if (refreshed?.data?.reserva) setReserva(prev => ({ ...prev, ...refreshed.data.reserva }));
                } catch (err) {
                    const msg = err?.response?.data?.message || err?.message || 'Error solicitando reembolso.';
                    showToast(msg, 'error');
                }
            }

            setShowDateModal(false);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error al actualizar fechas';
            showToast(msg, 'error');
        } finally { setIsProcessing(false); }
    };

    const handlePagoExitoso = async (paymentResult) => {
        setShowPaymentModal(false);
        if (!pendingApplyAfterPayment) return;
        try {
            setIsProcessing(true);
            const newCheckIn = dayjs(modalCheckIn);
            const newCheckOut = dayjs(modalCheckOut);
            const pagoId = paymentResult?.pago_id || null;
            await applyDateChange(newCheckIn, newCheckOut, pagoId);
            // Refrescar reserva completa
            const axios = (await import('axios')).default;
            const refreshed = await axios.get(`/reservas/buscar/${reserva.localizador}`);
            if (refreshed?.data?.reserva) setReserva(prev => ({ ...prev, ...refreshed.data.reserva }));
            // Cerrar la modal de edición de fechas al completarse el cambio
            setShowDateModal(false);
            showToast('Cambio aplicado tras pago.', 'success');
        } catch (err) {
            const msg = err?.response?.data?.message || err?.message || 'Error aplicando cambio tras pago';
            showToast(msg, 'error');
        } finally {
            setPendingApplyAfterPayment(false);
            setIsProcessing(false);
        }
    };


    const handlePagoError = (err) => {
        setShowPaymentModal(false);
        setPendingApplyAfterPayment(false);
        const msg = err?.message || 'Error en pago';
        showToast(msg, 'error');
    };



    const getStatusBadge = (status) => {
        const colors = { 'pendiente': 'badge-warning', 'confirmada': 'badge-success', 'completada': 'badge-success', 'cancelada': 'badge-error' };
        return colors[status] || 'badge-gray';
    };

    const getPagoBadge = (pago) => {
        const colors = { 'pendiente': 'badge-warning', 'pagado': 'badge-success', 'fallido': 'badge-error' };
        return colors[pago] || 'badge-gray';
    };

    // Calcular cuánto queda por reembolsar sobre el ÚLTIMO pago completado.
    // Si no hay pago, o no hay información, fallback al restante sobre la reserva.
    let refundableAmount = 0;
    try {
        const pagos = reserva.pagos || [];
        let ultimoPago = null;
        for (let i = pagos.length - 1; i >= 0; i--) {
            if (pagos[i].estado === 'completado' || pagos[i].estado === 'procesando' || pagos[i].estado === 'pagado') { ultimoPago = pagos[i]; break; }
        }
        if (ultimoPago) {
            const pagosRefunds = reserva.reembolsos || [];
            // sumar reembolsos que pertenecen a este pago (si el objeto tiene pago_id o similar)
            let sumRefundsOnPago = 0;
            pagosRefunds.forEach(r => {
                // r.pago_id puede no estar presente en la API, intentar comparar por stripe_refund/payment linkage no disponible en cliente
                if (!r.pago_id || r.pago_id === ultimoPago.id) {
                    sumRefundsOnPago += (r.monto || 0);
                }
            });
            refundableAmount = Math.max(0, (ultimoPago.monto || 0) - sumRefundsOnPago);
        } else {
            refundableAmount = Math.max(0, (reserva.precio_total || 0) - (reserva.reembolsos_total || 0));
        }
    } catch (e) { refundableAmount = Math.max(0, (reserva.precio_total || 0) - (reserva.reembolsos_total || 0)); }

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris pt-6 pb-6">
                <div className="mx-auto max-w-5xl px-4">
                    <div className="space-y-3">
                        <div className="relative rounded-lg bg-white p-3 shadow-md flex items-center justify-between">
                            <div className="flex items-baseline gap-3">
                                <h1 className="text-2xl font-bold text-gray-800">Reserva</h1>
                                <span className="font-mono font-bold text-[#7a0202] text-base">{reserva.localizador}</span>
                            </div>
                            {!String(reserva.status || '').toLowerCase().includes('cancel') && (<CheckCircleIcon className="h-8 w-8 text-green-500 flex-shrink-0" />)}
                            {String(reserva.status || '').toLowerCase().includes('cancel') && (<div className="absolute top-3 right-3 bg-[#7a0202] text-white px-3 py-1 text-sm font-bold rounded shadow-lg">CANCELADA</div>)}
                        </div>

                        <div className="rounded-lg bg-gradient-to-r from-[#7a0202] to-[#920303] p-3 shadow-md text-white flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold opacity-90">TOTAL</p>
                                <p className="text-2xl font-bold">{formatearMoneda(reserva.precio_total)}</p>
                            </div>
                            {/* reembolsos_total removed per UX request */}

                            {reserva.reembolsos && reserva.reembolsos.length > 0 && (
                                <div className="ml-4 text-right text-xs">
                                    <div className="font-semibold">Detalles de reembolso</div>
                                    {reserva.reembolsos.map((r) => (
                                        <div key={r.id} className="text-sm text-green-100">{r.tipo.charAt(0).toUpperCase() + r.tipo.slice(1)}: {formatearMoneda(r.monto)} {r.reason ? ` (${r.reason})` : ''}</div>
                                    ))}
                                </div>
                            )}
                            <div className="flex items-center gap-3">
                                <button onClick={() => window.location.href = `/reservas/${reserva.localizador}/pdf`} className="bg-transparent border-0 text-white px-3 py-2 rounded flex items-center gap-2 text-sm hover:opacity-80"><DocumentArrowDownIcon className="h-4 w-4" />PDF</button>
                                {reserva.pago === 'pagado' && (
                                    <>
                                        {refundableAmount > 0 && (
                                            <button disabled={isProcessing} onClick={() => {
                                                if (isProcessing) return;
                                                if (!confirm('Solicitar reembolso completo y cancelar la reserva?')) return;
                                                    setIsProcessing(true);
                                                    import('axios').then(({ default: axios }) => {
                                                        axios.post(`/reservas/${reserva.id}/reembolsar`, { monto: refundableAmount, cancelar: true }).then((res) => { showToast(res?.data?.message || 'Reembolso solicitado correctamente.', 'success'); return axios.get(`/reservas/buscar/${reserva.localizador}`); }).then((res2) => { if (res2?.data?.reserva) { setReserva(prev => ({ ...prev, ...res2.data.reserva })); } }).catch((err) => { const msg = err?.response?.data?.message || err?.message || 'Error solicitando reembolso.'; showToast(msg, 'error'); console.error('Reembolso error:', err); }).finally(() => setIsProcessing(false));
                                                    });
                                            }} className={`bg-red-50 text-[#7a0202] font-semibold px-3 py-2 rounded shadow-sm hover:opacity-90 text-sm ${isProcessing ? 'opacity-60 cursor-wait' : ''}`}>Reembolso completo</button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="rounded-lg bg-white p-3 shadow-md space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div><p className="text-xs font-bold text-[#7a0202] uppercase">Huésped</p><p className="text-gray-800 font-semibold">{reserva.cliente.nombre}</p></div>
                                    <div>
                                        <p className="text-xs font-bold text-[#7a0202] uppercase">Check-in</p>
                                        <div className="flex items-center gap-2">
                                            <>
                                                <div className="text-gray-800 font-semibold">{formatearFecha(reserva.check_in)}</div>
                                                <div className="flex items-center gap-1">
                                                    <button title="Editar fechas" onClick={openDateModal} className="h-7 w-7 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-100">
                                                        <PencilIcon className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-[#7a0202] uppercase">Check-out</p>
                                        <div className="flex items-center gap-2">
                                            <>
                                                <div className="text-gray-800 font-semibold">{formatearFecha(reserva.check_out)}</div>
                                                <div className="flex items-center gap-1">
                                                    <button title="Editar fechas" onClick={openDateModal} className="h-7 w-7 flex items-center justify-center rounded-full bg-transparent hover:bg-gray-100">
                                                        <PencilIcon className="h-4 w-4 text-gray-600" />
                                                    </button>
                                                </div>
                                            </>
                                        </div>
                                    </div>
                                <div>
                                    <div className="mb-1"><p className="text-xs font-bold text-[#7a0202] uppercase">Estado reserva</p><span className={`badge ${getStatusBadge(reserva.status)} text-xs py-0.5 px-2`}>{reserva.status.charAt(0).toUpperCase() + reserva.status.slice(1)}</span></div>
                                    <div><p className="text-xs font-bold text-[#7a0202] uppercase">Estado pago</p><span className={`badge ${getPagoBadge(reserva.pago)} text-xs py-0.5 px-2`}>{reserva.pago.charAt(0).toUpperCase() + reserva.pago.slice(1)}</span></div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-2">Habitaciones</h3>
                                <div className="grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
                                    {reserva.habitaciones.map((hab, idx) => (
                                        <div key={idx} className="border border-gris p-2 rounded text-xs flex justify-between items-center">
                                            <span className="font-semibold">{(hab.tipo ? (hab.tipo.charAt(0).toUpperCase() + hab.tipo.slice(1)) : 'Habitación')}</span>
                                            <span className="text-[#7a0202] font-bold">{formatearMoneda(hab.precio)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-gray-800 mb-3">Hotel Gludio</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                    <div className="flex gap-2"><MapPinIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-gray-600">Dirección</p><p className="text-gray-800">Calle Principal 123</p></div></div>
                                    <div className="flex gap-2"><PhoneIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-gray-600">Teléfono</p><p className="text-gray-800">+34 91 234 5678</p></div></div>
                                    <div className="flex gap-2"><EnvelopeIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-gray-600">Email</p><p className="text-gray-800">info@hotel.com</p></div></div>
                                    <div className="flex gap-2"><ClockIcon className="h-4 w-4 text-[#7a0202] flex-shrink-0 mt-0.5" /><div><p className="font-semibold text-gray-600">Atención</p><p className="text-gray-800">24h disponible</p></div></div>
                                </div>
                            </div>

                            <div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                    <div><p className="font-bold text-gray-800 mb-2">Horarios</p><div className="space-y-1"><div className="flex justify-between"><span className="text-gray-600">Check-in:</span> <span className="font-semibold">15:00</span></div><div className="flex justify-between"><span className="text-gray-600">Check-out:</span> <span className="font-semibold">11:00</span></div><div className="flex justify-between"><span className="text-gray-600">Conserjería:</span> <span className="font-semibold">24/7</span></div></div></div>

                                    <div><p className="font-bold text-gray-800 mb-2">Políticas</p><div className="space-y-1"><div className="flex justify-between"><span className="text-gray-600">Cancelación:</span> <span className="font-semibold">48h gratis</span></div><div className="flex justify-between"><span className="text-gray-600">Modificación:</span> <span className="font-semibold">Sin costo</span></div><div className="flex justify-between"><span className="text-gray-600">Mascotas:</span> <span className="font-semibold">No</span></div></div></div>

                                    <div><p className="font-bold text-gray-800 mb-2">Servicios</p><div className="space-y-1"><div className="flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3 text-[#7a0202]" /> WiFi gratis</div><div className="flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3 text-[#7a0202]" /> Desayuno</div><div className="flex items-center gap-1"><ShieldCheckIcon className="h-3 w-3 text-[#7a0202]" /> Aparcamiento</div></div></div>
                                </div>
                            </div>
                        </div>

                        {/* Edición via modal eliminada; permitimos cambios directos con botones */}

                        <div className="grid grid-cols-2 gap-3">
                            {String(reserva.status || '').toLowerCase() === 'pendiente' && (
                                <button onClick={() => { window.location.href = route('scan-qr') + '?localizador=' + encodeURIComponent(reserva.localizador) + '&action=checkin'; }} className="w-full mb-0 bg-green-600 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition">✅ Hacer check-in</button>
                            )}
                            {String(reserva.status || '').toLowerCase() !== 'checked_out' && (
                                <button onClick={() => { window.location.href = route('scan-qr') + '?localizador=' + encodeURIComponent(reserva.localizador) + '&action=checkout'; }} className="w-full mb-0 bg-yellow-600 text-white font-semibold py-3 rounded-lg hover:opacity-90 transition">🧾 Hacer check-out</button>
                            )}
                        </div>



                        <Link href="/" className="inline-flex items-center gap-1 text-[#7a0202] hover:text-[#6b0101] font-semibold text-sm mt-3"><ArrowLeftIcon className="h-4 w-4" />Volver</Link>

                        {toast && (<div className={`fixed right-4 bottom-6 z-50 max-w-xs px-4 py-3 rounded shadow-lg text-sm text-white bg-[#7a0202]`}>{toast.message}</div>)}
                        {/* Date modal */}
                        {showDateModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                <div ref={dateModalRef} className="bg-white rounded-lg p-6 w-full max-w-md">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold">Modificar fechas</h3>
                                        <button onClick={() => setShowDateModal(false)} className="p-1 rounded hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-gray-600"/></button>
                                    </div>
                                    <div className="grid grid-cols-1 gap-3">
                                        <label className="text-xs font-semibold">Check-in</label>
                                        <input type="date" value={modalCheckIn} onChange={(e) => { setModalCheckIn(e.target.value); fetchPreview(e.target.value, modalCheckOut); }} className="input input-bordered w-full" />
                                        <label className="text-xs font-semibold">Check-out</label>
                                        <input type="date" value={modalCheckOut} onChange={(e) => { setModalCheckOut(e.target.value); fetchPreview(modalCheckIn, e.target.value); }} className="input input-bordered w-full" />
                                    </div>

                                    <div className="mt-4 p-3 border rounded bg-gray-50">
                                        {previewLoading && (<div className="text-sm text-gray-600">Cargando vista previa…</div>)}
                                        {previewError && (<div className="text-sm text-red-600">{previewError}</div>)}
                                        {preview && !previewLoading && (
                                            <div className="text-sm text-gray-800 space-y-3">
                                                <div className="grid grid-cols-1 gap-2">
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <div className="text-xs text-gray-500">Primer pago</div>
                                                            <div className="font-semibold">{formatearMoneda(preview.viejo_total)} <span className="text-xs text-gray-500">({preview.nights_old} noches)</span></div>
                                                        </div>
                                                        <div className="text-sm text-gray-700" />
                                                    </div>

                                                    {(preview.nuevo_total !== preview.viejo_total || preview.nights_new !== preview.nights_old) && (
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <div className="text-xs text-gray-500">Nuevo total</div>
                                                                <div className="font-semibold">{formatearMoneda(preview.nuevo_total)} <span className="text-xs text-gray-500">({preview.nights_new} noches)</span></div>
                                                            </div>
                                                            <div className="text-sm text-gray-700" />
                                                        </div>
                                                    )}
                                                </div>

                                                {preview.estimate_refund > 0 && (
                                                    <div>
                                                        <div className="flex justify-between text-green-700"><span>Reembolso estimado</span><strong>{formatearMoneda(preview.estimate_refund)}</strong></div>
                                                        <div className="flex justify-between text-gray-700"><span>Penalización aplicada</span><span>{formatearMoneda(preview.penalizacion ?? 0)}</span></div>
                                                        <div className="mt-3 p-3 bg-green-50 border border-green-200 text-green-800 rounded">
                                                            <div className="font-semibold">Al confirmar, se solicitará un reembolso de {formatearMoneda(preview.estimate_refund)} a la forma de pago original.</div>
                                                            <div className="text-xs text-gray-600 mt-1">El importe será devuelto al mismo método de pago y puede tardar varios días según la entidad bancaria. Se te notificará cuando se haya procesado.</div>
                                                        </div>
                                                    </div>
                                                )}

                                                {preview.estimate_charge > 0 && (<div className="flex justify-between text-red-700"><span>Estimado cargo adicional</span><strong>{formatearMoneda(preview.estimate_charge)}</strong></div>)}

                                                <div className="mt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-sm">Disponible para cambio</span>
                                                        {preview.available ? (<span className="text-sm text-green-700 font-semibold">Sí</span>) : (<span className="text-sm text-red-700 font-semibold">No</span>)}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">"Sí" significa que las habitaciones asignadas están libres en ese rango y se puede aplicar el cambio.</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-end gap-2">
                                        <button onClick={() => setShowDateModal(false)} className="btn btn-ghost">Cancelar</button>
                                        <button
                                            disabled={previewLoading || (preview && preview.available === false) || isProcessing}
                                            onClick={async () => { await confirmDateModal(); }}
                                            className="btn btn-primary"
                                        >
                                            {isProcessing ? 'Procesando…' : 'Aplicar cambios'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Payment modal for additional charges */}
                        {showPaymentModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                <div className="bg-white rounded-lg p-6 w-full max-w-md" style={paymentModalHeight ? { height: `${paymentModalHeight}px` } : {}}>
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold">Pagar importe adicional</h3>
                                        <button onClick={() => { setShowPaymentModal(false); setPendingApplyAfterPayment(false); }} className="p-1 rounded hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-gray-600"/></button>
                                    </div>
                                    <div className="mb-4">
                                        <p className="text-sm text-gray-700">Para aplicar el cambio de fechas es necesario abonar:</p>
                                        <div className="text-3xl font-bold text-burgundy mt-3">{formatearMoneda(paymentAmount)}</div>
                                    </div>
                                    <div className="mt-2">
                                        <FormularioPago monto={paymentAmount} onPagoExitoso={handlePagoExitoso} onError={handlePagoError} reservaData={{ reserva_id: reserva.id, es_edicion_pago: true }} aceptaTerminos={aceptaTerminosPago} />
                                        <div className="mt-3 text-xs text-gray-600">
                                            <label className="flex items-start gap-3 cursor-pointer">
                                                <input type="checkbox" id="acepta_terminos_pago" checked={aceptaTerminosPago} onChange={(e) => setAceptaTerminosPago(e.target.checked)} className="mr-2 mt-1" />
                                                <span>Acepto los <a href="/terminos" target="_blank" rel="noopener noreferrer" className="text-[#7a0202] underline">términos y condiciones</a> para procesar este pago.</span>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button onClick={() => { setShowPaymentModal(false); setPendingApplyAfterPayment(false); }} className="btn btn-ghost">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </GuestLayout>
    );
}
