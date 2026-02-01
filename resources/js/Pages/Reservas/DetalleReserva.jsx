import {
    CheckCircleIcon, DocumentArrowDownIcon, PhoneIcon,
    MapPinIcon, ArrowDownOnSquareIcon, ArrowUpOnSquareIcon
} from '@heroicons/react/24/outline';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useState, useEffect, useMemo } from 'react';
import useReserva from '@/hooks/reservas/useReserva';
import usePreview from '@/hooks/usePreview';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import FormularioPago from '@/Components/pagos/FormularioPago';
import ErrorBoundary from '@/Components/ErrorBoundary';
import dayjs from 'dayjs';

export default function DetalleReserva({ reserva: initialReserva }) {
    // --- HOOKS Y ESTADOS PRINCIPALES ---
    const { reserva, setReserva, refresh, aplicarCambioFechas } = useReserva(initialReserva);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);

    // --- ESTADOS MODAL FECHAS ---
    const [showDateModal, setShowDateModal] = useState(false);
    const [modalCheckIn, setModalCheckIn] = useState('');
    const [modalCheckOut, setModalCheckOut] = useState('');

    // --- ESTADOS PAGO / REEMBOLSO ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [pendingApplyAfterPayment, setPendingApplyAfterPayment] = useState(false);
    const [aceptaTerminosPago, setAceptaTerminosPago] = useState(false);

    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('change_to_cheaper');
    const [refundNotes, setRefundNotes] = useState('');
    const [refundAmountInput, setRefundAmountInput] = useState(0);

    const { preview, loading: previewLoading, error: previewError, fetchPreview: fetchPreviewHook } = usePreview(reserva.localizador);

    useReservaEvents(reserva, { onRefresh: refresh });

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    };

    const refundableAmount = useMemo(() => {
        try {
            const pagos = reserva.pagos || [];
            let ultimoPago = pagos.slice().reverse().find(p => ['completado', 'procesando', 'pagado'].includes(p.estado));
            if (ultimoPago) {
                const pagosRefunds = reserva.reembolsos || [];
                let sumRefundsOnPago = pagosRefunds
                    .filter(r => !r.pago_id || r.pago_id === ultimoPago.id)
                    .reduce((s, r) => s + (Number(r.monto) || 0), 0);
                return Math.max(0, (Number(ultimoPago.monto) || 0) - sumRefundsOnPago);
            }
            return Math.max(0, (Number(reserva.precio_total) || 0) - (Number(reserva.reembolsos_total) || 0));
        } catch (e) { return 0; }
    }, [reserva]);

    const openDateModal = () => {
        setModalCheckIn(dayjs(reserva.check_in).format('YYYY-MM-DD'));
        setModalCheckOut(dayjs(reserva.check_out).format('YYYY-MM-DD'));
        setShowDateModal(true);
        fetchPreviewHook(reserva.check_in, reserva.check_out);
    };

    const confirmDateModal = async () => {
        try {
            setIsProcessing(true);
            const latestPreview = await fetchPreviewHook(modalCheckIn, modalCheckOut);
            if (latestPreview?.available === false) {
                showToast('Sin disponibilidad de activos', 'error');
                return;
            }
            if (latestPreview?.estimate_charge > 0) {
                setPaymentAmount(latestPreview.estimate_charge);
                setPendingApplyAfterPayment(true);
                // Pre-aceptar términos para facilitar el flujo (el usuario sigue pudiendo desmarcar)
                setAceptaTerminosPago(true);
                // Cerrar el modal de fechas para evitar solapamiento visual
                setShowDateModal(false);
                setShowPaymentModal(true);
                return;
            }
            await aplicarCambioFechas(modalCheckIn, modalCheckOut);
            showToast('Reembolso solicitado', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            showToast('Error en la actualizacion', 'error');
        } finally { setIsProcessing(false); }
    };

    const handlePagoExitoso = async (paymentResult) => {
        setShowPaymentModal(false);
        if (!pendingApplyAfterPayment) return;
        try {
            setIsProcessing(true);
            await aplicarCambioFechas(modalCheckIn, modalCheckOut, paymentResult?.pago_id);
            showToast('Pago y actualizacion de reserva completados', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            showToast('Error al aplicar cambios tras el pago, consulte a recepción', 'error');
        } finally {
            setPendingApplyAfterPayment(false);
            setIsProcessing(false);
        }
    };

    const handleRefundSubmit = async () => {
        setIsProcessing(true);
        try {
            const api = await import('@/api/reservas');
            const res = await api.crearSolicitudReembolso(reserva.localizador, {
                monto: refundAmountInput || refundableAmount,
                reason_code: refundReason,
                notes: refundNotes
            });
            if (res.success) {
                showToast('Solicitud enviada correctamente', 'success');
                setShowRefundModal(false);
                refresh();
            }
        } catch (e) { showToast('Error al procesar solicitud', 'error'); }
        finally { setIsProcessing(false); }
    };

    const isCancelled = String(reserva.status || '').toLowerCase().includes('cancelado');
    const isCheckedIn = String(reserva.status || '').toLowerCase() === 'en_estancia';

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris pb-24">
                {/* HEADER SECCIÓN */}
                <header className="bg-gris border-b border-gray-200 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                                    Reserva <span className="text-gray-400 font-mono">{reserva.localizador}</span>
                                </h1>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                    {reserva.status}
                                </span>
                            </div>
                            <p className="text-gray-500 font-medium text-sm mt-1">
                                {reserva.cliente?.nombre} • {formatearFecha(reserva.check_in)} al {formatearFecha(reserva.check_out)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isCancelled && (
                                <button onClick={openDateModal} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm">
                                    Modificar Fechas
                                </button>
                            )}
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* COLUMNA IZQUIERDA: DETALLES */}
                        <div className="lg:col-span-8 space-y-6 bg-gris">

                            {/* Card: Activos */}
                            <section className="bg-gris rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Contrato y Activos</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {reserva.habitaciones.map((hab, idx) => (
                                        <div key={hab.id || idx} className="p-6 flex justify-between items-center hover:bg-gray-50 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 bg-gray-900 rounded-xl flex items-center justify-center text-white font-black text-xs uppercase">
                                                    {hab.tipo?.charAt(0) || 'H'}
                                                </div>
                                                <div>
                                                    <span className="block font-black text-gray-900 text-lg uppercase leading-tight">
                                                        {hab.numero ? `Habitación ${hab.numero}` : hab.tipo}
                                                    </span>
                                                    <span className="text-[10px] font-mono text-gray-400 uppercase tracking-tighter">
                                                        {hab.numero ? hab.tipo : `ID: ${reserva.localizador}-${idx+1}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Card: Ubicación y Protocolo */}
                            <section className="bg-gris rounded-2xl shadow-sm border border-gray-200 p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-400">Información de Destino</h4>
                                    <div className="flex gap-3">
                                        <MapPinIcon className="h-5 w-5 text-red-900 shrink-0" />
                                        <p className="text-sm font-bold text-gray-700">Hotel Gludio, Avenida del Ejército, Sanlúcar de Barrameda</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <PhoneIcon className="h-5 w-5 text-red-900 shrink-0" />
                                        <p className="text-sm font-bold text-gray-700">+34 91 234 5678</p>
                                    </div>
                                </div>
                                <div className="bg-gris rounded-2xl p-6">
                                    <h4 className="font-black text-[10px] uppercase tracking-widest text-black mb-4">Servicios Incluidos</h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" /> Wi-Fi Ultra-Rápido
                                        </li>
                                        <li className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" /> Insonorización Premium
                                        </li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        {/* COLUMNA DERECHA: SIDEBAR "CUADRADO ROJO" */}
                        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                            <div className="bg-[#7a0202] rounded-3xl p-8 text-white shadow-xl shadow-red-100">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total de Reserva</h4>
                                <div className="text-4xl font-black mb-8 leading-none">{formatearMoneda(reserva.precio_total)}</div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                                        <span className="opacity-70 font-medium uppercase text-[10px] tracking-widest">Estado del pago</span>
                                        <span className="font-bold uppercase tracking-widest text-[10px] bg-red-900 px-2 py-1 rounded">{reserva.pago}</span>
                                    </div>
                                    {reserva.reembolsos_total > 0 && (
                                        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 text-red-200">
                                            <span className="font-medium uppercase text-[10px] tracking-widest">Devoluciones</span>
                                            <span className="font-black">-{formatearMoneda(reserva.reembolsos_total)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {!isCancelled && reserva.status === 'pendiente' && (
                                        <button
                                            onClick={() => window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkin`}
                                            className="w-full py-4 bg-white text-[#7a0202] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition shadow-lg"
                                        >
                                            <ArrowDownOnSquareIcon className="h-4 w-4 inline mr-2" />
                                            Ejecutar Check-In
                                        </button>
                                    )}

                                    {!isCancelled && reserva.status !== 'finalizado' && (
                                        <button
                                            onClick={() => window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkout`}
                                            className="w-full py-4 bg-black/30 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/40 transition border border-white/10"
                                        >
                                            <ArrowUpOnSquareIcon className="h-4 w-4 inline mr-2" />
                                            Ejecutar Check-Out
                                        </button>
                                    )}

                                    <button
                                        onClick={() => window.location.href = `/reservas/${reserva.localizador}/pdf`}
                                        className="w-full py-4 bg-black/10 text-white/80 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-black/20 transition border border-white/5"
                                    >
                                        <DocumentArrowDownIcon className="h-4 w-4 inline mr-2" />
                                        Descargar Comprobante
                                    </button>
                                </div>
                            </div>

                            {!isCancelled && reserva.pago === 'pagado' && refundableAmount > 0 && (
                                <button
                                    onClick={() => { setRefundAmountInput(refundableAmount); setShowRefundModal(true); }}
                                    className="w-full py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold text-xs uppercase tracking-widest hover:border-red-200 hover:text-red-600 transition"
                                >
                                    Solicitar Reembolso
                                </button>
                            )}
                        </aside>
                    </div>
                </main>

                {/* --- MODAL: MODIFICAR FECHAS --- */}
                {showDateModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Ajuste de Estancia</h2>
                                <button onClick={() => setShowDateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Entrada</label>
                                        <input
                                            type="date"
                                            value={modalCheckIn}
                                            disabled={isCheckedIn}
                                            onChange={(e) => { setModalCheckIn(e.target.value); fetchPreviewHook(e.target.value, modalCheckOut); }}
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl font-bold focus:ring-[#7a0202] focus:border-[#7a0202]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Salida</label>
                                        <input
                                            type="date"
                                            value={modalCheckOut}
                                            onChange={(e) => { setModalCheckOut(e.target.value); fetchPreviewHook(modalCheckIn, e.target.value); }}
                                            className="w-full bg-gray-50 border-gray-200 rounded-xl font-bold focus:ring-[#7a0202] focus:border-[#7a0202]"
                                        />
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                    {previewLoading ? (
                                        <div className="text-center py-4 text-gray-400 font-bold text-xs uppercase animate-pulse">Calculando impacto...</div>
                                    ) : preview && (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Diferencia</span>
                                                <span className={`text-2xl font-black ${preview.estimate_charge > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {preview.estimate_charge > 0 ? '+' : ''}{formatearMoneda(preview.estimate_charge || (preview.nuevo_total - preview.viejo_total))}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] font-black text-gray-400 uppercase mb-1">Disponibilidad</span>
                                                <span className={`text-xs font-black uppercase ${preview.available ? 'text-green-600' : 'text-red-600'}`}>
                                                    {preview.available ? 'Activo Libre' : 'Sin Cupo'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-3">
                                <button onClick={() => setShowDateModal(false)} className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-500 uppercase text-xs tracking-widest">Cancelar</button>
                                <button
                                    disabled={!preview?.available || isProcessing}
                                    onClick={confirmDateModal}
                                    className="flex-1 py-4 bg-[#7a0202] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg disabled:opacity-50"
                                >
                                    {isProcessing ? 'Sincronizando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODAL: PAGO ADICIONAL --- */}
                {showPaymentModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[120] p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in duration-200">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 uppercase leading-tight">Pago Adicional</h2>
                                    <p className="text-sm text-gray-400 mt-1 font-medium">Se requiere saldar la diferencia para aplicar cambios.</p>
                                </div>
                                <button onClick={() => setShowPaymentModal(false)} className="text-gray-300 hover:text-gray-500 font-bold">✕</button>
                            </div>

                            <div className="bg-gray-50 rounded-2xl p-6 text-center mb-8 border border-gray-100">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Total a pagar ahora</span>
                                <div className="text-4xl font-black text-[#7a0202] mt-1">{formatearMoneda(paymentAmount)}</div>
                            </div>

                            <ErrorBoundary>
                                <FormularioPago
                                    monto={paymentAmount}
                                    onPagoExitoso={handlePagoExitoso}
                                    onError={(e) => showToast(e?.message, 'error')}
                                    reservaData={{ reserva_id: reserva.id, es_edicion_pago: true, check_in: modalCheckIn || reserva.check_in, check_out: modalCheckOut || reserva.check_out, habitaciones: reserva.habitaciones }}
                                    aceptaTerminos={aceptaTerminosPago}
                                    mostrarAceptacion={true}
                                    onAceptaChange={setAceptaTerminosPago}
                                />
                            </ErrorBoundary>

                            <button onClick={() => setShowPaymentModal(false)} className="w-full mt-6 py-4 text-gray-400 font-bold uppercase text-[10px] tracking-widest hover:text-gray-600 transition">Cancelar operación</button>
                        </div>
                    </div>
                )}

                {/* --- TOAST --- */}
                {toast && (
                    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] px-6 py-4 rounded-2xl shadow-2xl bg-gray-900 text-white flex items-center gap-4 animate-in slide-in-from-bottom-10 duration-500">
                        <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-red-400' : 'bg-green-400'} animate-pulse`} />
                        <span className="text-sm font-black uppercase tracking-widest">{toast.message}</span>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
