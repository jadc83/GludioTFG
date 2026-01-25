import { CheckCircleIcon, DocumentArrowDownIcon, ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon, CreditCardIcon, ShieldCheckIcon, PencilIcon, XMarkIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline';
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
        // Map status -> badge class
        const colors = { 'pendiente': 'badge-info', 'confirmada': 'badge-success', 'completada': 'badge-success', 'cancelada': 'badge-error' };
        return colors[status] || 'badge-gray';
    };

    const displayStatus = (status) => {
        if (!status) return '';
        const s = String(status).toLowerCase();
        const map = {
            'pendiente': 'Por confirmar',
            'confirmada': 'Confirmada',
            'completada': 'Completada',
            'cancelada': 'Cancelada'
        };
        return map[s] || (s.charAt(0).toUpperCase() + s.slice(1));
    };

    const StatusIcon = ({ status, className = 'h-6 w-6' }) => {
        const s = String(status || '').toLowerCase();
        if (s === 'pendiente') return <ClockIcon className={`${className} text-blue-600`} />;
        if (s === 'cancelada') return <XMarkIcon className={`${className} text-[#7a0202]`} />;
        return <CheckCircleIcon className={`${className} text-green-500`} />;
    };

    const getPagoBadge = (reservaPago, reservaObj = null) => {
        // reservaPago: string value stored in reserva.pago
        // reservaObj: optional reserva object to detect reembolsos parciales
        const reembolsos = reservaObj?.reembolsos_total || 0;
        if (reembolsos > 0 && reservaObj?.precio_total && reembolsos < reservaObj.precio_total) return 'badge-warning';
        const colors = { 'pendiente': 'badge-warning', 'pagado': 'badge-success', 'fallido': 'badge-error' };
        return colors[reservaPago] || 'badge-gray';
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



    const isCancelled = String(reserva.status || '').toLowerCase().includes('cancel');

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris pt-6 pb-6">
                <div className="mx-auto max-w-7xl px-4">
                    <div className="space-y-3">

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                            {/* Left: Main details */}
                            <div className="md:col-span-3 space-y-4">
                                <div className="flex items-start justify-between flex-wrap">
                                    <div className="flex-1 min-w-0">
                                        <h1 className="text-2xl font-bold text-gray-900 whitespace-nowrap">Reserva <span className="font-mono font-normal text-base text-gray-600">{reserva.localizador}</span><span className={`ml-3 text-sm font-semibold ${isCancelled ? 'text-[#7a0202] hidden sm:inline-block' : (String(reserva.status || '').toLowerCase() === 'pendiente' ? 'text-blue-600' : 'text-green-700')}`}>{displayStatus(reserva.status)}</span></h1>
                                        <div className="mt-2 flex items-center gap-3 text-sm text-gray-600">
                                            <div className="flex items-center gap-2"><MapPinIcon className="h-4 w-4 text-[#7a0202]" /><span>{reserva.cliente?.nombre}</span></div>
                                            <div className="flex items-center gap-2">
                                                <ClockIcon className="h-4 w-4 text-gray-400" />
                                                <span>{formatearFecha(reserva.check_in)} — {formatearFecha(reserva.check_out)}</span>
                                                {!isCancelled && (
                                                    <button onClick={openDateModal} title="Editar fechas" aria-label="Editar fechas" className="ml-3 inline-flex items-center gap-2 bg-[#7a0202] hover:bg-[#6b0101] text-white font-semibold py-1.5 px-3 rounded-md text-sm shadow-sm transition"><PencilIcon className="h-4 w-4" />Editar fechas</button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {String(reserva.status || '').toLowerCase().includes('cancel') ? (
                                            <div role="status" aria-label="Reserva cancelada" className="inline-block px-3 py-1 text-sm font-bold text-[#7a0202] border-2 border-[#7a0202] rounded-md uppercase tracking-widest transform -rotate-6 shadow-sm">CANCELADA</div>
                                        ) : null}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {reserva.habitaciones.map((hab, idx) => (
                                        <div key={idx} className="p-4 rounded-lg border border-gray-100 shadow-sm hover:shadow-md transition flex justify-between items-center">
                                            <div>
                                                <div className="text-sm font-semibold">{(hab.tipo ? (hab.tipo.charAt(0).toUpperCase() + hab.tipo.slice(1)) : 'Habitación')}</div>
                                                <div className="text-xs text-gray-500">{formatearMoneda(hab.precio)} total</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-[#7a0202]">{formatearMoneda(hab.precio)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="rounded-lg bg-white p-4 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-800 mb-2">Información del hotel</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700">
                                        <div className="flex items-start gap-2"><MapPinIcon className="h-4 w-4 text-[#7a0202] mt-0.5" /><div><div className="font-semibold">Dirección</div><div>Calle Principal 123</div></div></div>
                                        <div className="flex items-start gap-2"><PhoneIcon className="h-4 w-4 text-[#7a0202] mt-0.5" /><div><div className="font-semibold">Teléfono</div><div>+34 91 234 5678</div></div></div>
                                        <div className="flex items-start gap-2"><EnvelopeIcon className="h-4 w-4 text-[#7a0202] mt-0.5" /><div><div className="font-semibold">Email</div><div>info@hotel.com</div></div></div>
                                        <div className="flex items-start gap-2"><ShieldCheckIcon className="h-4 w-4 text-[#7a0202] mt-0.5" /><div><div className="font-semibold">Servicios</div><div>WiFi, Desayuno, Aparcamiento</div></div></div>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Summary card */}
                            <aside className="w-full mt-6 md:mt-0 md:col-span-1 md:sticky md:top-24 md:overflow-visible md:z-10">
                                <div className="rounded-lg bg-white shadow-md p-5">
                                    <div className="text-xs font-semibold text-gray-500">TOTAL</div>
                                    <div className="mt-2 text-3xl font-bold text-gray-900">{formatearMoneda(reserva.precio_total)}</div>

                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-xs text-gray-600">
                                            <div>Estado pago</div>
                                            <div className={`font-semibold ${reserva.reembolsos_total > 0 && reserva.reembolsos_total < reserva.precio_total ? 'bg-[#7a0202] text-white px-2 py-0.5 rounded' : ''}`}>{(reserva.reembolsos_total > 0 && reserva.reembolsos_total < reserva.precio_total) ? 'Parcialmente reembolsado' : (reserva.pago ? reserva.pago.charAt(0).toUpperCase() + reserva.pago.slice(1) : '')}</div>
                                        </div>



                                        {reserva.reembolsos && reserva.reembolsos.length > 0 && (
                                            <div className="mt-4 text-sm text-gray-700">
                                                <div className="font-semibold">Últimos reembolsos</div>
                                                <div className="mt-2 space-y-2">
                                                    {reserva.reembolsos.slice(-3).map(r => (
                                                        <div key={r.id} className="flex items-center justify-between text-sm">
                                                            <div className="text-gray-600">{r.created_at}</div>
                                                            <div className="font-semibold text-green-600">{formatearMoneda(r.monto)}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 flex flex-col gap-2">
                                            <button onClick={() => window.location.href = `/reservas/${reserva.localizador}/pdf`} className="w-full inline-flex items-center justify-center gap-2 bg-transparent border border-gray-200 text-gray-700 px-3 py-2 rounded hover:bg-gray-50"> <DocumentArrowDownIcon className="h-4 w-4"/> PDF</button>
                                            {!isCancelled && reserva.pago === 'pagado' && refundableAmount > 0 && (
                                                <button disabled={isProcessing} onClick={() => {
                                                    if (isProcessing) return;
                                                    if (!confirm('¿Cancelar reserva y solicitar el reembolso del importe disponible?')) return;
                                                    setIsProcessing(true);
                                                    import('axios').then(({ default: axios }) => {
                                                        axios.post(`/reservas/${reserva.id}/reembolsar`, { monto: refundableAmount, cancelar: true }).then((res) => { showToast(res?.data?.message || 'Reembolso solicitado correctamente.', 'success'); return axios.get(`/reservas/buscar/${reserva.localizador}`); }).then((res2) => { if (res2?.data?.reserva) { setReserva(prev => ({ ...prev, ...res2.data.reserva })); } }).catch((err) => { const msg = err?.response?.data?.message || err?.message || 'Error solicitando reembolso.'; showToast(msg, 'error'); console.error('Reembolso error:', err); }).finally(() => setIsProcessing(false));
                                                    });
                                                }} className="w-full bg-[#7a0202] text-white px-3 py-2 rounded font-semibold">Cancelar reserva</button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-1 gap-2">
                                    {!isCancelled && String(reserva.status || '').toLowerCase() === 'pendiente' && (
                                        <button onClick={() => { window.location.href = route('scan-qr') + '?localizador=' + encodeURIComponent(reserva.localizador) + '&action=checkin'; }} className="w-full mb-0 bg-[#7a0202] hover:bg-[#6b0101] text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition" aria-label="Hacer check-in"><ArrowDownOnSquareIcon className="h-5 w-5" />Hacer check-in</button>
                                    )}
                                    {!isCancelled && String(reserva.status || '').toLowerCase() !== 'checked_out' && (
                                        <button onClick={() => { window.location.href = route('scan-qr') + '?localizador=' + encodeURIComponent(reserva.localizador) + '&action=checkout'; }} className="w-full mb-0 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg text-lg flex items-center justify-center gap-2 transition" aria-label="Hacer check-out"><ArrowUpOnSquareIcon className="h-5 w-5" />Hacer check-out</button>
                                    )}
                                </div>
                            </aside>
                        </div>

                        {/* Middle sections removed for bisecting */}

                        {/* Edición via modal eliminada; botones de checkin/checkout central eliminados porque ya están en el panel lateral (sticky). */}



                        <Link href="/" className="inline-flex items-center gap-1 text-[#7a0202] hover:text-[#6b0101] font-semibold text-sm mt-3"><ArrowLeftIcon className="h-4 w-4" />Volver</Link>

                        {toast && (<div className={`fixed right-4 bottom-6 z-50 max-w-xs px-4 py-3 rounded shadow-lg text-sm text-white bg-[#7a0202]`}>{toast.message}</div>)}

                        {/* Mobile quick actions */}
                        {!isCancelled && (
                        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-50 flex gap-3">
                            {String(reserva.status || '').toLowerCase() === 'pendiente' && (
                                <button onClick={() => { window.location.href = route('scan-qr') + '?localizador=' + encodeURIComponent(reserva.localizador) + '&action=checkin'; }} className="flex-1 bg-[#7a0202] hover:bg-[#6b0101] text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2" aria-label="Hacer check-in"><ArrowDownOnSquareIcon className="h-5 w-5" />Hacer check-in</button>
                            )}

                            {/* Edit dates button for mobile */}
                            <button onClick={openDateModal} className="w-28 bg-[#7a0202] hover:bg-[#6b0101] text-white font-bold py-3 rounded-md text-lg flex items-center justify-center gap-2" aria-label="Editar fechas"><PencilIcon className="h-5 w-5" />Editar</button>

                            {String(reserva.status || '').toLowerCase() !== 'checked_out' && (
                                <button onClick={() => { window.location.href = route('scan-qr') + '?localizador=' + encodeURIComponent(reserva.localizador) + '&action=checkout'; }} className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 rounded-lg text-lg flex items-center justify-center gap-2" aria-label="Hacer check-out"><ArrowUpOnSquareIcon className="h-5 w-5" />Hacer check-out</button>
                            )}
                        </div>
                        )}

                        {/* Date modal */}
                        {showDateModal && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                                <div ref={dateModalRef} className="bg-gris text-black rounded-lg p-6 w-full max-w-md shadow-md">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold">Modificar fechas</h3>
                                        <button onClick={() => setShowDateModal(false)} className="p-1 rounded hover:bg-gray-100"><XMarkIcon className="h-5 w-5 text-black"/></button>
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
                                                <div className="flex">
                                                    <button onClick={() => setShowDateModal(false)} className="btn btn-ghost">Cerrar</button>
                                                    <button
                                                        disabled={previewLoading || (preview && preview.available === false) || isProcessing}
                                                        onClick={async () => { await confirmDateModal(); }}
                                                        className="ml-2 bg-[#7a0202] text-white px-4 py-2 rounded font-semibold shadow-sm hover:opacity-90 disabled:opacity-60"
                                                    >
                                                        {isProcessing ? 'Procesando…' : 'Aplicar cambios'}
                                                    </button>
                                                </div>
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
