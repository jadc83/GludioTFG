import useReserva from '@/hooks/reservas/useReserva';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import usePreview from '@/hooks/usePreview';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { emitToast } from '@/utils/toast';
import { useEffect, useState } from 'react';
import useEditarReserva from '@/hooks/reservas/useEditarReserva';
import AssignedHabitaciones from '@/Components/reservas/pms/AssignedHabitaciones';
import AsignacionHabitaciones from '@/Components/reservas/pms/AsignacionHabitaciones';
import { usePage } from '@inertiajs/react';
import ModalFechas from '@/Components/reservas/comunes/ModalFechas';
import FechaEditor from '@/Components/reservas/FechaEditor';
import ReservaHeader from '@/Components/comunes/ReservaHeader';
import ReservaSidebar from '@/Components/reservas/comunes/ReservaSidebar';
import ModalReembolso from '@/Components/reservas/comunes/ModalReembolso';
import ModalPago from '@/Components/reservas/comunes/ModalPago';

export default function EditarReserva({
    reserva: initialReserva,
    habitaciones = [],
}) {
    const { reserva, setReserva, refresh, aplicarCambioFechas } =
        useReserva(initialReserva);
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

    useReservaEvents(reserva, { onRefresh: refresh, onUpdated: setReserva, suppressToast: true });

    const showToast = (message, type = 'info') => {
        emitToast(message, type);
    };

    const {

        habitacionesSeleccionadas, setHabitacionesSeleccionadas, habitacionesDisponibles: hookHabitacionesDisponibles, setHabitacionesDisponibles: setHookHabitacionesDisponibles,
        guardandoHabitaciones, desasignarHabitacion, actualizarHabitaciones,

        enviarSolicitudReembolso, enviandoSolicitudReembolso, mostrarReembolso, abrirReembolso, cerrarReembolso, motivoReembolso, setMotivoReembolso, notasReembolso,
        setNotasReembolso, montoReembolso, setMontoReembolso,

        abrirModalFechas, confirmarModalFechas, mostrarModalFechas, setMostrarModalFechas, fechaModalCheckIn, setFechaModalCheckIn, fechaModalCheckOut,
        setFechaModalCheckOut, vistaPreviaCargada,

        mostrarModalPago, setMostrarModalPago, montoPago, setMontoPago, pendienteAplicarTrasPago, setPendienteAplicTrasPago, aceptaTerminosPago,
        setAceptaTerminosPago, isProcessing, pagoExitoso

    } = useEditarReserva({ reserva, setReserva, initialHabitacionesDisponibles: habitaciones || [], refresh, showToast, aplicarCambioFechas: aplicarCambioFechas, obtenerPreview: fetchPreviewHook });

    useEffect(() => {
        if (hookHabitacionesDisponibles) {
            const _ = hookHabitacionesDisponibles;
        }
    }, [hookHabitacionesDisponibles]);

    const isCancelled = reserva.status?.toLowerCase().includes('cancelado');
    const isCheckedIn = reserva.status?.toLowerCase() === 'checked_in';

    const page = usePage();
    const viewer = page.props.auth.user || {};
    const viewerIsAdmin = !!viewer.is_admin;
    const viewerIsRecepcion = !!viewer.is_recepcion;

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gray-50 pb-24">
                <ReservaHeader reserva={reserva} isCancelled={isCancelled} onOpenDateModal={abrirModalFechas} />

                <div className="mx-auto mt-4 max-w-7xl px-4">
                    <FechaEditor
                        reserva={reserva}
                        setReserva={setReserva}
                        refresh={refresh}
                        vistaPrevia={preview}
                        cargandoVistaPrevia={previewLoading}
                        errorVistaPrevia={previewError}
                        obtenerPreview={fetchPreviewHook}
                    />
                </div>

                <main className="mx-auto mt-8 max-w-7xl px-4">
                    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                        <div className="space-y-6 lg:col-span-8">
                            <AssignedHabitaciones
                                habitaciones={reserva.habitaciones}
                                onDesasignar={desasignarHabitacion}
                                guardando={guardandoHabitaciones}
                            />

                            {(viewerIsAdmin || viewerIsRecepcion) && (
                                <AsignacionHabitaciones
                                    reservaSlots={reserva.habitaciones}
                                    habitacionesDisponibles={hookHabitacionesDisponibles}
                                    habitacionesSeleccionadas={habitacionesSeleccionadas}
                                    setHabitacionesSeleccionadas={setHabitacionesSeleccionadas}
                                    onDesasignar={desasignarHabitacion}
                                    onGuardar={actualizarHabitaciones}
                                    guardando={guardandoHabitaciones}
                                />
                            )}

                        </div>

                        <ReservaSidebar
                                    reserva={preview?.nuevo_total != null ? { ...reserva, precio_total: preview.nuevo_total } : reserva}
                                    estaCancelada={isCancelled}
                                    onSolicitarReembolso={() => abrirReembolso((preview?.nuevo_total ?? reserva.precio_total) - reserva.reembolsos_total)}
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
                    reserva={reserva}
                    onCerrar={() => setMostrarModalFechas(false)}
                    onConfirmar={confirmarModalFechas}
                    procesando={isProcessing}
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
