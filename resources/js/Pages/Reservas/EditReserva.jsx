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
import ModalReembolso from '@/Components/reservas/comunes/ModalReembolso';
import ModalPago from '@/Components/reservas/comunes/ModalPago';

export default function EditarReserva({
    reserva: initialReserva,
    habitaciones = [],
}) {
    const { reserva, setReserva, refresh, aplicarCambioFechas } =
        useReserva(initialReserva);
    useEffect(() => {
        try {
            // eslint-disable-next-line no-console
            console.log('reserva (debug):', reserva);
        } catch (e) {}
    }, [reserva]);
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
    const [showFechaEditor, setShowFechaEditor] = useState(false);

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

    // Estado local para reflejar que el usuario ya ha solicitado un reembolso
    const [reembolsoSolicitado, setReembolsoSolicitado] = useState(false);

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
    const totalToCharge = preview
        ? Number(reserva.precio_total ?? 0) + Number(preview?.estimate_charge ?? 0) - Number(preview?.estimate_refund ?? 0)
        : Number(reserva.precio_total ?? 0);

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




                    <main className="mx-auto mt-8 max-w-7xl px-4">
                        <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12">
                            {/* ReservaInfo: ocupar todo el ancho del grid (alineado con FechaEditor) */}
                            <div className="col-span-12">
                                <ReservaInfo
                                    reserva={reserva}
                                    total={totalToCharge}
                                    preview={preview}
                                    refundRequested={reembolsoSolicitado || (Array.isArray(reserva?.refundRequests) && reserva.refundRequests.some(r => String(r.status || '').toLowerCase() === 'pending'))}
                                    onSolicitarReembolso={() => abrirReembolso((Number(reserva.precio_total ?? 0) + Number(preview?.estimate_charge ?? 0) - Number(preview?.estimate_refund ?? 0)) - reserva.reembolsos_total)}
                                />
                            </div>

                                              {/* Contenido principal debajo del resumen: habitaciones a ancho completo */}
                            <div className="col-span-12">
                                <AssignedHabitaciones
                                    habitaciones={reserva.habitaciones}
                                    onDesasignar={desasignarHabitacion}
                                    guardando={guardandoHabitaciones}
                                    reserva={reserva}
                                    viewerIsAdmin={viewerIsAdmin}
                                />
                            </div>

                            <div className="col-span-12 mt-4">
                                <div className="w-full">
                                    <div className="w-full border rounded-lg bg-white overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setShowFechaEditor(s => !s)}
                                            aria-expanded={showFechaEditor}
                                            className="w-full flex items-center justify-between px-4 py-3 bg-[#7a0202] text-white hover:bg-[#5f0101]"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center justify-center w-9 h-9 rounded-md bg-black text-white">
                                                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M8 7V3M16 7V3M3 11h18M5 21h14a2 2 0 002-2V7H3v12a2 2 0 002 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    </svg>
                                                </div>
                                                <span className="font-medium">Necesito modificar las fechas de mi reserva</span>
                                            </div>
                                            <svg
                                                className={`w-5 h-5 text-white transform transition-transform duration-200 ${showFechaEditor ? 'rotate-180' : 'rotate-0'}`}
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                                aria-hidden="true"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>

                                        {showFechaEditor && (
                                            <div className="p-4">
                                                <FechaEditor
                                                    reserva={reserva}
                                                    setReserva={setReserva}
                                                    refresh={refresh}
                                                    vistaPrevia={preview}
                                                    cargandoVistaPrevia={previewLoading}
                                                    errorVistaPrevia={previewError}
                                                    obtenerPreview={fetchPreviewHook}
                                                    clearPreview={clearPreviewHook}
                                                    noWrapper={true}
                                                    onRequestConfirmDates={(ci, co) => {
                                                        setFechaModalCheckIn(ci);
                                                        setFechaModalCheckOut(co);
                                                        setMostrarModalFechas(true);
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>



                            {(viewerIsAdmin || viewerIsRecepcion) && !isCheckedIn && !isCheckedOut && (
                                <div className="col-span-12">
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
                                </div>
                            )}

                            {/* Mantener la columna derecha (sidebar) alineada en su propia fila */}
                            <div className="lg:col-span-8" />
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
                        setMostrarModalFechas(false);
                        try {
                            const currentPrecio = Number(reserva.precio_total ?? 0);
                            if (originalPrecioBackup === null) setOriginalPrecioBackup(currentPrecio);
                        } catch (e) {}

                        if (resData && resData.reserva) {
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
                        if (res?.success) {
                            try { setReembolsoSolicitado(true); } catch (e) {}
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
                    mostrarAceptacion={true}
                    onCambioAceptaTerminos={setAceptaTerminosPago}
                />

            </div>
        </AuthenticatedLayout>
    );
}

