import {
    CheckCircleIcon, DocumentArrowDownIcon, ArrowLeftIcon, PhoneIcon, EnvelopeIcon,
    MapPinIcon, ClockIcon, ShieldCheckIcon, PencilIcon, XMarkIcon,
    ArrowDownOnSquareIcon, ArrowUpOnSquareIcon, CurrencyEuroIcon, UserIcon,
    ExclamationTriangleIcon, CalendarIcon
} from '@heroicons/react/24/outline';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { Link } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import { useState, useEffect, useMemo } from 'react';
import useReserva from '@/hooks/useReserva';
import usePreview from '@/hooks/usePreview';
import useReservaEvents from '@/hooks/useReservaEvents';
import FormularioPago from '@/Components/pagos/FormularioPago';
import dayjs from 'dayjs';

export default function DetalleReserva({ reserva: initialReserva }) {
    // --- HOOKS Y ESTADOS PRINCIPALES ---
    const { reserva, setReserva, refresh, aplicarCambioFechas } = useReserva(initialReserva);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);

    // --- ESTADOS MODAL FECHAS (UNIFICADO) ---
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

    // Suscripción a eventos en tiempo real
    useReservaEvents(reserva, { onRefresh: refresh });

    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    };

    // --- LÓGICA DE REEMBOLSO (Cálculo sobre último pago o total) ---
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

    // --- MANEJADORES DE OPERACIÓN ---
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
                setShowPaymentModal(true);
                return;
            }

            await aplicarCambioFechas(modalCheckIn, modalCheckOut);
            showToast('Activo sincronizado correctamente', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            showToast('Error en la operación de ajuste', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePagoExitoso = async (paymentResult) => {
        setShowPaymentModal(false);
        if (!pendingApplyAfterPayment) return;
        try {
            setIsProcessing(true);
            const pagoId = paymentResult?.pago_id || null;
            await aplicarCambioFechas(modalCheckIn, modalCheckOut, pagoId);
            showToast('Liquidación y cambio completados', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            showToast('Error al aplicar cambios tras liquidación', 'error');
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
                showToast('Solicitud de retroceso enviada', 'success');
                setShowRefundModal(false);
                refresh();
            }
        } catch (e) {
            showToast('Error al procesar solicitud de reembolso', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const isCancelled = String(reserva.status || '').toLowerCase().includes('cancel');
    const isCheckedIn = String(reserva.status || '').toLowerCase() === 'checked_in';

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris pt-4 md:pt-8 pb-20">
                <div className="mx-auto max-w-7xl px-4 md:px-6">

                    {/* --- HEADER TÁCTICO --- */}
                    <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div className="space-y-3">
                            <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-900 text-[10px] font-black uppercase tracking-[0.2em] mb-2 transition-colors">
                                <ArrowLeftIcon className="h-3 w-3" /> Volver a reservas
                            </Link>
                            <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                                Reserva <span className="text-red-900">#{reserva.localizador} </span>
                            </h1>

                        </div>
                        <div className="justify-between items-right">
                            <span className="text-black tracking-widest"></span>
                                <span className={isCancelled ? 'text-red-700' : 'text-green-700'}>
                                    {reserva.status}
                                </span>
                        </div>


                    </header>

                    {/* --- GRID DE DETALLES --- */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                        <div className="lg:col-span-8 space-y-8">

                            {/* ACTIVOS VINCULADOS */}
                            <section className="bg-white rounded-[2.5rem]  overflow-hidden shadow-sm">
                                <div className="px-8 py-5 -b  bg-gray-50/20 flex items-center justify-between font-black text-[10px] uppercase tracking-[0.3em]">
                                    Detalles
                                </div>
                                <div className="divide-y divide-gray-50">
                                    <div className="flex flex-wrap gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                        <p className="bg-white px-20 py-1.5 rounded-lg justify-between shadow-sm flex items-center gap-2">
                                            <UserIcon className="h-3 w-3 text-[#7a0202]" /> {reserva.cliente?.nombre}
                                        </p>
                                        <p className="bg-white px-3 py-1.5 rounded-lg shadow-sm flex items-center gap-2">
                                            <CalendarIcon className="h-3 w-3 text-[#7a0202]" /> {formatearFecha(reserva.check_in)} — {formatearFecha(reserva.check_out)}
                                        </p>
                                    </div>

                                    {reserva.habitaciones.map((hab, idx) => (
                                        <div key={idx} className="p-6 md:p-10 flex justify-between items-center group hover:bg-gray-50/30 transition-colors">
                                            <div className="flex items-center gap-4 md:gap-8">
                                                <div className="h-14 w-14 bg-gray-900 rounded-3xl flex items-center justify-center text-white font-black text-xs uppercase shadow-lg shadow-gray-200">
                                                    {hab.tipo?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">{hab.tipo}</h4>
                                                </div>

                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-gray-900 tracking-tighter">{formatearMoneda(hab.precio)}</p>
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest block mt-1">Precio final</span>
                                            </div>

                                            <div className="space-y-4 mb-10 pt-8 -t  text-[10px] font-black uppercase tracking-[0.2em]">

                                                <div className="flex justify-between items-center"><span className="text-black tracking-widest"></span><span className="text-gray-900">{reserva.pago}</span></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* UBICACIÓN Y PROTOCOLO */}
                            <section className="bg-gris rounded-[2.5rem]  p-8 md:p-10 grid grid-cols-1 md:grid-cols-2 gap-10 shadow-sm">
                                <div className="space-y-6">
                                    <div className="flex gap-4">
                                        <MapPinIcon className="h-6 w-6 text-[#7a0202] shrink-0" />
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight leading-relaxed">Hotel Gludio, Avenida del ejercito, Sanlúcar de Barrameda</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <PhoneIcon className="h-6 w-6 text-[#7a0202] shrink-0" />
                                        <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">+34 91 234 5678</p>
                                    </div>
                                </div>
                                <div className="bg-gris rounded-[2.5rem] p-8 flex flex-col justify-center text-white relative overflow-hidden group">
                                    <ul className="text-[10px] font-black uppercase tracking-widest space-y-3">
                                        <li className="flex items-center gap-3 text-green-900"><CheckCircleIcon className="h-4 w-4" /> Conexion Wi-Fi ultra-rapido</li>
                                        <li className="flex items-center gap-3 text-green-400"><CheckCircleIcon className="h-4 w-4" /> Habitaciones insonorizadas</li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        {/* --- SIDEBAR FINANCIERO / ACCIONES --- */}
                        <aside className="lg:col-span-4 space-y-6">
                            <div className="bg-gris rounded-lg p-6  shadow-2xl shadow-gray-200/40 sticky top-24">

                                <div className="flex flex-col gap-4">
                                    {/* ACCIONES DE ESTADO */}
                                    {!isCancelled && reserva.status === 'pendiente' && (
                                        <button onClick={() => window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkin`} className="w-full py-5 bg-[#7a0202] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl shadow-red-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                                            <ArrowDownOnSquareIcon className="h-5 w-5" /> Ejecutar Check-In
                                        </button>
                                    )}

                                    {!isCancelled && String(reserva.status || '').toLowerCase() !== 'checked_out' && (
                                        <button onClick={() => window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkout`} className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-95">
                                            <ArrowUpOnSquareIcon className="h-5 w-5" /> Ejecutar Check-Out
                                        </button>
                                    )}

                                    {!isCancelled && (
                                        <button onClick={openDateModal} className="w-full py-4 -2 -gray-900 text-gray-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
                                            Cambio de fechas
                                        </button>
                                    )}

                                    <button onClick={() => window.location.href = `/reservas/${reserva.localizador}/pdf`} className="w-full py-4 -2 -gray-900 text-gray-900 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-colors">
                                        <DocumentArrowDownIcon className="h-5 w-5" /> Descargar factura
                                    </button>


                                    {/* GESTIÓN DE REEMBOLSO */}
                                    {!isCancelled && reserva.pago === 'pagado' && refundableAmount > 0 && !isCheckedIn && (
                                        <button onClick={() => { setRefundAmountInput(refundableAmount); setShowRefundModal(true); }} className="w-full py-4 text-black font-black uppercase tracking-widest text-[9px] hover:text-[#7a0202] transition-colors pt-6 -t  mt-4">
                                            Solicitar reembolso
                                        </button>
                                    )}
                                </div>
                            </div>
                        </aside>
                    </div>
                </div>

                {/* --- MODAL DE FECHAS: DISEÑO UNIFICADO TÁCTICO --- */}
                {showDateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/80 backdrop-blur-md">
                        <div className="bg-gris rounded-[3rem] shadow-2xl max-w-4xl w-full overflow-hidden animate-in zoom-in duration-300  flex flex-col md:flex-row">

                            {/* Lateral de Selección */}
                            <div className="md:w-5/12 p-8 md:p-12 space-y-10">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none mb-2">Cambiar fechas</h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-black tracking-widest ml-2 flex items-center gap-2">
                                            <CalendarIcon className="h-3 w-3" /> Entrada (Check-In)
                                        </label>
                                        <input type="date" value={modalCheckIn} disabled={isCheckedIn} onChange={(e) => { setModalCheckIn(e.target.value); fetchPreviewHook(e.target.value, modalCheckOut); }} className="w-full bg-white -0 rounded-2xl font-black text-sm p-5 focus:ring-2 focus:ring-[#7a0202] transition-shadow disabled:opacity-50" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase text-black tracking-widest ml-2 flex items-center gap-2">
                                            <CalendarIcon className="h-3 w-3" /> Salida (Check-Out)
                                        </label>
                                        <input type="date" value={modalCheckOut} onChange={(e) => { setModalCheckOut(e.target.value); fetchPreviewHook(modalCheckIn, e.target.value); }} className="w-full bg-white -0 rounded-2xl font-black text-sm p-5 focus:ring-2 focus:ring-[#7a0202] transition-shadow" />
                                    </div>
                                </div>

                                <div className="pt-6">
                                    <button onClick={() => setShowDateModal(false)} className="text-[10px] font-black uppercase tracking-[0.3em] text-black-400 hover:text-gray-900 transition-colors">
                                        ✕ Cancelar
                                    </button>
                                </div>
                            </div>

                            {/* Panel de Impacto Inmediato */}
                            <div className="md:w-7/12 bg-burgundy p-8 md:p-12 text-white flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-center mb-10">
                                        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest -2 ${preview?.available ? '-green-500/30 text-red-900' : '-red-500/30 text-red-500'}`}>
                                            {preview?.available ? 'Cambio disponible' : 'Cambio no disponible'}
                                        </div>
                                    </div>

                                    {previewLoading ? (
                                        <div className="py-10 space-y-6 animate-pulse">
                                            <div className="h-2 w-1/2 bg-gray-800 rounded" />
                                            <div className="h-10 w-3/4 bg-gray-800 rounded" />
                                        </div>
                                    ) : previewError ? (
                                        <div className="p-6 rounded-2xl bg-red-500/10  -red-500/20 text-red-400 text-sm font-bold flex items-center gap-3 uppercase tracking-tighter">
                                            <ExclamationTriangleIcon className="h-6 w-6 shrink-0" /> {previewError}
                                        </div>
                                    ) : preview && (
                                        <div className="space-y-8 animate-in fade-in duration-500">
                                            <div>
                                                <div className="flex items-baseline gap-2">
                                                    <span className={`text-6xl font-black tracking-tighter ${preview.estimate_charge > 0 ? 'text-[#7a0202]' : 'text-red-900'}`}>
                                                        {preview.estimate_charge > 0 ? '+' : ''}{formatearMoneda(preview.estimate_charge || (preview.nuevo_total - preview.viejo_total))}
                                                    </span>
                                                    {preview.estimate_refund > 0 && <span className="text-xs font-bold text-green-400 uppercase tracking-widest animate-pulse">(Reembolso auto)</span>}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6 pt-8 -t -white/5">
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-black">{preview.nights_new} Noches › {formatearMoneda(preview.nuevo_total)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    disabled={!preview?.available || isProcessing || previewLoading}
                                    onClick={confirmDateModal}
                                    className="w-full py-6 bg-red-900 text-white rounded-lg font-black uppercase text-[12px] tracking-[0.3em] shadow-2xl hover:bg-[#7a0202] hover:text-white transition-all disabled:opacity-20 active:scale-[0.98]"
                                >
                                    {isProcessing ? 'Procesando los cambios...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODAL PAGO: LIQUIDACIÓN ADICIONAL --- */}
                {showPaymentModal && (
                    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-gray-900/95 backdrop-blur-xl">
                        <div className="bg-gris rounded-[3rem] shadow-2xl max-w-md w-full p-8 md:p-12 animate-in zoom-in duration-300 ">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Ajuste de Saldo</h2>
                                    <p className="text-[10px] text-gray-400 mt-2 font-bold uppercase tracking-widest">Liquidación inmediata requerida</p>
                                </div>
                                <button onClick={() => { setShowPaymentModal(false); setPendingApplyAfterPayment(false); }} className="p-1 hover:bg-gris rounded-lg transition-colors"><XMarkIcon className="h-6 w-6 text-gray-400" /></button>
                            </div>

                            <div className="bg-gris rounded-[2rem] p-8 text-center mb-10 ">
                                <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 block">Carga Financiera Extra</span>
                                <div className="text-5xl font-black text-[#7a0202] tracking-tighter">{formatearMoneda(paymentAmount)}</div>
                            </div>

                            <FormularioPago
                                monto={paymentAmount}
                                onPagoExitoso={handlePagoExitoso}
                                onError={(e) => showToast(e?.message, 'error')}
                                reservaData={{ reserva_id: reserva.id, es_edicion_pago: true }}
                                aceptaTerminos={aceptaTerminosPago}
                                mostrarAceptacion={true}
                                onAceptaChange={setAceptaTerminosPago}
                            />

                            <button onClick={() => { setShowPaymentModal(false); setPendingApplyAfterPayment(false); }} className="w-full mt-6 py-4 text-gray-400 font-black uppercase text-[10px] tracking-[0.3em] hover:text-[#7a0202] transition-colors">Abortar Transacción</button>
                        </div>
                    </div>
                )}

                {/* --- MODAL REEMBOLSO: RETROCESO DE CAPITAL --- */}
                {showRefundModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/90 backdrop-blur-md">
                        <div className="bg-white rounded-[3rem] shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
                            <div className="p-10 -b  bg-gris/50">
                                <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter">Retroceso de Activo</h2>
                            </div>
                            <div className="p-10 space-y-8">
                                <div className="text-center bg-gris rounded-[2rem] p-8  shadow-inner">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Saldo a Favor del Cliente</span>
                                    <div className="text-4xl font-black text-[#7a0202] tracking-tighter">{formatearMoneda(refundAmountInput || refundableAmount)}</div>
                                </div>
                                <div className="space-y-6">
                                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Motivo Operativo</label>
                                    <div className="grid grid-cols-1 gap-3">
                                        {[
                                            { v: 'billing_error', l: 'Error de facturación' },
                                            { v: 'change_to_cheaper', l: 'Downgrade de Activo' },
                                            { v: 'prefer_credit', l: 'Crédito de Cortesía' },
                                            { v: 'other', l: 'Especificaciones Especiales' }
                                        ].map(r => (
                                            <label key={r.v} className={`flex items-center gap-4 p-5 rounded-2xl -2 transition-all cursor-pointer ${refundReason === r.v ? '-[#7a0202] bg-red-50/50' : ' hover:bg-gris'}`}>
                                                <input type="radio" name="reason" value={r.v} checked={refundReason === r.v} onChange={() => setRefundReason(r.v)} className="text-[#7a0202] focus:ring-[#7a0202] w-5 h-5" />
                                                <span className="text-[10px] font-black uppercase tracking-tighter text-gray-800">{r.l}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="p-10 bg-gris/30 flex gap-4">
                                <button onClick={() => setShowRefundModal(false)} className="flex-1 py-4 text-gray-400 font-black uppercase text-[10px] tracking-[0.3em]">Cancelar</button>
                                <button onClick={handleRefundSubmit} disabled={isProcessing} className="flex-[2] py-5 bg-[#7a0202] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-red-200 hover:bg-black transition-all">Ejecutar Retroceso</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TOAST TÁCTICO --- */}
                {toast && (
                    <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] px-8 py-5 rounded-2xl shadow-2xl bg-gray-900 text-white flex items-center gap-5  -white/10 animate-in slide-in-from-bottom-10 duration-500`}>
                        <div className={`w-2.5 h-2.5 rounded-full ${toast.type === 'success' ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.6)]' : 'bg-[#7a0202] shadow-[0_0_10px_rgba(122,2,2,0.6)]'} animate-pulse`} />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
                    </div>
                )}
            </div>
        </GuestLayout>
    );
}
