import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import * as reservasApi from '@/api/reservas';

export default function useEditarReserva({ reserva, setReserva, initialHabitacionesDisponibles = [], refresh, showToast, aplicarCambioFechas, obtenerPreview }) {
    const [habitacionesSeleccionadas, setHabitacionesSeleccionadas] = useState([]);
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState(initialHabitacionesDisponibles);
    const [guardandoHabitaciones, setGuardandoHabitaciones] = useState(false);
    const [enviandoSolicitudReembolso, setEnviandoSolicitudReembolso] = useState(false);

    // Reembolso: estado local para el modal de reembolso
    const [mostrarReembolso, setMostrarReembolso] = useState(false);
    const [motivoReembolso, setMotivoReembolso] = useState('change_to_cheaper');
    const [notasReembolso, setNotasReembolso] = useState('');
    const [montoReembolso, setMontoReembolso] = useState(null);

    const abrirReembolso = (monto = null) => {
        // Si no se pasa monto, asumimos reembolso total disponible de la reserva
        const disponible = (reserva?.precio_total ?? 0) - (reserva?.reembolsos_total ?? 0);
        let efectivo = monto;
        if (efectivo === null || efectivo === undefined || Number.isNaN(Number(efectivo))) {
            efectivo = Math.max(0, Number(disponible || 0));
        }
        setMontoReembolso(efectivo);
        setMostrarReembolso(true);
    };

    const cerrarReembolso = () => setMostrarReembolso(false);

    // Fecha / Pago flow
    const [mostrarModalFechas, setMostrarModalFechas] = useState(false);
    const [fechaModalCheckIn, setFechaModalCheckIn] = useState('');
    const [fechaModalCheckOut, setFechaModalCheckOut] = useState('');
    const [vistaPreviaCargada, setVistaPreviaCargada] = useState(false);
    const [mostrarModalPago, setMostrarModalPago] = useState(false);
    const [montoPago, setMontoPago] = useState(0);
    const [pendienteAplicarTrasPago, setPendienteAplicarTrasPago] = useState(false);
    const [aceptaTerminosPago, setAceptaTerminosPago] = useState(false);
    const [procesando, setProcesando] = useState(false);

    useEffect(() => {
        if (reserva?.habitaciones) {
            const currentPhysicalIds = reserva.habitaciones.map((h) => h.habitacion_id || null);
            setHabitacionesSeleccionadas(currentPhysicalIds);
        }
    }, [reserva]);

    useEffect(() => {
        if (initialHabitacionesDisponibles) {
            setHabitacionesDisponibles(initialHabitacionesDisponibles);
        }
    }, [initialHabitacionesDisponibles]);

    const desasignarHabitacion = async (habitacionId) => {
        setGuardandoHabitaciones(true);
        try {
            const data = await reservasApi.desasignarHabitaciones(reserva.id, [habitacionId]);
            if (data?.success && data.reserva) {
                setReserva(data.reserva);
                showToast?.('Habitación desasignada con éxito', 'success');
            } else {
                showToast?.(data?.error || 'Error al desasignar', 'error');
            }
        } catch (error) {
            showToast?.('Error al desasignar habitación', 'error');
        } finally {
            setGuardandoHabitaciones(false);
        }
    };

    // --- Fecha / Pago handlers ---
    const abrirModalFechas = () => {
        const ci = dayjs(reserva.check_in).format('YYYY-MM-DD');
        const co = dayjs(reserva.check_out).format('YYYY-MM-DD');
        setFechaModalCheckIn(ci);
        setFechaModalCheckOut(co);
        setVistaPreviaCargada(false);
        setMostrarModalFechas(true);
        // No obtener preview inmediatamente: sólo se calculará cuando el usuario cambie las fechas a nuevas
    };

    // Ejecutar preview sólo cuando las fechas del modal cambien respecto a las originales
    useEffect(() => {
        let mounted = true;
        const esFechaOriginal = (ci, co) => {
            const originalCi = reserva?.check_in ? dayjs(reserva.check_in).format('YYYY-MM-DD') : null;
            const originalCo = reserva?.check_out ? dayjs(reserva.check_out).format('YYYY-MM-DD') : null;
            return ci === originalCi && co === originalCo;
        };

        const tryFetch = async () => {
            if (!mostrarModalFechas) return;
            if (!fechaModalCheckIn || !fechaModalCheckOut) {
                setVistaPreviaCargada(false);
                return;
            }
            if (esFechaOriginal(fechaModalCheckIn, fechaModalCheckOut)) {
                setVistaPreviaCargada(false);
                return;
            }

            if (!obtenerPreview) return;
            setVistaPreviaCargada(false);
            try {
                await obtenerPreview(fechaModalCheckIn, fechaModalCheckOut);
                if (mounted) setVistaPreviaCargada(true);
            } catch (e) {
                if (mounted) setVistaPreviaCargada(false);
            }
        };

        tryFetch();

        return () => {
            mounted = false;
        };
    }, [mostrarModalFechas, fechaModalCheckIn, fechaModalCheckOut, obtenerPreview, reserva]);

    const confirmarModalFechas = async () => {
        try {
            setProcesando(true);
            // obtener último preview
            let ultimoPreview = null;
            if (obtenerPreview) {
                ultimoPreview = await obtenerPreview(fechaModalCheckIn, fechaModalCheckOut);
            } else {
                ultimoPreview = await reservasApi.previewModificarEstancia(reserva.localizador, { check_in: fechaModalCheckIn, check_out: fechaModalCheckOut });
            }

            if (ultimoPreview?.available === false) {
                showToast?.('No hay disponibilidad para esas fechas', 'error');
                return { success: false, reason: 'no_availability' };
            }

            if (ultimoPreview?.estimate_charge > 0) {
                // Si la reserva ya está pagada, abrir modal de pago; si no, aplicar el cambio sin modal (sumar al total)
                if (reserva?.pago === 'pagado') {
                    setMontoPago(ultimoPreview.estimate_charge);
                    setPendienteAplicarTrasPago(true);
                    setMostrarModalPago(true);
                    return { success: true, pendingPayment: true };
                }

                // No está pagada: aplicar el cambio directamente (no abrir modal de pago)
                if (aplicarCambioFechas) {
                    const res = await aplicarCambioFechas(fechaModalCheckIn, fechaModalCheckOut);
                    showToast?.(res?.message || 'Fechas actualizadas (importe añadido al total)', 'success');
                    setMostrarModalFechas(false);
                    refresh?.();
                    return { success: true, res };
                }
            }

            // Aplicar cambio de fechas inmediatamente (reducción o sin cargo)
            if (aplicarCambioFechas) {
                const res = await aplicarCambioFechas(fechaModalCheckIn, fechaModalCheckOut);
                showToast?.(res?.message || 'Fechas actualizadas', 'success');
                setMostrarModalFechas(false);
                refresh?.();
                return { success: true, res };
            }

            return { success: false, message: 'aplicarCambioFechas missing' };
        } catch (err) {
            showToast?.(err?.message || 'Error al cambiar fechas', 'error');
            return { success: false, err };
        } finally {
            setProcesando(false);
        }
    };

    const pagoExitoso = async (paymentResult) => {
        setMostrarModalPago(false);
        if (!pendienteAplicarTrasPago) return { success: false, reason: 'no_pending' };
        try {
            setProcesando(true);
            if (!aplicarCambioFechas) return { success: false, message: 'aplicarCambioFechas missing' };
            await aplicarCambioFechas(fechaModalCheckIn, fechaModalCheckOut, paymentResult?.pago_id);
            showToast?.('Cambio aplicado tras pago.', 'success');
            setMostrarModalFechas(false);
            refresh?.();
            return { success: true };
        } catch (err) {
            showToast?.('Error al aplicar cambios tras el pago', 'error');
            return { success: false, err };
        } finally {
            setPendienteAplicarTrasPago(false);
            setProcesando(false);
        }
    };
    const actualizarHabitaciones = async () => {
        setGuardandoHabitaciones(true);
        try {
            const habitacionIds = [...habitacionesSeleccionadas];
            const data = await reservasApi.asignarHabitaciones(reserva.id, habitacionIds);
            if (data?.success && data.reserva) {
                setReserva(data.reserva);
                setHabitacionesSeleccionadas(data.reserva.habitaciones.map((h) => h.habitacion_id));
                showToast?.('Habitaciones actualizadas con éxito', 'success');
            } else {
                showToast?.(data?.error || 'Error al actualizar', 'error');
            }
        } catch (error) {
            showToast?.('Error al actualizar habitaciones', 'error');
        } finally {
            setGuardandoHabitaciones(false);
        }
    };

    const enviarSolicitudReembolso = async (payload) => {
        setEnviandoSolicitudReembolso(true);
        try {
            const res = await reservasApi.crearSolicitudReembolso(reserva.localizador, payload);
            if (res?.success) {
                showToast?.('Solicitud enviada correctamente', 'success');
                refresh?.();
                return { success: true, res };
            }
            return { success: false, res };
        } catch (err) {
            showToast?.('Error al procesar reembolso', 'error');
            return { success: false, err };
        } finally {
            setEnviandoSolicitudReembolso(false);
        }
    };

    return {
        // habitaciones
        habitacionesSeleccionadas,
        setHabitacionesSeleccionadas,
        habitacionesDisponibles,
        setHabitacionesDisponibles,
        guardandoHabitaciones,
        desasignarHabitacion,
        actualizarHabitaciones,

        // reembolsos
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
        setMontoReembolso,

        // fechas / pago (en castellano)
        mostrarModalFechas,
        setMostrarModalFechas,
        fechaModalCheckIn,
        setFechaModalCheckIn,
        fechaModalCheckOut,
        setFechaModalCheckOut,        vistaPreviaCargada,        mostrarModalPago,
        setMostrarModalPago,
        montoPago,
        setMontoPago,
        pendienteAplicarTrasPago,
        setPendienteAplicarTrasPago,
        aceptaTerminosPago,
        setAceptaTerminosPago,
        procesando,
        abrirModalFechas,
        confirmarModalFechas,
        pagoExitoso,
    };
}
