import { CheckCircleIcon, DocumentArrowDownIcon, ArrowLeftIcon, PhoneIcon, EnvelopeIcon, MapPinIcon, ClockIcon, CreditCardIcon, ShieldCheckIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useState } from 'react';
import dayjs from 'dayjs';

export default function DetalleReserva({ reserva: initialReserva }) {
    const [reserva, setReserva] = useState(initialReserva);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [modalCheckIn, setModalCheckIn] = useState('');
    const [modalCheckOut, setModalCheckOut] = useState('');
    const [previewLoading, setPreviewLoading] = useState(false);
    const [preview, setPreview] = useState(null);
    const [previewError, setPreviewError] = useState(null);

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    };

    const applyDateChange = async (newCheckIn, newCheckOut) => {
        try {
            setIsProcessing(true);
            const axios = (await import('axios')).default;
            const payload = { check_in: newCheckIn.format('YYYY-MM-DD'), check_out: newCheckOut.format('YYYY-MM-DD') };
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
        } catch (err) {
            setPreview(null);
            setPreviewError(err?.response?.data?.message || err?.message || 'Error calculando vista previa');
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
            await fetchPreview(modalCheckIn, modalCheckOut);
            if (preview && preview.available === false) { showToast('No hay disponibilidad para las fechas seleccionadas.', 'error'); return; }

            await applyDateChange(newCheckIn, newCheckOut);
            setShowDateModal(false);
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Error al actualizar fechas';
            showToast(msg, 'error');
        } finally { setIsProcessing(false); }
    };



    const getStatusBadge = (status) => {
        const colors = { 'pendiente': 'badge-warning', 'confirmada': 'badge-success', 'completada': 'badge-success', 'cancelada': 'badge-error' };
        return colors[status] || 'badge-gray';
    };

    const getPagoBadge = (pago) => {
        const colors = { 'pendiente': 'badge-warning', 'pagado': 'badge-success', 'fallido': 'badge-error' };
        return colors[pago] || 'badge-gray';
    };

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
                            <div className="flex items-center gap-3">
                                <button onClick={() => window.location.href = `/reservas/${reserva.localizador}/pdf`} className="bg-transparent border-0 text-white px-3 py-2 rounded flex items-center gap-2 text-sm hover:opacity-80"><DocumentArrowDownIcon className="h-4 w-4" />PDF</button>
                                {reserva.pago === 'pagado' && (
                                    <button disabled={isProcessing} onClick={() => {
                                        if (isProcessing) return; if (!confirm('Solicitar reembolso para esta reserva?')) return; setIsProcessing(true);
                                        import('axios').then(({ default: axios }) => {
                                            axios.post(`/reservas/${reserva.id}/reembolsar`).then((res) => { showToast(res?.data?.message || 'Reembolso solicitado correctamente.', 'success'); return axios.get(`/reservas/buscar/${reserva.localizador}`); }).then((res2) => { if (res2?.data?.reserva) { setReserva(prev => ({ ...prev, ...res2.data.reserva })); } }).catch((err) => { const msg = err?.response?.data?.message || err?.message || 'Error solicitando reembolso.'; showToast(msg, 'error'); console.error('Reembolso error:', err); }).finally(() => setIsProcessing(false));
                                        });
                                    }} className={`bg-white text-[#7a0202] font-semibold px-3 py-2 rounded shadow-sm hover:opacity-90 text-sm ${isProcessing ? 'opacity-60 cursor-wait' : ''}`}>{isProcessing ? 'Procesando…' : 'Pedir reembolso'}</button>
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
                                <div className="bg-white rounded-lg p-6 w-full max-w-md">
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
                                            <div className="text-sm text-gray-800 space-y-2">
                                                <div className="flex justify-between"><span>Nueva estancia:</span><strong>{formatearMoneda(preview.nuevo_total)}</strong></div>
                                                <div className="flex justify-between"><span>Importe actual:</span><span>{formatearMoneda(preview.viejo_total)}</span></div>
                                                <div className="flex justify-between"><span>Noches actuales:</span><span>{preview.nights_old}</span></div>
                                                <div className="flex justify-between"><span>Noches nuevas:</span><span>{preview.nights_new}</span></div>
                                                {preview.estimate_refund > 0 && (<div className="flex justify-between text-green-700"><span>Estimado reembolso (prorrateado - 1n):</span><strong>{formatearMoneda(preview.estimate_refund)}</strong></div>)}
                                                {preview.estimate_charge > 0 && (<div className="flex justify-between text-red-700"><span>Estimado cargo adicional:</span><strong>{formatearMoneda(preview.estimate_charge)}</strong></div>)}
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
                                        <button disabled={isProcessing || (preview && preview.available === false)} onClick={confirmDateModal} className="btn btn-primary">{isProcessing ? 'Procesando…' : 'Confirmar'}</button>
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
