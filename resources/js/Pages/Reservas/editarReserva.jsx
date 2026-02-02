import ErrorBoundary from '@/Components/ErrorBoundary';
import FormularioPago from '@/Components/pagos/FormularioPago';
import useReserva from '@/hooks/reservas/useReserva';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import usePreview from '@/hooks/usePreview';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import { Link } from '@inertiajs/react';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

export default function EditarReserva({
    reserva: initialReserva,
    habitaciones = [],
}) {
    // --- HOOKS Y ESTADOS ---
    const { reserva, setReserva, refresh, aplicarCambioFechas } =
        useReserva(initialReserva);
    const [isProcessing, setIsProcessing] = useState(false);
    const [toast, setToast] = useState(null);
    const [showDateModal, setShowDateModal] = useState(false);
    const [modalCheckIn, setModalCheckIn] = useState('');
    const [modalCheckOut, setModalCheckOut] = useState('');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [pendingApplyAfterPayment, setPendingApplyAfterPayment] =
        useState(false);
    const [aceptaTerminosPago, setAceptaTerminosPago] = useState(false);
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('change_to_cheaper');
    const [refundNotes, setRefundNotes] = useState('');
    const [refundAmountInput, setRefundAmountInput] = useState(null);

    const [selectedHabitacionIds, setSelectedHabitacionIds] = useState([]);
    const [savingHabitaciones, setSavingHabitaciones] = useState(false);
    const [availableHabitaciones, setAvailableHabitaciones] = useState(
        habitaciones || [],
    );

    const refundReasons = [
        { value: 'billing_error', label: 'Error de facturación' },
        { value: 'change_to_cheaper', label: 'Cambio a habitación más barata' },
        { value: 'prefer_credit', label: 'Cliente prefiere crédito' },
        { value: 'other', label: 'Otra' },
    ];

    // --- LÓGICA DE DATOS ---

    useEffect(() => {
        if (reserva?.habitaciones) {
            const currentIds = reserva.habitaciones.map(
                (h) => h.habitacion_id || h.id,
            );
            setSelectedHabitacionIds((prev) => {
                const newIds = [...prev];
                newIds.length = currentIds.length;
                return newIds;
            });
        }
        if (habitaciones) {
            setAvailableHabitaciones(habitaciones);
        }
    }, [reserva, habitaciones]);

    const {
        preview: pFromHook,
        loading: pLoadingHook,
        error: pErrorHook,
        fetchPreview: fetchPreviewHook,
    } = usePreview(reserva.localizador);

    // Usar directamente las props del hook en lugar de estado duplicado
    const preview = pFromHook;
    const previewLoading = pLoadingHook;
    const previewError = pErrorHook;

    useReservaEvents(reserva, { onRefresh: refresh });

    // --- MANEJADORES ---
    const showToast = (message, type = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4500);
    };

    const handleDesasignarHabitacion = async (habitacionId) => {
        setSavingHabitaciones(true);
        try {
            const response = await fetch(
                `/reservas/${reserva.id}/desasignar-habitaciones`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector('meta[name="csrf-token"]')
                                ?.content || '',
                    },
                    body: JSON.stringify({ habitacion_ids: [habitacionId] }),
                },
            );

            const data = await response.json();

            if (data.success && data.reserva) {
                // Actualizar estado con la respuesta del servidor
                setReserva(data.reserva);
                showToast('Habitación desasignada con éxito', 'success');
            } else {
                showToast(data.error || 'Error al desasignar', 'error');
            }
        } catch (error) {
            console.error('Error desasignando:', error);
            showToast('Error al desasignar habitación', 'error');
        } finally {
            setSavingHabitaciones(false);
        }
    };

    const handleUpdateHabitaciones = async () => {
        setSavingHabitaciones(true);

        try {
            const asignarIds = selectedHabitacionIds.filter(
                (id) => id !== null && id !== undefined,
            );

            if (asignarIds.length === 0) {
                showToast('Selecciona al menos una habitación', 'warning');
                setSavingHabitaciones(false);
                return;
            }

            // Hacer el POST al servidor
            const response = await fetch(
                `/reservas/${reserva.id}/asignar-habitaciones`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        'X-CSRF-TOKEN':
                            document.querySelector('meta[name="csrf-token"]')
                                ?.content || '',
                    },
                    body: JSON.stringify({ habitacion_ids: asignarIds }),
                },
            );

            const data = await response.json();

            if (data.success && data.reserva) {
                // Actualizar estado con la respuesta del servidor
                setReserva(data.reserva);
                setSelectedHabitacionIds(
                    data.reserva.habitaciones.map((h) => h.habitacion_id),
                );
                showToast('Habitaciones asignadas con éxito', 'success');
            } else {
                showToast(data.error || 'Error al asignar', 'error');
            }
        } catch (error) {
            console.error('Error asignando:', error);
            showToast('Error al asignar habitaciones', 'error');
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
            const latestPreview = await fetchPreviewHook(
                modalCheckIn,
                modalCheckOut,
            );

            if (latestPreview?.available === false) {
                showToast('No hay disponibilidad para esas fechas', 'error');
                return;
            }

            if (latestPreview?.estimate_charge > 0) {
                setPaymentAmount(latestPreview.estimate_charge);
                setPendingApplyAfterPayment(true);
                setShowPaymentModal(true);
                return;
            }

            const res = await aplicarCambioFechas(modalCheckIn, modalCheckOut);
            showToast(res?.message || 'Fechas actualizadas', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            showToast(err?.message || 'Error al cambiar fechas', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handlePagoExitoso = async (paymentResult) => {
        setShowPaymentModal(false);
        if (!pendingApplyAfterPayment) return;
        try {
            setIsProcessing(true);
            await aplicarCambioFechas(
                modalCheckIn,
                modalCheckOut,
                paymentResult?.pago_id,
            );
            showToast('Cambio aplicado tras pago.', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            showToast('Error al aplicar cambios tras el pago', 'error');
        } finally {
            setPendingApplyAfterPayment(false);
            setIsProcessing(false);
        }
    };

    const handleRefundSubmit = async () => {
        setIsProcessing(true);
        try {
            const payload = {
                monto: refundAmountInput,
                reason_code: refundReason,
                notes: refundNotes,
            };
            const api = await import('@/api/reservas');
            const res = await api.crearSolicitudReembolso(
                reserva.localizador,
                payload,
            );
            if (res.success) {
                showToast('Solicitud enviada correctamente', 'success');
                setShowRefundModal(false);
                refresh();
            }
        } catch (e) {
            showToast('Error al procesar reembolso', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const isCancelled = reserva.status?.toLowerCase().includes('cancelado');
    const isCheckedIn = reserva.status?.toLowerCase() === 'en_estancia';

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 pb-24">
                {/* HEADER SECCIÓN */}
                <header className="sticky top-0 z-30 border-b border-gray-200 bg-white">
                    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-6 md:flex-row md:items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                                    Reserva{' '}
                                    <span className="font-mono text-gray-400">
                                        {reserva.localizador}
                                    </span>
                                </h1>
                                <span
                                    className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest ${isCancelled ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}
                                >
                                    {reserva.status}
                                </span>
                            </div>
                            <p className="mt-1 text-sm font-medium text-gray-500">
                                {reserva.cliente?.nombre} •{' '}
                                {formatearFecha(reserva.check_in)} al{' '}
                                {formatearFecha(reserva.check_out)}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {!isCancelled && (
                                <button
                                    onClick={openDateModal}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                >
                                    Modificar Fechas
                                </button>
                            )}
                            <Link
                                href="/"
                                className="text-sm font-bold text-gray-500 hover:text-gray-700"
                            >
                                Cerrar
                            </Link>
                        </div>
                    </div>
                </header>

                <main className="mx-auto mt-8 max-w-7xl px-4">
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        {/* COLUMNA IZQUIERDA: DETALLES Y ASIGNACIÓN */}
                        <div className="space-y-6 lg:col-span-8">
                            {/* Card: Detalles de Habitaciones */}
                            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">
                                        Habitaciones asignadas
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {reserva.habitaciones.map((hab, idx) => (
                                        <div
                                            key={
                                                hab.habitacion_id ||
                                                hab.id ||
                                                `hab-${idx}`
                                            }
                                            className="flex items-center justify-between p-6 transition hover:bg-gray-50"
                                        >
                                            <div>
                                                <span className="block text-lg font-black uppercase leading-tight text-gray-900">
                                                    {hab.numero
                                                        ? `Habitación ${hab.numero}`
                                                        : hab.tipo ||
                                                          'Habitación Estándar'}
                                                </span>
                                                <span className="mt-1 block text-xs uppercase tracking-widest text-gray-500">
                                                    {hab.numero
                                                        ? hab.tipo
                                                        : 'Sin asignar'}
                                                </span>
                                            </div>
                                            {hab.numero && (
                                                <div className="flex items-center gap-2 text-right">
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800">
                                                        ✓ Asignada
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleDesasignarHabitacion(
                                                                hab.habitacion_id ||
                                                                    hab.id,
                                                            )
                                                        }
                                                        disabled={
                                                            savingHabitaciones
                                                        }
                                                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
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
                            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                                    <div>
                                        <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">
                                            Asignación de habitaciones
                                        </h3>
                                        <p className="mt-1 text-[10px] text-gray-400">
                                            Selecciona habitaciones disponibles
                                            para asignar. Usa el botón ✕ para
                                            desasignar.
                                        </p>
                                    </div>
                                    <button
                                        onClick={handleUpdateHabitaciones}
                                        disabled={savingHabitaciones}
                                        className="rounded-lg bg-gray-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-black disabled:opacity-50"
                                    >
                                        {savingHabitaciones
                                            ? 'Asignando...'
                                            : 'Asignar Seleccionadas'}
                                    </button>
                                </div>
                                <div className="space-y-10 p-6">
                                    {reserva.habitaciones.map((hSlot, idx) => (
                                        <div
                                            key={hSlot.id || `slot-${idx}`}
                                            className="space-y-4"
                                        >
                                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
                                                <button
                                                    onClick={() => {
                                                        const copy = [
                                                            ...selectedHabitacionIds,
                                                        ];
                                                        copy[idx] = null;
                                                        setSelectedHabitacionIds(
                                                            copy,
                                                        );
                                                    }}
                                                    className={`rounded-xl border-2 p-3 text-center transition ${!selectedHabitacionIds[idx] ? 'border-[#7a0202] bg-red-50 text-[#7a0202]' : 'border-gray-100 text-gray-400 hover:border-gray-200'}`}
                                                >
                                                    <span className="block text-[10px] font-black uppercase">
                                                        Vacío
                                                    </span>
                                                </button>

                                                {availableHabitaciones.map(
                                                    (habFisica) => {
                                                        const isSelected =
                                                            selectedHabitacionIds[
                                                                idx
                                                            ] === habFisica.id;
                                                        const isUsedElsewhere =
                                                            selectedHabitacionIds.some(
                                                                (id, i) =>
                                                                    id ===
                                                                        habFisica.id &&
                                                                    i !== idx,
                                                            );

                                                        return (
                                                            <button
                                                                key={
                                                                    habFisica.id
                                                                }
                                                                disabled={
                                                                    isUsedElsewhere
                                                                }
                                                                onClick={() => {
                                                                    const copy =
                                                                        [
                                                                            ...selectedHabitacionIds,
                                                                        ];
                                                                    copy[idx] =
                                                                        habFisica.id;
                                                                    setSelectedHabitacionIds(
                                                                        copy,
                                                                    );
                                                                }}
                                                                className={`relative rounded-xl border-2 p-3 transition ${
                                                                    isSelected
                                                                        ? 'border-[#7a0202] bg-red-50 text-[#7a0202]'
                                                                        : isUsedElsewhere
                                                                          ? 'cursor-not-allowed opacity-20 grayscale'
                                                                          : 'border-gray-100 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <span className="block text-lg font-black leading-none">
                                                                    {
                                                                        habFisica.numero
                                                                    }
                                                                </span>
                                                                <span className="text-[8px] font-bold uppercase opacity-60">
                                                                    {
                                                                        habFisica.tipo
                                                                    }
                                                                </span>
                                                            </button>
                                                        );
                                                    },
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* COLUMNA DERECHA: SIDEBAR DE ACCIÓN */}
                        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
                            <div className="rounded-3xl bg-[#7a0202] p-8 text-white shadow-xl shadow-red-100">
                                <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                    Total a cobrar
                                </h4>
                                <div className="mb-8 text-4xl font-black leading-none">
                                    {formatearMoneda(reserva.precio_total)}
                                </div>

                                <div className="mb-8 space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm">
                                        <span className="font-medium opacity-70">
                                            Pago inicial
                                        </span>
                                        <span className="rounded bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                                            {reserva.pago}
                                        </span>
                                    </div>
                                    {reserva.reembolsos_total > 0 && (
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm text-red-200">
                                            <span className="font-medium">
                                                Total Reembolsado
                                            </span>
                                            <span className="font-black">
                                                -
                                                {formatearMoneda(
                                                    reserva.reembolsos_total,
                                                )}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {!isCancelled &&
                                        reserva.status === 'pendiente' && (
                                            <button
                                                onClick={() =>
                                                    (window.location.href =
                                                        route('scan-qr') +
                                                        `?localizador=${reserva.localizador}&action=checkin`)
                                                }
                                                className="w-full rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-widest text-[#7a0202] shadow-lg shadow-black/10 transition hover:bg-gray-100"
                                            >
                                                Hacer Check-In
                                            </button>
                                        )}

                                    {!isCancelled &&
                                        reserva.status !== 'finalizado' && (
                                            <button
                                                onClick={() =>
                                                    (window.location.href =
                                                        route('scan-qr') +
                                                        `?localizador=${reserva.localizador}&action=checkout`)
                                                }
                                                className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-black/40"
                                            >
                                                Hacer Check-Out
                                            </button>
                                        )}
                                </div>
                            </div>

                            {!isCancelled && reserva.pago === 'pagado' && (
                                <button
                                    onClick={() => {
                                        setRefundAmountInput(
                                            reserva.precio_total -
                                                reserva.reembolsos_total,
                                        );
                                        setShowRefundModal(true);
                                    }}
                                    className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:border-red-200 hover:text-red-600"
                                >
                                    Solicitar Reembolso
                                </button>
                            )}
                        </aside>
                    </div>
                </main>

                {/* --- MODAL: MODIFICAR FECHAS --- */}
                {showDateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="animate-in fade-in zoom-in w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl duration-200">
                            <div className="flex items-center justify-between border-b border-gray-100 p-8">
                                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                                    Cambiar Fechas
                                </h2>
                                <button
                                    onClick={() => setShowDateModal(false)}
                                    className="font-bold text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-6 p-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400">
                                            Entrada
                                        </label>
                                        <input
                                            type="date"
                                            disabled={isCheckedIn}
                                            value={modalCheckIn}
                                            onChange={(e) => {
                                                setModalCheckIn(e.target.value);
                                                fetchPreviewHook(
                                                    e.target.value,
                                                    modalCheckOut,
                                                );
                                            }}
                                            className="w-full rounded-xl border-gray-200 bg-gray-50 font-bold focus:border-[#7a0202] focus:ring-[#7a0202]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase text-gray-400">
                                            Salida
                                        </label>
                                        <input
                                            type="date"
                                            value={modalCheckOut}
                                            onChange={(e) => {
                                                setModalCheckOut(
                                                    e.target.value,
                                                );
                                                fetchPreviewHook(
                                                    modalCheckIn,
                                                    e.target.value,
                                                );
                                            }}
                                            className="w-full rounded-xl border-gray-200 bg-gray-50 font-bold focus:border-[#7a0202] focus:ring-[#7a0202]"
                                        />
                                    </div>
                                </div>

                                <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6">
                                    {previewLoading ? (
                                        <div className="flex animate-pulse items-center justify-center py-4 text-xs font-bold uppercase tracking-widest text-gray-400">
                                            Calculando cambios...
                                        </div>
                                    ) : previewError ? (
                                        <div className="py-4 text-center text-sm font-bold text-red-500">
                                            {previewError}
                                        </div>
                                    ) : (
                                        preview && (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">
                                                        Diferencia Total
                                                    </span>
                                                    <span
                                                        className={`text-2xl font-black ${preview.estimate_charge > 0 ? 'text-red-600' : 'text-green-600'}`}
                                                    >
                                                        {preview.estimate_charge >
                                                        0
                                                            ? '+'
                                                            : ''}
                                                        {formatearMoneda(
                                                            preview.estimate_charge ||
                                                                preview.nuevo_total -
                                                                    preview.viejo_total,
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="mb-1 block text-[10px] font-black uppercase leading-none text-gray-400">
                                                        Estado
                                                    </span>
                                                    <span
                                                        className={`text-xs font-black uppercase ${preview.available ? 'text-green-600' : 'text-red-600'}`}
                                                    >
                                                        {preview.available
                                                            ? '✓ Disponible'
                                                            : '✕ No disponible'}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-3 bg-gray-50 p-8">
                                <button
                                    onClick={() => setShowDateModal(false)}
                                    className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500 transition hover:bg-white/50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={
                                        !preview?.available || isProcessing
                                    }
                                    onClick={confirmDateModal}
                                    className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-red-100 transition hover:bg-[#5a0101] disabled:opacity-50"
                                >
                                    {isProcessing
                                        ? 'Procesando...'
                                        : 'Aplicar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODAL: REEMBOLSO --- */}
                {showRefundModal && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                        <div className="animate-in fade-in slide-in-from-bottom-4 w-full max-w-md rounded-3xl bg-white shadow-2xl duration-300">
                            <div className="border-b border-gray-100 p-8">
                                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                                    Solicitar Reembolso
                                </h2>
                            </div>
                            <div className="space-y-6 p-8">
                                <div className="text-center">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Monto a reembolsar
                                    </span>
                                    <div className="mt-1 text-4xl font-black text-[#7a0202]">
                                        {formatearMoneda(refundAmountInput)}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black uppercase text-gray-400">
                                        Motivo de la solicitud
                                    </label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {refundReasons.map((r) => (
                                            <label
                                                key={r.value}
                                                className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 p-4 transition ${refundReason === r.value ? 'border-[#7a0202] bg-red-50' : 'border-gray-50 hover:bg-gray-50'}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="reason"
                                                    value={r.value}
                                                    checked={
                                                        refundReason === r.value
                                                    }
                                                    onChange={() =>
                                                        setRefundReason(r.value)
                                                    }
                                                    className="text-[#7a0202] focus:ring-[#7a0202]"
                                                />
                                                <span className="text-sm font-bold text-gray-700">
                                                    {r.label}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <textarea
                                    value={refundNotes}
                                    onChange={(e) =>
                                        setRefundNotes(e.target.value)
                                    }
                                    placeholder="Notas adicionales..."
                                    className="min-h-[100px] w-full rounded-xl border-gray-100 bg-gray-50 p-4 text-sm focus:ring-[#7a0202]"
                                />
                            </div>
                            <div className="flex gap-3 bg-gray-50 p-8">
                                <button
                                    onClick={handleRefundSubmit}
                                    disabled={isProcessing}
                                    className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-red-100 transition disabled:opacity-50"
                                >
                                    {isProcessing ? 'Enviando...' : 'Confirmar'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MODAL: PAGO ADICIONAL --- */}
                {showPaymentModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
                        <div className="animate-in zoom-in w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl duration-200">
                            <div className="mb-8 flex items-start justify-between">
                                <div>
                                    <h2 className="text-2xl font-black uppercase leading-tight text-gray-900">
                                        Pago Adicional
                                    </h2>
                                    <p className="mt-1 text-sm font-medium text-gray-400">
                                        Se requiere saldar la diferencia para
                                        aplicar cambios.
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowPaymentModal(false)}
                                    className="font-bold text-gray-300 hover:text-gray-500"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="mb-8 rounded-2xl border border-gray-100 bg-gray-50 p-6 text-center">
                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    Total a pagar ahora
                                </span>
                                <div className="mt-1 text-4xl font-black text-[#7a0202]">
                                    {formatearMoneda(paymentAmount)}
                                </div>
                            </div>

                            <ErrorBoundary>
                                <FormularioPago
                                    monto={paymentAmount}
                                    onPagoExitoso={handlePagoExitoso}
                                    onError={(e) =>
                                        showToast(e?.message, 'error')
                                    }
                                    reservaData={{
                                        reserva_id: reserva.id,
                                        es_edicion_pago: true,
                                        check_in:
                                            modalCheckIn || reserva.check_in,
                                        check_out:
                                            modalCheckOut || reserva.check_out,
                                        habitaciones: reserva.habitaciones,
                                    }}
                                    aceptaTerminos={aceptaTerminosPago}
                                    mostrarAceptacion={true}
                                    onAceptaChange={setAceptaTerminosPago}
                                />
                            </ErrorBoundary>

                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="mt-6 w-full py-4 text-[10px] font-bold uppercase tracking-widest text-gray-400 transition hover:text-gray-600"
                            >
                                Cancelar operación
                            </button>
                        </div>
                    </div>
                )}

                {/* --- NOTIFICACIONES (TOAST) --- */}
                {toast && (
                    <div
                        className={`animate-in slide-in-from-bottom-10 fixed bottom-8 left-1/2 z-[200] flex -translate-x-1/2 items-center gap-4 rounded-2xl px-6 py-4 shadow-2xl duration-500 ${toast.type === 'error' ? 'bg-red-900 text-white' : 'bg-gray-900 text-white'}`}
                    >
                        <div
                            className={`h-2 w-2 rounded-full ${toast.type === 'error' ? 'bg-red-400' : 'bg-green-400'} animate-pulse`}
                        />
                        <span className="text-sm font-black uppercase tracking-widest">
                            {toast.message}
                        </span>
                    </div>
                )}
            </div>
        </AuthenticatedLayout>
    );
}
