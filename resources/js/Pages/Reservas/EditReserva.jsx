import useReserva from '@/hooks/reservas/useReserva';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import usePreview from '@/hooks/usePreview';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { emitToast } from '@/utils/toast';
import { useEffect, useState } from 'react';
import useEditarReserva from '@/hooks/reservas/useEditarReserva';
import AssignedHabitaciones from '@/Components/reservas/pms/AssignedHabitaciones';
import AsignacionHabitaciones from '@/Components/reservas/pms/AsignacionHabitaciones';
import ReservaInfo from '@/Components/reservas/comunes/ReservaInfo';
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
        clearPreview: clearPreviewHook,
    } = usePreview(reserva.localizador);

    const preview = pFromHook;
    const previewLoading = pLoadingHook;
    const previewError = pErrorHook;

    const [originalPrecioBackup, setOriginalPrecioBackup] = useState(null);

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

    } = useEditarReserva({ reserva, setReserva, initialHabitacionesDisponibles: habitaciones || [], refresh, showToast, aplicarCambioFechas: aplicarCambioFechas, obtenerPreview: fetchPreviewHook, clearPreview: clearPreviewHook });

    useEffect(() => {
        if (hookHabitacionesDisponibles) {
            const _ = hookHabitacionesDisponibles;
        }
    }, [hookHabitacionesDisponibles]);

    const isCancelled = reserva.status?.toLowerCase().includes('cancelado');
    const isCheckedIn = reserva.status?.toLowerCase() === 'checked_in';
    const isCheckedOut = reserva.status?.toLowerCase() === 'checked_out';

    const page = usePage();
    const viewer = page.props.auth.user || {};
    const viewerIsAdmin = !!viewer.is_admin;
    const viewerIsRecepcion = !!viewer.is_recepcion;

    useEffect(() => {
        if (!preview && originalPrecioBackup !== null) {
            // restore original price
            setReserva((r) => ({ ...r, precio_total: Number(originalPrecioBackup) }));
            setOriginalPrecioBackup(null);
        }
    }, [preview, originalPrecioBackup, setReserva]);

    const refundAmount = (Number(reserva.precio_total ?? 0) + Number(preview?.estimate_charge ?? 0) - Number(preview?.estimate_refund ?? 0)) - reserva.reembolsos_total;

    return (
        <AuthenticatedLayout>
            <div className="min-h-screen bg-gradient-to-br from-white to-gray-50 text-gray-900 font-sans overflow-hidden relative pb-24">

                {/* BACKGROUND DINÁMICO: Imagen de Hotel con Overlay (copiado de CheckoutSimulada) */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent z-10" />
                    <div className="absolute inset-0 bg-[#7a0202]/6 z-10 mix-blend-multiply" />
                    <img
                        src="https://images.unsplash.com/photo-1505691723518-36a6cc7ec9b0?q=80&w=2070&auto=format&fit=crop"
                        className="w-full h-full object-cover opacity-12 scale-110 animate-slow-zoom"
                        alt="Hotel Background"
                    />
                </div>

                <style dangerouslySetInnerHTML={{ __html: `
                    @keyframes slow-zoom {
                        0% { transform: scale(1); }
                        100% { transform: scale(1.1); }
                    }
                    .animate-slow-zoom { animation: slow-zoom 20s infinite alternate ease-in-out; }
                `}} />

                <div className="relative z-20">
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
                            clearPreview={clearPreviewHook}
                            onRequestConfirmDates={(ci, co) => {
                                setFechaModalCheckIn(ci);
                                setFechaModalCheckOut(co);
                                setMostrarModalFechas(true);
                            }}
                        />
                    </div>

                    <main className="mx-auto mt-8 max-w-7xl px-4">
                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                            <div className="space-y-6 lg:col-span-8">
                                <ReservaInfo reserva={reserva} />

                                <AssignedHabitaciones
                                    habitaciones={reserva.habitaciones}
                                    onDesasignar={desasignarHabitacion}
                                    guardando={guardandoHabitaciones}
                                    reserva={reserva}
                                />

                                {(viewerIsAdmin || viewerIsRecepcion) && !isCheckedIn && !isCheckedOut && (
                                    <AsignacionHabitaciones
                                        reserva={reserva}
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
                                reserva={
                                    preview
                                        ? { ...reserva, precio_total: Number(reserva.precio_total ?? 0) + Number(preview.estimate_charge ?? 0) - Number(preview?.estimate_refund ?? 0) }
                                        : reserva
                                }
                                estaCancelada={isCancelled}
                                onSolicitarReembolso={() => abrirReembolso((Number(reserva.precio_total ?? 0) + Number(preview?.estimate_charge ?? 0) - Number(preview?.estimate_refund ?? 0)) - reserva.reembolsos_total)}
                            />
                        </div>
                    </main>
                </div>

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
                        clearPreview={clearPreviewHook}
                        onCerrar={() => setMostrarModalFechas(false)}
                    onConfirmar={confirmarModalFechas}
                    onApplied={(resData) => {
                        // Close modal and update reserva in memory.
                        // Backup original precio_total before overriding so we can restore if preview disappears
                        setMostrarModalFechas(false);
                        try {
                            const currentPrecio = Number(reserva.precio_total ?? 0);
                            if (originalPrecioBackup === null) setOriginalPrecioBackup(currentPrecio);
                        } catch (e) {}

                        if (resData && resData.reserva) {
                            // Set immediately to server-returned reserva to reflect persisted changes
                            setReserva(resData.reserva);
                            try {
                                clearPreviewHook();
                            } catch (e) {}
                        } else if (preview && preview.nuevo_total !== undefined) {
                            // override local reserva precio_total to match preview while we refresh
                            setReserva((r) => ({ ...r, precio_total: Number(preview.nuevo_total) }));
                        }

                        (async () => {
                            try {
                                await refresh();
                                // refresh succeeded, clear backup
                                setOriginalPrecioBackup(null);
                            } catch (e) {
                                // fallback: setReserva if resData contains reserva
                                if (resData && resData.reserva) setReserva(resData.reserva);
                            }
                        })();
                    }}
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

// Restore original price if preview disappears
// (keeps UI consistent when user reverts to original dates)
// Note: this effect runs in the component scope using the preview and backup state
// so it should be defined inside the component. We add it below export to keep file edits minimal.
