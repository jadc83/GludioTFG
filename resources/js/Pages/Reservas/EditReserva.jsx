import ModalFechasContainer from '@/Components/reservas/comunes/ModalFechasContainer';
import ModalPago from '@/Components/reservas/comunes/ModalPago';
import ModalReembolso from '@/Components/reservas/comunes/ModalReembolso';
import ReservaInfo from '@/Components/reservas/comunes/ReservaInfo';
import FechasPanel from '@/Components/reservas/FechasPanel';
import ReservaFondo from '@/Components/reservas/ReservaFondo';
import AsignacionHabitaciones from '@/Components/reservas/pms/AsignacionHabitaciones';
import AssignedHabitaciones from '@/Components/reservas/pms/AssignedHabitaciones';
import useEditarReserva from '@/hooks/reservas/useEditarReserva';
import useReserva from '@/hooks/reservas/useReserva';
import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import usePreview from '@/hooks/usePreview';
import { t } from '@/i18n';
import GuestLayout from '@/Layouts/GuestLayout';
import { emitToast } from '@/utils/toast';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function EditarReserva({
    reserva: initialReserva,
    habitaciones = [],
}) {
    const { reserva, setReserva, refresh, aplicarCambioFechas } =
        useReserva(initialReserva);
    // Logs de depuración eliminados

    const motivosReembolso = [
        {
            value: 'billing_error',
            label: t('edit_reserva.refund_reasons.billing_error'),
        },
        {
            value: 'change_to_cheaper',
            label: t('edit_reserva.refund_reasons.change_to_cheaper'),
        },
        {
            value: 'prefer_credit',
            label: t('edit_reserva.refund_reasons.prefer_credit'),
        },
        { value: 'other', label: t('edit_reserva.refund_reasons.other') },
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
    const [showFechaEditor, setShowFechaEditor] = useState(false);

    useReservaEvents(reserva, {
        onRefresh: refresh,
        onUpdated: setReserva,
        suppressToast: true,
    });

    const showToast = (message, type = 'info') => {
        emitToast(message, type);
    };

    const {
        habitacionesSeleccionadas,
        setHabitacionesSeleccionadas,
        habitacionesDisponibles: hookHabitacionesDisponibles,
        guardandoHabitaciones,
        desasignarHabitacion,
        actualizarHabitaciones,

        enviarSolicitudReembolso,
        enviandoSolicitudReembolso,
        mostrarReembolso,
        abrirReembolso,
        cerrarReembolso,
        motivoReembolso,
        setMotivoReembolso,
        notasReembolso,
        setNotasReembolso,
        montoReembolso,

        confirmarModalFechas,
        mostrarModalFechas,
        setMostrarModalFechas,
        fechaModalCheckIn,
        setFechaModalCheckIn,
        fechaModalCheckOut,
        setFechaModalCheckOut,
        vistaPreviaCargada,

        mostrarModalPago,
        setMostrarModalPago,
        montoPago,
        aceptaTerminosPago,
        setAceptaTerminosPago,
        isProcessing,
        pagoExitoso,
    } = useEditarReserva({
        reserva,
        setReserva,
        initialHabitacionesDisponibles: habitaciones || [],
        refresh,
        showToast,
        aplicarCambioFechas: aplicarCambioFechas,
        obtenerPreview: fetchPreviewHook,
        clearPreview: clearPreviewHook,
    });

    // Estado local para reflejar que el usuario ya ha solicitado un reembolso
    const [reembolsoSolicitado, setReembolsoSolicitado] = useState(false);

    // Seguimiento temporal del estado del editor de fechas (sin logs)

    // Fallback listener: if FechaEditor dispatches a fallback event, open modal here
    useEffect(() => {
        const handler = (e) => {
            const d = e && e.detail ? e.detail : {};
            if (d.checkIn) setFechaModalCheckIn(d.checkIn);
            if (d.checkOut) setFechaModalCheckOut(d.checkOut);
            setMostrarModalFechas(true);
        };
        window.addEventListener('showModalFechasFallback', handler);
        return () =>
            window.removeEventListener('showModalFechasFallback', handler);
    }, [setFechaModalCheckIn, setFechaModalCheckOut, setMostrarModalFechas]);

    const isCheckedIn = reserva.status?.toLowerCase() === 'checked_in';
    const isCheckedOut = reserva.status?.toLowerCase() === 'checked_out';

    const page = usePage();
    const viewer = page.props.auth.user || {};
    const viewerRoles = Array.isArray(viewer.roles) ? viewer.roles : [];
    const viewerDept = (viewer.empleado_departamento || '').toLowerCase();
    const viewerIsAdmin = viewerRoles.includes('admin') || viewerRoles.includes('super-admin') || !!viewer.is_admin;
    const viewerHasRoleEncargado = viewerRoles.includes('encargado');
    const viewerHasRoleOperario = viewerRoles.includes('operario');
    const viewerIsReceptionStaff = viewerDept === 'recepcion' && (viewerHasRoleEncargado || viewerHasRoleOperario);

    useEffect(() => {
        if (!preview && originalPrecioBackup !== null) {
            // restore original price
            setReserva((r) => ({
                ...r,
                precio_total: Number(originalPrecioBackup),
            }));
            setOriginalPrecioBackup(null);
        }
    }, [preview, originalPrecioBackup, setReserva]);

    const totalToCharge = preview
        ? Number(reserva.precio_total ?? 0) +
          Number(preview?.estimate_charge ?? 0) -
          Number(preview?.estimate_refund ?? 0)
        : Number(reserva.precio_total ?? 0);

    return (
        <GuestLayout>
            <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-white to-gray-50 pb-24 font-sans text-gray-900">
                <ReservaFondo />

                <div className="relative z-20">
                    <main className="mx-auto mt-8 max-w-7xl px-4">
                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                            {/* ReservaInfo: ocupar todo el ancho del grid (alineado con FechaEditor) */}
                            <div className="col-span-12">
                                <ReservaInfo
                                    reserva={reserva}
                                    total={totalToCharge}
                                    preview={preview}
                                    refundRequested={
                                        reembolsoSolicitado ||
                                        (Array.isArray(
                                            reserva?.refundRequests,
                                        ) &&
                                            reserva.refundRequests.some(
                                                (r) =>
                                                    String(
                                                        r.status || '',
                                                    ).toLowerCase() ===
                                                    'pending',
                                            ))
                                    }
                                    onSolicitarReembolso={() =>
                                        abrirReembolso(
                                            Number(reserva.precio_total ?? 0) +
                                                Number(
                                                    preview?.estimate_charge ??
                                                        0,
                                                ) -
                                                Number(
                                                    preview?.estimate_refund ??
                                                        0,
                                                ) -
                                                reserva.reembolsos_total,
                                        )
                                    }
                                />
                            </div>

                            {/* Contenido principal debajo del resumen: habitaciones a ancho completo */}
                            <div className="col-span-12">
                                {(viewerIsAdmin || viewerIsReceptionStaff || (viewerRoles.length === 0 && !viewerDept)) && (
                                    <AssignedHabitaciones
                                        habitaciones={reserva.habitaciones}
                                        onDesasignar={desasignarHabitacion}
                                        guardando={guardandoHabitaciones}
                                        reserva={reserva}
                                        viewerCanManageRooms={viewerIsAdmin || viewerIsReceptionStaff}
                                    />
                                )}
                            </div>

                            <div className="col-span-12 mt-4">
                                <FechasPanel
                                    reserva={reserva}
                                    showFechaEditor={showFechaEditor}
                                    setShowFechaEditor={setShowFechaEditor}
                                    vistaPrevia={preview}
                                    previewLoading={previewLoading}
                                    previewError={previewError}
                                    fetchPreview={fetchPreviewHook}
                                    clearPreview={clearPreviewHook}
                                    setFechaModalCheckIn={setFechaModalCheckIn}
                                    setFechaModalCheckOut={setFechaModalCheckOut}
                                    setMostrarModalFechas={setMostrarModalFechas}
                                    confirmarModalFechas={confirmarModalFechas}
                                    vistaPreviaCargada={vistaPreviaCargada}
                                    refresh={refresh}
                                />
                            </div>

                            {(viewerIsAdmin || viewerIsReceptionStaff) &&
                                !isCheckedIn &&
                                !isCheckedOut && (
                                    <div className="col-span-12">
                                        <AsignacionHabitaciones
                                            reserva={reserva}
                                            reservaSlots={reserva.habitaciones}
                                            habitacionesDisponibles={
                                                hookHabitacionesDisponibles
                                            }
                                            habitacionesSeleccionadas={
                                                habitacionesSeleccionadas
                                            }
                                            setHabitacionesSeleccionadas={
                                                setHabitacionesSeleccionadas
                                            }
                                            onDesasignar={desasignarHabitacion}
                                            onGuardar={actualizarHabitaciones}
                                            guardando={guardandoHabitaciones}
                                        />
                                    </div>
                                )}

                            {/* Mantener la columna derecha (sidebar) alineada en su propia fila */}
                            <div className="lg:col-span-8" />
                        </div>
                    </main>
                </div>

                <ModalFechasContainer
                    mostrar={mostrarModalFechas}
                    setMostrar={setMostrarModalFechas}
                    reserva={reserva}
                    fechaCheckIn={fechaModalCheckIn}
                    fechaCheckOut={fechaModalCheckOut}
                    setFechaCheckIn={setFechaModalCheckIn}
                    setFechaCheckOut={setFechaModalCheckOut}
                    preview={preview}
                    previewLoading={previewLoading}
                    previewError={previewError}
                    previewLoaded={vistaPreviaCargada}
                    clearPreview={clearPreviewHook}
                    refresh={refresh}
                    setReserva={setReserva}
                    originalPrecioBackup={originalPrecioBackup}
                    setOriginalPrecioBackup={setOriginalPrecioBackup}
                    confirmarModalFechas={confirmarModalFechas}
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
                        if (res?.success) {
                            try {
                                setReembolsoSolicitado(true);
                            } catch (e) {
                                // removed debug log
                            }
                            cerrarReembolso();
                        }
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
                    mostrarAceptacion={false}
                    onCambioAceptaTerminos={setAceptaTerminosPago}
                />
            </div>
        </GuestLayout>
    );
}
