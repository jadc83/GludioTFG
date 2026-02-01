import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import BotonVolver from '@/Components/UI/BotonVolver';
import { useState, useEffect, useMemo } from 'react';
import useReserva from '@/hooks/reservas/useReserva';
import usePreview from '@/hooks/usePreview';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import FormularioPago from '@/Components/pagos/FormularioPago';
import ErrorBoundary from '@/Components/ErrorBoundary';
import useToast from '@/hooks/useToast.jsx';
import dayjs from 'dayjs';

export default function EditarReserva({ reserva: initialReserva, habitaciones = [] }) {
    // --- HOOKS Y ESTADOS ---
    const { reserva, setReserva, refresh, aplicarCambioFechas } = useReserva(initialReserva);
    const toast = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    const [showDateModal, setShowDateModal] = useState(false);
    const [modalCheckIn, setModalCheckIn] = useState('');
    const [modalCheckOut, setModalCheckOut] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [pendingApplyAfterPayment, setPendingApplyAfterPayment] = useState(false);
    const [aceptaTerminosPago, setAceptaTerminosPago] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('change_to_cheaper');
    const [refundNotes, setRefundNotes] = useState('');
    const [refundAmountInput, setRefundAmountInput] = useState(null);

    const [selectedHabitacionIds, setSelectedHabitacionIds] = useState([]);
    const [savingHabitaciones, setSavingHabitaciones] = useState(false);
    const [availableHabitaciones, setAvailableHabitaciones] = useState(habitaciones || []);

    const refundReasons = [
        { value: 'billing_error', label: 'Error de facturación' },
        { value: 'change_to_cheaper', label: 'Cambio a habitación más barata' },
        { value: 'prefer_credit', label: 'Cliente prefiere crédito' },
        { value: 'other', label: 'Otra' },
    ];

    // --- LÓGICA DE DATOS ---

    useEffect(() => {
        if (reserva?.habitaciones) {
            const currentIds = reserva.habitaciones.map(h => h.habitacion_id || h.id);
            setSelectedHabitacionIds(prev => {
                const newIds = [...prev];
                newIds.length = currentIds.length;
                return newIds;
            });
        }
        if (habitaciones) {
            setAvailableHabitaciones(habitaciones);
        }
    }, [reserva, habitaciones]);

    const { preview: pFromHook, loading: pLoadingHook, error: pErrorHook, fetchPreview: fetchPreviewHook } = usePreview(reserva.localizador);

    // Usar directamente las props del hook en lugar de estado duplicado
    const preview = pFromHook;
    const previewLoading = pLoadingHook;
    const previewError = pErrorHook;

    useReservaEvents(reserva, { onRefresh: refresh });

    // --- MANEJADORES ---
    const handleDesasignarHabitacion = async (habitacionId) => {
        setSavingHabitaciones(true);
        try {
            const response = await fetch(`/reservas/${reserva.id}/desasignar-habitaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ habitacion_ids: [habitacionId] })
            });

            const data = await response.json();

            if (data.success && data.reserva) {
                // Actualizar estado con la respuesta del servidor
                setReserva(data.reserva);
                toast.success('Habitación desasignada con éxito');
            } else {
                toast.error(data.error || 'Error al desasignar');
            }
        } catch (error) {
            console.error('Error desasignando:', error);
            toast.error('Error al desasignar habitación');
        } finally {
            setSavingHabitaciones(false);
        }
    };

    const handleUpdateHabitaciones = async () => {
        setSavingHabitaciones(true);

        try {
            const asignarIds = selectedHabitacionIds.filter(id => id !== null && id !== undefined);

            if (asignarIds.length === 0) {
                toast.warning('Selecciona al menos una habitación');
                setSavingHabitaciones(false);
                return;
            }

            // Hacer el POST al servidor
            const response = await fetch(`/reservas/${reserva.id}/asignar-habitaciones`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.content || ''
                },
                body: JSON.stringify({ habitacion_ids: asignarIds })
            });

            const data = await response.json();

            if (data.success && data.reserva) {
                // Actualizar estado con la respuesta del servidor
                setReserva(data.reserva);
                setSelectedHabitacionIds(data.reserva.habitaciones.map(h => h.habitacion_id));
                toast.success('Habitaciones asignadas con éxito');
            } else {
                toast.error(data.error || 'Error al asignar');
            }
        } catch (error) {
            console.error('Error asignando:', error);
            toast.error('Error al asignar habitaciones');
        } finally {
            setSavingHabitaciones(false);
        }
    };

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
                toast.error('No hay disponibilidad para esas fechas');
                return;
            }

            if (latestPreview?.estimate_charge > 0) {
                setPaymentAmount(latestPreview.estimate_charge);
                setPendingApplyAfterPayment(true);
                setShowPaymentModal(true);
                return;
            }

            const res = await aplicarCambioFechas(modalCheckIn, modalCheckOut);
            toast.success(res?.message || 'Fechas actualizadas');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            toast.error(err?.message || 'Error al cambiar fechas');
        } finally { setIsProcessing(false); }
    };

    const handlePagoExitoso = async (paymentResult) => {
        setShowPaymentModal(false);
        if (!pendingApplyAfterPayment) return;
        try {
            setIsProcessing(true);
            await aplicarCambioFechas(modalCheckIn, modalCheckOut, paymentResult?.pago_id);
            toast.success('Cambio aplicado tras pago.');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            toast.error('Error al aplicar cambios tras el pago');
        } finally {
            setPendingApplyAfterPayment(false);
            setIsProcessing(false);
        }
    };

    const handleRefundSubmit = async () => {
        setIsProcessing(true);
        try {
            const payload = { monto: refundAmountInput, reason_code: refundReason, notes: refundNotes };
            const api = await import('@/api/reservas');
            const res = await api.crearSolicitudReembolso(reserva.localizador, payload);
            if (res.success) {
                toast.success('Solicitud enviada correctamente');
                setShowRefundModal(false);
                refresh();
            }
        } catch (e) {
            toast.error('Error al procesar reembolso');
        } finally { setIsProcessing(false); }
    };

    const isCancelled = reserva.status?.toLowerCase().includes('cancelado');
    const isCheckedIn = reserva.status?.toLowerCase() === 'en_estancia';

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 pb-24">
                {/* HEADER SECCIÓN */}
                <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black text-gray-900 tracking-tight">
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
                            <BotonVolver />
                        </div>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 mt-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                        {/* COLUMNA IZQUIERDA: DETALLES Y ASIGNACIÓN */}
                        <div className="lg:col-span-8 space-y-6">

                            {/* Card: Detalles de Habitaciones */}
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Habitaciones asignadas</h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {reserva.habitaciones.map((hab, idx) => (
                                        <div key={hab.habitacion_id || hab.id || `hab-${idx}`} className="p-6 flex justify-between items-center hover:bg-gray-50 transition">
                                            <div>
                                                <span className="block font-black text-gray-900 text-lg uppercase leading-tight">
                                                    {hab.numero ? `Habitación ${hab.numero}` : (hab.tipo || 'Habitación Estándar')}
                                                </span>
                                                <span className="text-xs text-gray-500 uppercase tracking-widest mt-1 block">
                                                    {hab.numero ? hab.tipo : 'Sin asignar'}
                                                </span>
                                            </div>
                                            {hab.numero && (
                                                <div className="text-right flex items-center gap-2">
                                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800">
                                                        ✓ Asignada
                                                    </span>
                                                    <button
                                                        onClick={() => handleDesasignarHabitacion(hab.habitacion_id || hab.id)}
                                                        disabled={savingHabitaciones}
                                                        className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition disabled:opacity-50"
                                                        title="Quitar asignación de habitación"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Card: Asignación Manual Física */}
                            <section className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800 uppercase text-xs tracking-widest">Asignación de habitaciones</h3>
                                        <p className="text-[10px] text-gray-400 mt-1">Selecciona habitaciones disponibles para asignar. Usa el botón ✕ para desasignar.</p>
                                    </div>
                                    <button
                                        onClick={handleUpdateHabitaciones}
                                        disabled={savingHabitaciones}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-black transition disabled:opacity-50"
                                    >
                                        {savingHabitaciones ? 'Asignando...' : 'Asignar Seleccionadas'}
                                    </button>
                                </div>
                                <div className="p-6 space-y-10">
                                    {reserva.habitaciones.map((hSlot, idx) => (
                                        <div key={hSlot.id || `slot-${idx}`} className="space-y-4">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                                <button
                                                    onClick={() => {
                                                        const copy = [...selectedHabitacionIds];
                                                        copy[idx] = null;
                                                        setSelectedHabitacionIds(copy);
                                                    }}
                                                    className={`p-3 rounded-xl border-2 transition text-center ${!selectedHabitacionIds[idx] ? 'border-[#7a0202] bg-red-50 text-[#7a0202]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                                >
                                                    <span className="block text-[10px] font-black uppercase">Vacío</span>
                                                </button>

                                                {availableHabitaciones.map(habFisica => {
                                                    const isSelected = selectedHabitacionIds[idx] === habFisica.id;
                                                    const isUsedElsewhere = selectedHabitacionIds.some((id, i) => id === habFisica.id && i !== idx);

                                                    return (
                                                        <button
                                                            key={habFisica.id}
                                                            disabled={isUsedElsewhere}
                                                            onClick={() => {
                                                                const copy = [...selectedHabitacionIds];
                                                                copy[idx] = habFisica.id;
                                                                setSelectedHabitacionIds(copy);
                                                            }}
                                                            className={`p-3 rounded-xl border-2 transition relative ${
                                                                isSelected ? 'border-[#7a0202] bg-red-50 text-[#7a0202]' :
                                                                isUsedElsewhere ? 'opacity-20 cursor-not-allowed grayscale' : 'border-gray-100 hover:border-gray-300'
                                                            }`}
                                                        >
                                                            <span className="block text-lg font-black leading-none">{habFisica.numero}</span>
                                                            <span className="text-[8px] uppercase font-bold opacity-60">{habFisica.tipo}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* COLUMNA DERECHA: SIDEBAR DE ACCIÓN */}
                        <aside className="lg:col-span-4 space-y-6 lg:sticky lg:top-28">
                            <div className="bg-[#7a0202] rounded-3xl p-8 text-white shadow-xl shadow-red-100">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-2">Total a cobrar</h4>
                                <div className="text-4xl font-black mb-8 leading-none">{formatearMoneda(reserva.precio_total)}</div>

                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                                        <span className="opacity-70 font-medium">Pago inicial</span>
                                        <span className="font-bold uppercase tracking-widest text-[10px] bg-white/20 px-2 py-1 rounded">{reserva.pago}</span>
                                    </div>
                                    {reserva.reembolsos_total > 0 && (
                                        <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3 text-red-200">
                                            <span className="font-medium">Total Reembolsado</span>
                                            <span className="font-black">-{formatearMoneda(reserva.reembolsos_total)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {!isCancelled && reserva.status === 'pendiente' && (
                                        <button
                                            onClick={() => window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkin`}
                                            className="w-full py-4 bg-white text-[#7a0202] rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-gray-100 transition shadow-lg shadow-black/10"
                                        >
                                            Hacer Check-In
                                        </button>
                                    )}

                                    {!isCancelled && reserva.status !== 'finalizado' && (
                                        <button
                                            onClick={() => window.location.href = route('scan-qr') + `?localizador=${reserva.localizador}&action=checkout`}
                                            className="w-full py-4 bg-black/30 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black/40 transition border border-white/10"
                                        >
                                            Hacer Check-Out
                                        </button>
                                    )}
                                </div>
                            </div>

                            {!isCancelled && reserva.pago === 'pagado' && (
                                <button
                                    onClick={() => { setRefundAmountInput(reserva.precio_total - reserva.reembolsos_total); setShowRefundModal(true); }}
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
                        <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
                            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Cambiar Fechas</h2>
                                <button onClick={() => setShowDateModal(false)} className="text-gray-400 hover:text-gray-600 font-bold">✕</button>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400">Entrada</label>
                                        <input
                                            type="date"
                                            disabled={isCheckedIn}
                                            value={modalCheckIn}
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
                                        <div className="flex items-center justify-center py-4 text-gray-400 font-bold text-xs uppercase tracking-widest animate-pulse">Calculando cambios...</div>
                                    ) : previewError ? (
                                        <div className="text-red-500 text-sm font-bold text-center py-4">{previewError}</div>
                                    ) : preview && (
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <span className="block text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Diferencia Total</span>
                                                <span className={`text-2xl font-black ${preview.estimate_charge > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {preview.estimate_charge > 0 ? '+' : ''}{formatearMoneda(preview.estimate_charge || (preview.nuevo_total - preview.viejo_total))}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block text-[10px] font-black text-gray-400 uppercase leading-none mb-1">Estado</span>
                                                <span className={`text-xs font-black uppercase ${preview.available ? 'text-green-600' : 'text-red-600'}`}>
                                                    {preview.available ? '✓ Disponible' : '✕ No disponible'}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-3">
                                <button onClick={() => setShowDateModal(false)} className="flex-1 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-gray-500 hover:bg-white/50 transition uppercase text-xs tracking-widest">Cancelar</button>
                                <button
                                    disabled={!preview?.available || isProcessing}
                                    onClick={confirmDateModal}
                                    className="flex-1 py-4 bg-[#7a0202] text-white rounded-2xl font-bold uppercase text-xs tracking-widest hover:bg-[#5a0101] transition disabled:opacity-50 shadow-lg shadow-red-100"
                                >
                                    {isProcessing ? 'Procesando...' : 'Aplicar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODAL: REEMBOLSO --- */}
                {showRefundModal && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
                        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                            <div className="p-8 border-b border-gray-100">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">Solicitar Reembolso</h2>
                            </div>
                            <div className="p-8 space-y-6">
                                <div className="text-center">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Monto a reembolsar</span>
                                    <div className="text-4xl font-black text-[#7a0202] mt-1">{formatearMoneda(refundAmountInput)}</div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-gray-400">Motivo de la solicitud</label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {refundReasons.map(r => (
                                            <label key={r.value} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition cursor-pointer ${refundReason === r.value ? 'border-[#7a0202] bg-red-50' : 'border-gray-50 hover:bg-gray-50'}`}>
                                                <input type="radio" name="reason" value={r.value} checked={refundReason === r.value} onChange={() => setRefundReason(r.value)} className="text-[#7a0202] focus:ring-[#7a0202]" />
                                                <span className="text-sm font-bold text-gray-700">{r.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    value={refundNotes}
                                    onChange={(e) => setRefundNotes(e.target.value)}
                                    placeholder="Notas adicionales..."
                                    className="w-full bg-gray-50 border-gray-100 rounded-xl text-sm p-4 focus:ring-[#7a0202] min-h-[100px]"
                                />
                            </div>
                            <div className="p-8 bg-gray-50 flex gap-3">
                                <button onClick={handleRefundSubmit} disabled={isProcessing} className="flex-1 py-4 bg-[#7a0202] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-red-100 transition disabled:opacity-50">
                                    {isProcessing ? 'Enviando...' : 'Confirmar'}
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
                                    onError={(e) => toast.error(e?.message)}
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
            </div>
        </AuthenticatedLayout>
    );
}
