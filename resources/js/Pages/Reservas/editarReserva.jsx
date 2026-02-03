import useReserva from '@/hooks/reservas/useReserva';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import usePreview from '@/hooks/usePreview';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { useEffect, useState } from 'react';
import useEditarReserva from '@/hooks/reservas/useEditarReserva';
import AssignedHabitaciones from '@/Pages/reservas/pms/AssignedHabitaciones';
import AsignacionHabitaciones from '@/Pages/reservas/pms/AsignacionHabitaciones';
import ModalFechas from '@/Pages/reservas/pms/ModalFechas';
import ReservaHeader from '@/Pages/reservas/pms/ReservaHeader';
import ReservaSidebar from '@/Pages/reservas/pms/ReservaSidebar';
import ModalReembolso from '@/Pages/reservas/pms/ModalReembolso';
import ModalPago from '@/Pages/reservas/pms/ModalPago';

export default function EditarReserva({
    reserva: initialReserva,
    habitaciones = [],
}) {
    const { reserva, setReserva, refresh, aplicarCambioFechas } =
        useReserva(initialReserva);
    const [isProcessing, setIsProcessing] = useState(false);
    const motivosReembolso = [
        { value: 'billing_error', label: 'Error de facturación' },
        { value: 'change_to_cheaper', label: 'Cambio a habitación más barata' },
        { value: 'prefer_credit', label: 'Cliente prefiere crédito' },
        { value: 'other', label: 'Otra' },
    ];
    const {
        preview: pFromHook,
        loading: pLoadingHook,
        error: pErrorHook,
        fetchPreview: fetchPreviewHook,
    } = usePreview(reserva.localizador);

    const preview = pFromHook;
    const previewLoading = pLoadingHook;
    const previewError = pErrorHook;

    useReservaEvents(reserva, { onRefresh: refresh });

    const showToast = (message, type = 'info') => {
        window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
    };

    const {

        habitacionesSeleccionadas, setHabitacionesSeleccionadas, habitacionesDisponibles: hookHabitacionesDisponibles, setHabitacionesDisponibles: setHookHabitacionesDisponibles,
        guardandoHabitaciones, desasignarHabitacion, actualizarHabitaciones,

        enviarSolicitudReembolso, enviandoSolicitudReembolso, mostrarReembolso, abrirReembolso, cerrarReembolso, motivoReembolso, setMotivoReembolso, notasReembolso,
        setNotasReembolso, montoReembolso, setMontoReembolso,

        abrirModalFechas, confirmarModalFechas, mostrarModalFechas, setMostrarModalFechas, fechaModalCheckIn, setFechaModalCheckIn, fechaModalCheckOut,
        setFechaModalCheckOut, vistaPreviaCargada,

        mostrarModalPago, setMostrarModalPago, montoPago, setMontoPago, pendienteAplicarTrasPago, setPendienteAplicTrasPago, aceptaTerminosPago,
        setAceptaTerminosPago, procesando, pagoExitoso

    } = useEditarReserva({ reserva, setReserva, initialHabitacionesDisponibles: habitaciones || [], refresh, showToast, aplicarCambioFechas: aplicarCambioFechas, obtenerPreview: fetchPreviewHook });

    useEffect(() => {
        if (hookHabitacionesDisponibles) {
            const _ = hookHabitacionesDisponibles;
        }
    }, [hookHabitacionesDisponibles]);

    const isCancelled = reserva.status?.toLowerCase().includes('cancelado');
    const isCheckedIn = reserva.status?.toLowerCase() === 'checked_in';

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 pb-24">
                <ReservaHeader reserva={reserva} isCancelled={isCancelled} onOpenDateModal={abrirModalFechas} />

                <main className="mx-auto mt-8 max-w-7xl px-4">
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        <div className="space-y-6 lg:col-span-8">
                            <AssignedHabitaciones
                                habitaciones={reserva.habitaciones}
                                onDesasignar={desasignarHabitacion}
                                guardando={guardandoHabitaciones}
                            />

                            <AsignacionHabitaciones
                                reservaSlots={reserva.habitaciones}
                                habitacionesDisponibles={hookHabitacionesDisponibles}
                                habitacionesSeleccionadas={habitacionesSeleccionadas}
                                setHabitacionesSeleccionadas={setHabitacionesSeleccionadas}
                                onDesasignar={desasignarHabitacion}
                                onGuardar={actualizarHabitaciones}
                                guardando={guardandoHabitaciones}
                            />

                        </div>

                        <ReservaSidebar
                            reserva={reserva}
                            estaCancelada={isCancelled}
                            onSolicitarReembolso={() => abrirReembolso(reserva.precio_total - reserva.reembolsos_total)}
                        />
                    </div>
                </main>

                <ModalFechas
                    mostrar={mostrarModalFechas}
                    modalCheckIn={fechaModalCheckIn}
                    modalCheckOut={fechaModalCheckOut}
                    setModalCheckIn={setFechaModalCheckIn}
                    setModalCheckOut={setFechaModalCheckOut}
                    isCheckedIn={isCheckedIn}
                    vistaPrevia={preview}
                    cargandoVistaPrevia={previewLoading}
                    errorVistaPrevia={previewError}
                    vistaPreviaCargada={vistaPreviaCargada}
                    onCerrar={() => setMostrarModalFechas(false)}
                    onConfirmar={confirmarModalFechas}
                    procesando={procesando}
                />

                <ModalReembolso
                    mostrar={mostrarReembolso}
                    monto={montoReembolso}
                    motivosReembolso={motivosReembolso}
                    motivoReembolso={motivoReembolso}
                    setMotivoReembolso={setMotivoReembolso}
                    notasReembolso={notasReembolso}
                    setNotasReembolso={setNotasReembolso}
                    onCerrar={cerrarReembolso}
                    onEnviar={async () => {
                        const payload = {
                            monto: montoReembolso,
                            reason_code: motivoReembolso,
                            notes: notasReembolso,
                        };
                        const res = await enviarSolicitudReembolso(payload);
                        if (res?.success) cerrarReembolso();
                    }}
                    procesando={enviandoSolicitudReembolso}
                />

                <ModalPago
                    mostrar={mostrarModalPago}
                    monto={montoPago}
                    onCerrar={() => setMostrarModalPago(false)}
                    onPagoExitoso={pagoExitoso}
                    onError={(e) => showToast(e?.message, 'error')}
                    reservaData={{
                        reserva_id: reserva.id,
                        es_edicion_pago: true,
                        check_in: fechaModalCheckIn || reserva.check_in,
                        check_out: fechaModalCheckOut || reserva.check_out,
                        habitaciones: reserva.habitaciones,
                    }}
                    aceptaTerminos={aceptaTerminosPago}
                    mostrarAceptacion={true}
                    onCambioAceptaTerminos={setAceptaTerminosPago}
                />

                {/* Toasts handled by shared `Toast` component in layout */}
            </div>
        </AuthenticatedLayout>
    );
}
