import * as reservasApi from '@/api/reservas';
import usePaymentCheck from '@/hooks/pagos/usePaymentCheck';
import usePaymentModal from '@/hooks/pagos/usePaymentModal';
import axios from 'axios';
import * as reservasService from '@/hooks/reservas/service';
import dayjs from 'dayjs';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useEditarReserva({
    reserva,
    setReserva,
    initialHabitacionesDisponibles = [],
    refresh,
    showToast,
    aplicarCambioFechas,
    obtenerPreview,
    clearPreview = null,
}) {
    const [habitacionesSeleccionadas, setHabitacionesSeleccionadas] = useState(
        [],
    );
    const [habitacionesDisponibles, setHabitacionesDisponibles] = useState(
        initialHabitacionesDisponibles,
    );
    const loadedAvailRef = useRef(false);
    const [guardandoHabitaciones, setGuardandoHabitaciones] = useState(false);
    const [enviandoSolicitudReembolso, setEnviandoSolicitudReembolso] =
        useState(false);

    // Reembolso: estado local para el modal de reembolso
    const [mostrarReembolso, setMostrarReembolso] = useState(false);
    const [motivoReembolso, setMotivoReembolso] = useState('change_to_cheaper');
    const [notasReembolso, setNotasReembolso] = useState('');
    const [montoReembolso, setMontoReembolso] = useState(null);

    const abrirReembolso = (monto = null) => {
        // Si no se pasa monto, asumimos reembolso total disponible de la reserva
        const disponible =
            (reserva?.precio_total ?? 0) - (reserva?.reembolsos_total ?? 0);
        let efectivo = monto;
        if (
            efectivo === null ||
            efectivo === undefined ||
            Number.isNaN(Number(efectivo))
        ) {
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

    // Reuse `usePaymentModal` to orchestrate payment modal behavior and keep the public API
    const paymentModal = usePaymentModal({
        aplicarCambioFechas,
        refresh,
        showToast,
    });

    const mostrarModalPago = paymentModal.mostrar;
    const setMostrarModalPago = (val) => {
        if (val)
            paymentModal.open(paymentModal.monto, {
                pendingApply: paymentModal.pendienteAplicar,
            });
        else paymentModal.close();
    };
    const montoPago = paymentModal.monto;
    const setMontoPago = (v) =>
        paymentModal.open(v, { pendingApply: paymentModal.pendienteAplicar });
    const pendienteAplicarTrasPago = paymentModal.pendienteAplicar;
    const aceptaTerminosPago = paymentModal.aceptaTerminos;
    const setAceptaTerminosPago = (v) => paymentModal.setAceptaTerminos(v);
    // Local processing state for date-change operations (separate from payment modal processing)
    // Unified name: use `isProcessing` across hooks/components for consistency
    const [isProcessing, setIsProcessing] = useState(false);

    const cargarHabitacionesDisponibles = useCallback(async () => {
        try {
            const data = await reservasService.obtenerHabitacionesDisponibles(reserva.check_in, reserva.check_out);
            // The service may return data in several shapes; normalize like before
            let habitaciones = [];
            if (data) {
                if (Array.isArray(data) && data.length > 0 && (data[0].habitaciones || data[0].id)) {
                    if (data[0].habitaciones) {
                        habitaciones = data.flatMap((grupo) => grupo.habitaciones || []);
                    } else {
                        habitaciones = data;
                    }
                } else {
                    habitaciones = Array.isArray(data) ? data.flatMap((grupo) => grupo.habitaciones || []) : [];
                }
            }
            setHabitacionesDisponibles(habitaciones);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Error cargando habitaciones disponibles:', error);
        }
    }, [reserva?.check_in, reserva?.check_out]);

    // debug logs removed

    useEffect(() => {
        // Update selected rooms only if the id list actually changed to avoid
        // repeated setState causing maximum update depth.
        if (!Array.isArray(reserva?.habitaciones)) return;
        const newIds = reserva.habitaciones.map((h) => h.habitacion_id || null);
        setHabitacionesSeleccionadas((prev) => {
            if (
                prev.length === newIds.length &&
                prev.every((v, i) => v === newIds[i])
            ) {
                return prev;
            }
            return newIds;
        });
    }, [reserva?.habitaciones]);

    useEffect(() => {
        // Avoid resetting `habitacionesDisponibles` on every render when
        // `initialHabitacionesDisponibles` is a new array reference but
        // contains the same content. Do a shallow compare by id and length.
        try {
            if (
                Array.isArray(initialHabitacionesDisponibles) &&
                initialHabitacionesDisponibles.length > 0
            ) {
                const prev = habitacionesDisponibles || [];
                const prevIds = prev
                    .map((h) => h.id ?? h.habitacion_id ?? '')
                    .join(',');
                const newIds = initialHabitacionesDisponibles
                    .map((h) => h.id ?? h.habitacion_id ?? '')
                    .join(',');
                if (prevIds !== newIds) {
                    // Nota: actualizando disponibilidad por cambio de referencia
                    setHabitacionesDisponibles(initialHabitacionesDisponibles);
                }
                loadedAvailRef.current = true;
            } else {
                // Si no hay iniciales, cargar dinámicamente sólo una vez
                if (!loadedAvailRef.current) {
                    // Nota: cargando habitaciones disponibles inicialmente
                    cargarHabitacionesDisponibles();
                    loadedAvailRef.current = true;
                } else {
                    // Nota: disponibilidad ya inicializada
                }
            }
        } catch (e) {
            // Fallback: set directly if anything unexpected

            setHabitacionesDisponibles(initialHabitacionesDisponibles || []);
        }
    }, [
        initialHabitacionesDisponibles,
        cargarHabitacionesDisponibles,
        habitacionesDisponibles,
    ]);

    // (Implementation moved above and memoized with useCallback)

    const desasignarHabitacion = async (habitacionId) => {
        // Prevent concurrent desasignaciones
        if (guardandoHabitaciones) {
            showToast?.('Operación en curso, espera...', 'info');
            return;
        }

        // Resolve habitacion_id from the parameter which may be a habitacion_id or a slot_id (or string)
        let resolvedHabitacionId = null;
        const parsedParam =
            typeof habitacionId === 'string' || typeof habitacionId === 'number'
                ? Number(habitacionId)
                : habitacionId;
        const hrList = Array.isArray(reserva?.habitaciones)
            ? reserva.habitaciones
            : [];

        // If the passed value directly matches an existing habitacion_id, use it
        const directMatch = hrList.find(
            (h) => Number(h.habitacion_id) === parsedParam,
        );
        if (directMatch)
            resolvedHabitacionId = Number(directMatch.habitacion_id);

        // Otherwise try to find a slot with slot_id equal to the passed param and use its habitacion_id
        if (!resolvedHabitacionId) {
            const slotMatch = hrList.find(
                (h) =>
                    Number(h.slot_id) === parsedParam ||
                    Number(h.id) === parsedParam,
            );
            if (slotMatch && slotMatch.habitacion_id)
                resolvedHabitacionId = Number(slotMatch.habitacion_id);
        }

        // As a last resort, if the caller passed a non-numeric falsy value, try to find any non-null habitacion_id for the same slot index
        if (!resolvedHabitacionId && !Number.isFinite(parsedParam)) {
            const anyAssigned = hrList.find((h) => h && h.habitacion_id);
            if (anyAssigned)
                resolvedHabitacionId = Number(anyAssigned.habitacion_id);
        }

        if (!resolvedHabitacionId) {
            showToast?.('ID de habitación inválida', 'error');
            return;
        }

        setGuardandoHabitaciones(true);
        try {
            // Nota: enviando petición para desasignar habitación
            const data = await reservasApi.desasignarHabitaciones(reserva.id, [
                resolvedHabitacionId,
            ]);
            if (data?.success && data.reserva) {
                setReserva(data.reserva);
                showToast?.('Habitación desasignada con éxito', 'success');
            } else {
                // mostrar detalle de error devuelto por la API si lo hay
                // eslint-disable-next-line no-console
                console.warn(
                    '[useEditarReserva] desasignarHabitacion api returned error',
                    data,
                );
                showToast?.(
                    data?.error || data?.message || 'Error al desasignar',
                    'error',
                );
            }
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error(
                '[useEditarReserva] desasignarHabitacion error',
                error,
            );
            // intentar mostrar el cuerpo de la respuesta si existe
            const apiErr =
                error?.response?.data ||
                error?.response ||
                error?.message ||
                String(error);

            if (apiErr && typeof apiErr === 'object') {
                showToast?.(
                    apiErr.error ||
                        apiErr.message ||
                        'Error al desasignar habitación',
                    'error',
                );
            } else {
                showToast?.(String(apiErr), 'error');
            }
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
            const originalCi = reserva?.check_in
                ? dayjs(reserva.check_in).format('YYYY-MM-DD')
                : null;
            const originalCo = reserva?.check_out
                ? dayjs(reserva.check_out).format('YYYY-MM-DD')
                : null;
            return ci === originalCi && co === originalCo;
        };

        const tryFetch = async () => {
            if (!mostrarModalFechas) return;
            if (!fechaModalCheckIn || !fechaModalCheckOut) {
                setVistaPreviaCargada(false);
                return;
            }
            if (esFechaOriginal(fechaModalCheckIn, fechaModalCheckOut)) {
                // If user reverted to the original dates, clear any preview to restore original total
                try {
                    if (clearPreview) clearPreview();
                } catch (e) {
                    // debug removed
                }
                setVistaPreviaCargada(false);
                return;
            }

            if (!obtenerPreview) return;
            setVistaPreviaCargada(false);
            try {
                await obtenerPreview(
                    fechaModalCheckIn,
                    fechaModalCheckOut,
                    reserva,
                );
                if (mounted) setVistaPreviaCargada(true);
            } catch (e) {
                if (mounted) setVistaPreviaCargada(false);
            }
        };

        tryFetch();

        return () => {
            mounted = false;
        };
        // Only depend on the modal flags, preview function and the original check-in/out values
    }, [
        mostrarModalFechas,
        fechaModalCheckIn,
        fechaModalCheckOut,
        obtenerPreview,
        reserva?.check_in,
        reserva?.check_out,
        clearPreview,
        reserva,
    ]);

    // Use centralized hybrid listener/polling for Checkout redirect + realtime update
    const sessionIdParam = new URLSearchParams(window.location.search).get(
        'session_id',
    );
    usePaymentCheck({
        reservaId: reserva.id,
        sessionId: sessionIdParam,
        onConfirmed: async (resp) => {
            showToast?.('Pago confirmado. Actualizando reserva...', 'success');
            try {
                // Prefer calling the payment modal handler directly to ensure
                // the modal is closed and aplicarCambioFechas is executed.
                if (paymentModal && typeof paymentModal.onPagoExitoso === 'function') {
                    const pagoId = resp?.pago_id || resp?.meta?.pago_id || resp?.pagoId || null;
                    const paymentIntentId = resp?.paymentIntentId || resp?.meta?.paymentIntentId || null;
                    // Only call modal handler if pendienteAplicar is true; otherwise just refresh
                    if (paymentModal.pendienteAplicar) {
                        try {
                            await paymentModal.onPagoExitoso({ pago_id: pagoId, paymentIntentId });
                        } catch (e) {
                            await refresh?.();
                        }
                    } else {
                        await refresh?.();
                    }
                } else {
                    await refresh?.();
                }
            } catch (err) {
                await refresh?.();
            }
            const params = new URLSearchParams(window.location.search);
            params.delete('session_id');
            const newUrl =
                window.location.pathname +
                (params.toString() ? '?' + params.toString() : '');
            window.history.replaceState({}, document.title, newUrl);
        },
    });

    const confirmarModalFechas = async () => {
        try {
            setIsProcessing(true);
            // obtener último preview
            let ultimoPreview = null;
            if (obtenerPreview) {
                ultimoPreview = await obtenerPreview(
                    fechaModalCheckIn,
                    fechaModalCheckOut,
                    reserva,
                );
            } else {
                ultimoPreview = await reservasApi.getDisponibles(
                    fechaModalCheckIn,
                    fechaModalCheckOut,
                    reserva?.id || reserva?.reserva_id || null,
                );
            }

            if (ultimoPreview?.available === false) {
                showToast?.('No hay disponibilidad para esas fechas', 'error');
                return { success: false, reason: 'no_availability' };
            }

            if (ultimoPreview?.estimate_charge > 0) {
                // Si la reserva ya está pagada, abrir modal de pago; si no, aplicar el cambio sin modal (sumar al total)
                if (reserva?.pago === 'pagado') {
                    paymentModal.open(ultimoPreview.estimate_charge, {
                        pendingApply: true,
                        requireAcceptance: true,
                        meta: {
                            check_in: fechaModalCheckIn,
                            check_out: fechaModalCheckOut,
                        },
                    });
                    return { success: true, pendingPayment: true };
                }

                // No está pagada: aplicar el cambio directamente (no abrir modal de pago)
                if (aplicarCambioFechas) {
                    const res = await aplicarCambioFechas(
                        fechaModalCheckIn,
                        fechaModalCheckOut,
                    );
                    showToast?.(
                        res?.message ||
                            'Fechas actualizadas (importe añadido al total)',
                        'success',
                    );
                    setMostrarModalFechas(false);
                    refresh?.();
                    return { success: true, res };
                }
            }

            // Aplicar cambio de fechas inmediatamente (reducción o sin cargo)
            if (aplicarCambioFechas) {
                const res = await aplicarCambioFechas(
                    fechaModalCheckIn,
                    fechaModalCheckOut,
                );
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
            setIsProcessing(false);
        }
    };

    const pagoExitoso = async (paymentResult) => {
        setMostrarModalPago(false);
        if (!pendienteAplicarTrasPago)
            return { success: false, reason: 'no_pending' };
        try {
            setIsProcessing(true);
            if (!aplicarCambioFechas)
                return {
                    success: false,
                    message: 'aplicarCambioFechas missing',
                };
            await aplicarCambioFechas(
                fechaModalCheckIn,
                fechaModalCheckOut,
                paymentResult?.pago_id,
            );
            showToast?.('Cambio aplicado tras pago.', 'success');
            setMostrarModalFechas(false);
            refresh?.();
            return { success: true };
        } catch (err) {
            showToast?.('Error al aplicar cambios tras el pago', 'error');
            return { success: false, err };
        } finally {
            setPendienteAplicarTrasPago(false);
            setIsProcessing(false);
        }
    };
    const actualizarHabitaciones = async () => {
        setGuardandoHabitaciones(true);
        try {
            // Ensure we send an array aligned with reservation slots: one entry per slot (null when empty)
            const slotsCount = Array.isArray(reserva?.habitaciones)
                ? reserva.habitaciones.length
                : habitacionesSeleccionadas.length;
            const habitacionIds = Array.from({ length: slotsCount }).map(
                (_, idx) =>
                    Array.isArray(habitacionesSeleccionadas)
                        ? (habitacionesSeleccionadas[idx] ?? null)
                        : null,
            );
            const data = await reservasApi.asignarHabitaciones(
                reserva.id,
                habitacionIds,
            );
            if (data?.success && data.reserva) {
                setReserva(data.reserva);
                setHabitacionesSeleccionadas(
                    data.reserva.habitaciones.map((h) => h.habitacion_id),
                );
                showToast?.('Habitaciones actualizadas con éxito', 'success');

                // Si requiere pago adicional, abrir modal de pago
                if (data.requiere_pago && data.monto_pago > 0) {
                    paymentModal.open(data.monto_pago, {
                        pendingApply: false,
                        requireAcceptance: true,
                        meta: { tipo: 'habitaciones' },
                    });
                }
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
            const res = await reservasApi.crearSolicitudReembolso(
                reserva.localizador,
                payload,
            );
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
        setFechaModalCheckOut,
        vistaPreviaCargada,
        mostrarModalPago,
        setMostrarModalPago,
        montoPago,
        setMontoPago,
        pendienteAplicarTrasPago,
        setPendienteAplicTrasPago: (v) =>
            paymentModal.open(paymentModal.monto, { pendingApply: v }),
        aceptaTerminosPago,
        setAceptaTerminosPago,
        isProcessing,
        abrirModalFechas,
        confirmarModalFechas,
        pagoExitoso: paymentModal.onPagoExitoso,
    };
}
