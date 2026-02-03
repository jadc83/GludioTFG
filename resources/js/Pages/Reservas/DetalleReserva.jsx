import ErrorBoundary from '@/Components/ErrorBoundary';
import FormularioPago from '@/Components/pagos/FormularioPago';
import LoadingSpinner from '@/Components/UI/LoadingSpinner';
import useReserva from '@/hooks/reservas/useReserva';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import usePreview from '@/hooks/usePreview';
import GuestLayout from '@/Layouts/GuestLayout';
import { formatearFecha, formatearMoneda } from '@/utils/formatters';
import {
    ArrowDownOnSquareIcon,
    ArrowUpOnSquareIcon,
    CheckCircleIcon,
    DocumentArrowDownIcon,
    MapPinIcon,
    PhoneIcon,
} from '@heroicons/react/24/outline';
import dayjs from 'dayjs';
import { useMemo, useState } from 'react';

export default function DetalleReserva({ reserva: initialReserva }) {
    // --- HOOKS Y ESTADOS PRINCIPALES ---
    const { reserva, setReserva, refresh, aplicarCambioFechas } =
        useReserva(initialReserva);
    const [isProcessing, setIsProcessing] = useState(false);
    // toasts are emitted via global events and handled by the shared Toast component

    // --- ESTADOS MODAL FECHAS ---
    const [showDateModal, setShowDateModal] = useState(false);
    const [modalCheckIn, setModalCheckIn] = useState('');
    const [modalCheckOut, setModalCheckOut] = useState('');

    // --- ESTADOS PAGO / REEMBOLSO ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [pendingApplyAfterPayment, setPendingApplyAfterPayment] =
        useState(false);
    const [aceptaTerminosPago, setAceptaTerminosPago] = useState(false);

    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('change_to_cheaper');
    const [refundNotes, setRefundNotes] = useState('');
    const [refundAmountInput, setRefundAmountInput] = useState(0);

    const {
        preview,
        loading: previewLoading,
        error: previewError,
        fetchPreview: fetchPreviewHook,
    } = usePreview(reserva.localizador);

    useReservaEvents(reserva, { onRefresh: refresh });

    const showToast = (message, type = 'info') => {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
    };

    const refundableAmount = useMemo(() => {
        try {
            const pagos = reserva.pagos || [];
            let ultimoPago = pagos
                .slice()
                .reverse()
                .find((p) =>
                    ['completado', 'procesando', 'pagado'].includes(p.estado),
                );
            if (ultimoPago) {
                const pagosRefunds = reserva.reembolsos || [];
                let sumRefundsOnPago = pagosRefunds
                    .filter((r) => !r.pago_id || r.pago_id === ultimoPago.id)
                    .reduce((s, r) => s + (Number(r.monto) || 0), 0);
                return Math.max(
                    0,
                    (Number(ultimoPago.monto) || 0) - sumRefundsOnPago,
                );
            }
            return Math.max(
                0,
                (Number(reserva.precio_total) || 0) -
                    (Number(reserva.reembolsos_total) || 0),
            );
        } catch (e) {
            return 0;
        }
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
            const latestPreview = await fetchPreviewHook(
                modalCheckIn,
                modalCheckOut,
            );
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
            showToast('Pago y actualizacion de reserva completados', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            showToast(
                'Error al aplicar cambios tras el pago, consulte a recepción',
                'error',
            );
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
                notes: refundNotes,
            });
            if (res.success) {
                showToast('Solicitud enviada correctamente', 'success');
                setShowRefundModal(false);
                refresh();
            }
        } catch (e) {
            showToast('Error al procesar solicitud', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const isCancelled = String(reserva.status || '')
        .toLowerCase()
        .includes('cancelado');
    const isCheckedIn =
        String(reserva.status || '').toLowerCase() === 'checked_in';

    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris pb-24">
                {/* HEADER SECCIÓN */}
                <header className="sticky top-0 z-30 border-b border-gray-200 bg-gris">
                    <div className="mx-auto flex max-w-7xl flex-col justify-between gap-4 px-4 py-6 md:flex-row md:items-center">
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black uppercase tracking-tight text-gray-900">
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
                        </div>
                    </div>
                </header>

                <main className="mx-auto mt-8 max-w-7xl px-4">
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        {/* COLUMNA IZQUIERDA: DETALLES */}
                        <div className="space-y-6 bg-gris lg:col-span-8">
                            {/* Card: Activos */}
                            <section className="overflow-hidden rounded-2xl border border-gray-200 bg-gris shadow-sm">
                                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-800">
                                        Contrato y Activos
                                    </h3>
                                </div>
                                <div className="divide-y divide-gray-100">
                                    {reserva.habitaciones.map((hab, idx) => (
                                        <div
                                            key={hab.id || idx}
                                            className="flex items-center justify-between p-6 transition hover:bg-gray-50"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-900 text-xs font-black uppercase text-white">
                                                    {hab.tipo?.charAt(0) || 'H'}
                                                </div>
                                                <div>
                                                    <span className="block text-lg font-black uppercase leading-tight text-gray-900">
                                                        {hab.numero
                                                            ? `Habitación ${hab.numero}`
                                                            : hab.tipo}
                                                    </span>
                                                    <span className="font-mono text-[10px] uppercase tracking-tighter text-gray-400">
                                                        {hab.numero
                                                            ? hab.tipo
                                                            : `ID: ${reserva.localizador}-${idx + 1}`}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Card: Ubicación y Protocolo */}
                            <section className="grid grid-cols-1 gap-8 rounded-2xl border border-gray-200 bg-gris p-8 shadow-sm md:grid-cols-2">
                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                        Información de Destino
                                    </h4>
                                    <div className="flex gap-3">
                                        <MapPinIcon className="h-5 w-5 shrink-0 text-red-900" />
                                        <p className="text-sm font-bold text-gray-700">
                                            Hotel Gludio, Avenida del Ejército,
                                            Sanlúcar de Barrameda
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <PhoneIcon className="h-5 w-5 shrink-0 text-red-900" />
                                        <p className="text-sm font-bold text-gray-700">
                                            +34 91 234 5678
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-2xl bg-gris p-6">
                                    <h4 className="mb-4 text-[10px] font-black uppercase tracking-widest text-black">
                                        Servicios Incluidos
                                    </h4>
                                    <ul className="space-y-2">
                                        <li className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />{' '}
                                            Wi-Fi Ultra-Rápido
                                        </li>
                                        <li className="flex items-center gap-2 text-xs font-bold text-gray-600">
                                            <CheckCircleIcon className="h-4 w-4 text-green-600" />{' '}
                                            Insonorización Premium
                                        </li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        {/* COLUMNA DERECHA: SIDEBAR "CUADRADO ROJO" */}
                        <aside className="space-y-6 lg:sticky lg:top-28 lg:col-span-4">
                            <div className="rounded-3xl bg-[#7a0202] p-8 text-white shadow-xl shadow-red-100">
                                <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                                    Total de Reserva
                                </h4>
                                <div className="mb-8 text-4xl font-black leading-none">
                                    {formatearMoneda(reserva.precio_total)}
                                </div>

                                <div className="mb-8 space-y-4">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm">
                                        <span className="text-[10px] font-medium uppercase tracking-widest opacity-70">
                                            Estado del pago
                                        </span>
                                        <span className="rounded bg-red-900 px-2 py-1 text-[10px] font-bold uppercase tracking-widest">
                                            {reserva.pago}
                                        </span>
                                    </div>
                                    {reserva.reembolsos_total > 0 && (
                                        <div className="flex items-center justify-between border-b border-white/10 pb-3 text-sm text-red-200">
                                            <span className="text-[10px] font-medium uppercase tracking-widest">
                                                Devoluciones
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
                                                className="w-full rounded-2xl bg-white py-4 text-xs font-black uppercase tracking-widest text-[#7a0202] shadow-lg transition hover:bg-gray-100"
                                            >
                                                <ArrowDownOnSquareIcon className="mr-2 inline h-4 w-4" />
                                                Ejecutar Check-In
                                            </button>
                                        )}

                                    {!isCancelled &&
                                        reserva.status !== 'checked_out' && (
                                            <button
                                                onClick={() =>
                                                    (window.location.href =
                                                        route('scan-qr') +
                                                        `?localizador=${reserva.localizador}&action=checkout`)
                                                }
                                                className="w-full rounded-2xl border border-white/10 bg-black/30 py-4 text-xs font-black uppercase tracking-widest text-white transition hover:bg-black/40"
                                            >
                                                <ArrowUpOnSquareIcon className="mr-2 inline h-4 w-4" />
                                                Ejecutar Check-Out
                                            </button>
                                        )}

                                    <button
                                        onClick={() =>
                                            (window.location.href = `/reservas/${reserva.localizador}/pdf`)
                                        }
                                        className="w-full rounded-2xl border border-white/5 bg-black/10 py-4 text-[10px] font-black uppercase tracking-widest text-white/80 transition hover:bg-black/20"
                                    >
                                        <DocumentArrowDownIcon className="mr-2 inline h-4 w-4" />
                                        Descargar Comprobante
                                    </button>
                                </div>
                            </div>

                            {!isCancelled &&
                                reserva.pago === 'pagado' &&
                                refundableAmount > 0 && (
                                    <button
                                        onClick={() => {
                                            setRefundAmountInput(
                                                refundableAmount,
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
                        <div className="w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl">
                            <div className="flex items-center justify-between border-b border-gray-100 p-8">
                                <h2 className="text-xl font-black uppercase tracking-tight text-gray-900">
                                    Ajuste de Estancia
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
                                            value={modalCheckIn}
                                            disabled={isCheckedIn}
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
                                        <div className="py-4 text-center">
                                            <LoadingSpinner />
                                            <div className="mt-2 text-xs font-bold uppercase text-gray-400">
                                                Calculando impacto...
                                            </div>
                                        </div>
                                    ) : (
                                        preview && (
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="mb-1 block text-[10px] font-black uppercase text-gray-400">
                                                        Diferencia
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
                                                    <span className="mb-1 block text-[10px] font-black uppercase text-gray-400">
                                                        Disponibilidad
                                                    </span>
                                                    <span
                                                        className={`text-xs font-black uppercase ${preview.available ? 'text-green-600' : 'text-red-600'}`}
                                                    >
                                                        {preview.available
                                                            ? 'Activo Libre'
                                                            : 'Sin Cupo'}
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
                                    className="flex-1 rounded-2xl border border-gray-200 bg-white py-4 text-xs font-bold uppercase tracking-widest text-gray-500"
                                >
                                    Cancelar
                                </button>
                                <button
                                    disabled={
                                        !preview?.available || isProcessing
                                    }
                                    onClick={confirmDateModal}
                                    className="flex-1 rounded-2xl bg-[#7a0202] py-4 text-xs font-black uppercase tracking-widest text-white shadow-lg disabled:opacity-50"
                                >
                                    {isProcessing
                                        ? 'Sincronizando...'
                                        : 'Confirmar'}
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
                                    onCambioAceptaTerminos={setAceptaTerminosPago}
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

                {/* Toasts handled by shared `Toast` component in layout */}
            </div>
        </GuestLayout>
    );
}
