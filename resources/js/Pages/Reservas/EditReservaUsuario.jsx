import React from 'react';
import useReserva from '@/hooks/reservas/useReserva';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import usePreview from '@/hooks/usePreview';
import usePaymentCheck from '@/hooks/pagos/usePaymentCheck';
import usePaymentModal from '@/hooks/pagos/usePaymentModal';
import GuestLayout from '@/Layouts/GuestLayout';
import { emitToast } from '@/utils/toast';
import dayjs from 'dayjs';
import { useMemo, useState, useEffect } from 'react';
import ReservaHeader from '@/Components/comunes/ReservaHeader';
import ReservaRooms from '@/Components/reservas/usuario/ReservaRooms';
import ReservaInfo from '@/Components/reservas/usuario/ReservaInfo';
import ReservaSummary from '@/Components/reservas/usuario/ReservaSummary';
import ReservaTransactions from '@/Components/reservas/usuario/ReservaTransactions';
import ReservaSidebar from '@/Components/reservas/comunes/ReservaSidebar';
import ModalFechas from '@/Components/reservas/comunes/ModalFechas';
import ModalPago from '@/Components/reservas/comunes/ModalPago';
import ModalReembolso from '@/Components/reservas/comunes/ModalReembolso';
import useDetalleReserva from '@/hooks/reservas/useDetalleReserva';

export default function DetalleReserva({ reserva: initialReserva }) {
    // --- HOOKS Y ESTADOS PRINCIPALES ---
    const { reserva, setReserva, refresh, aplicarCambioFechas } = useReserva(initialReserva);

    const {
        isProcessing,
        showDateModal,
        setShowDateModal,
        modalCheckIn,
        setModalCheckIn,
        modalCheckOut,
        setModalCheckOut,

        showRefundModal,
        setShowRefundModal,
        refundReason,
        setRefundReason,
        refundNotes,
        setRefundNotes,
        refundAmountInput,
        setRefundAmountInput,
        motivosReembolso,

        preview,
        previewLoading,
        previewError,
        fetchPreviewHook,
        vistaPreviaCargada,

        paymentModal,

        openDateModal,
        confirmDateModal,
        handleRefundSubmit,

        isCancelled,
        isCheckedIn,
    } = useDetalleReserva({ reserva, refresh, aplicarCambioFechas });

    // --- EVENTOS REALTIME Y POLLING ---
    useReservaEvents(reserva, { onRefresh: refresh, onUpdated: setReserva, suppressToast: true });

    // Hook de detalle que agrupa la lógica en un solo lugar
    // (moved to `useDetalleReserva` to make the component leaner)

    useEffect(() => {
        if (reserva?.localizador) refresh(reserva.localizador);
    }, []);

    // Verificación de sesión de pago (Stripe Success URL)
    const sessionIdParam = new URLSearchParams(window.location.search).get('session_id');
    usePaymentCheck({
        reservaId: reserva?.id,
        sessionId: sessionIdParam,
        onConfirmed: async () => {
            emitToast('Pago confirmado. Actualizando reserva...', 'success');
            await refresh();
            const params = new URLSearchParams(window.location.search);
            params.delete('session_id');
            const newUrl = window.location.pathname + (params.toString() ? ('?' + params.toString()) : '');
            window.history.replaceState({}, document.title, newUrl);
        },
    });



    return (
        <GuestLayout>
            <div className="min-h-screen bg-gris pb-24">
                <ReservaHeader
                    reserva={reserva}
                    isCancelled={isCancelled}
                    onOpenDateModal={openDateModal}
                />

                <main className="mx-auto mt-8 max-w-7xl px-4">
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">

                        {/* COLUMNA IZQUIERDA: DETALLES */}
                        <div className="space-y-6 lg:col-span-8">
                            <ReservaRooms
                                habitaciones={reserva?.habitaciones || []}
                                localizador={reserva?.localizador || ''}
                            />

                            <ReservaSummary reserva={reserva} />

                            <ReservaTransactions pagos={reserva?.pagos || []} reembolsos={reserva?.reembolsos || []} />

                            <ReservaInfo />
                        </div>

                        {/* COLUMNA DERECHA: SIDEBAR */}
                        <div className="lg:col-span-4">
                            <ReservaSidebar
                                reserva={reserva}
                                onOpenPayment={() => paymentModal.open(reserva?.pendiente_pago || 0)}
                                onOpenRefund={() => setShowRefundModal(true)}
                                isProcessing={isProcessing}
                            />
                        </div>

                    </div>
                </main>

                {/* MODALES */}
                <ModalFechas
                    mostrar={showDateModal}
                    modalCheckIn={modalCheckIn}
                    modalCheckOut={modalCheckOut}
                    setModalCheckIn={setModalCheckIn}
                    setModalCheckOut={setModalCheckOut}
                    isCheckedIn={isCheckedIn}
                    vistaPrevia={preview}
                    vistaPreviaCargada={vistaPreviaCargada}
                    cargandoVistaPrevia={previewLoading}
                    errorVistaPrevia={previewError}
                    onCerrar={() => setShowDateModal(false)}
                    onConfirmar={confirmDateModal}
                    procesando={isProcessing}
                    fetchPreview={fetchPreviewHook}
                />

                <ModalPago
                    mostrar={paymentModal.mostrar}
                    monto={paymentModal.monto}
                    onCerrar={paymentModal.close}
                    onPagoExitoso={paymentModal.onPagoExitoso}
                    onError={(e) => emitToast(e?.message, 'error')}
                    reservaData={{
                        reserva_id: reserva?.id,
                        es_edicion_pago: true,
                        check_in: modalCheckIn || reserva?.check_in,
                        check_out: modalCheckOut || reserva?.check_out,
                        habitaciones: reserva?.habitaciones || []
                    }}
                    aceptaTerminos={paymentModal.aceptaTerminos}
                    mostrarAceptacion={true}
                    onCambioAceptaTerminos={paymentModal.setAceptaTerminos}
                />

                <ModalReembolso
                    mostrar={showRefundModal}
                    monto={refundAmountInput}
                    setMonto={setRefundAmountInput}
                    motivosReembolso={motivosReembolso}
                    motivoReembolso={refundReason}
                    setMotivoReembolso={setRefundReason}
                    notasReembolso={refundNotes}
                    setNotasReembolso={setRefundNotes}
                    onCerrar={() => setShowRefundModal(false)}
                    onEnviar={handleRefundSubmit}
                    procesando={isProcessing}
                    maxReembolsable={reserva?.precio_total || 0}
                />
            </div>
        </GuestLayout>
    );
}
