import { useCallback, useMemo, useState, useEffect } from 'react';
import usePreview from '@/hooks/usePreview';
import usePaymentModal from '@/hooks/pagos/usePaymentModal';
import dayjs from 'dayjs';
import { emitToast } from '@/utils/toast';

export default function useDetalleReserva({ reserva, refresh, aplicarCambioFechas } = {}) {
    const [isProcessing, setIsProcessing] = useState(false);

    // Fecha modal
    const [showDateModal, setShowDateModal] = useState(false);
    const [modalCheckIn, setModalCheckIn] = useState('');
    const [modalCheckOut, setModalCheckOut] = useState('');

    // Reembolso
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState('change_to_cheaper');
    const [refundNotes, setRefundNotes] = useState('');
    const [refundAmountInput, setRefundAmountInput] = useState(0);

    const motivosReembolso = useMemo(() => [
        { value: 'billing_error', label: 'Error de facturación' },
        { value: 'change_to_cheaper', label: 'Cambio a habitación más barata' },
        { value: 'prefer_credit', label: 'Cliente prefiere crédito' },
        { value: 'other', label: 'Otra' },
    ], []);

    const {
        preview,
        loading: previewLoading,
        error: previewError,
        fetchPreview: fetchPreviewHook,
    } = usePreview(reserva?.localizador);

    // Track if preview corresponds to the current modal dates
    const [vistaPreviaCargada, setVistaPreviaCargada] = useState(false);

    const paymentModal = usePaymentModal({ aplicarCambioFechas, refresh, showToast: (m, t) => emitToast(m, t) });

    useEffect(() => {
        // when modal opens we want to reset loaded flag
        if (showDateModal) setVistaPreviaCargada(false);
    }, [showDateModal]);

    // Fetch preview when modal dates change and differ from original reserva dates
    useEffect(() => {
        let mounted = true;
        const originalCi = reserva?.check_in ? (new Date(reserva.check_in)).toISOString().split('T')[0] : null;
        const originalCo = reserva?.check_out ? (new Date(reserva.check_out)).toISOString().split('T')[0] : null;

        const esFechaOriginal = (ci, co) => ci === originalCi && co === originalCo;

        const tryFetch = async () => {
            if (!showDateModal) return;
            if (!modalCheckIn || !modalCheckOut) {
                setVistaPreviaCargada(false);
                return;
            }
            if (esFechaOriginal(modalCheckIn, modalCheckOut)) {
                setVistaPreviaCargada(false);
                return;
            }

            if (!fetchPreviewHook) return;
            setVistaPreviaCargada(false);
            try {
                await fetchPreviewHook(modalCheckIn, modalCheckOut);
                if (mounted) setVistaPreviaCargada(true);
            } catch (e) {
                if (mounted) setVistaPreviaCargada(false);
            }
        };

        tryFetch();
        return () => { mounted = false; };
    }, [showDateModal, modalCheckIn, modalCheckOut, fetchPreviewHook, reserva]);

    const openDateModal = useCallback(() => {
        setModalCheckIn(reserva?.check_in ? dayjs(reserva.check_in).format('YYYY-MM-DD') : '');
        setModalCheckOut(reserva?.check_out ? dayjs(reserva.check_out).format('YYYY-MM-DD') : '');
        setShowDateModal(true);
        if (reserva?.check_in && reserva?.check_out) fetchPreviewHook(reserva.check_in, reserva.check_out);
    }, [reserva, fetchPreviewHook]);

    const confirmDateModal = useCallback(async () => {
        try {
            setIsProcessing(true);
            const latestPreview = await fetchPreviewHook(modalCheckIn, modalCheckOut);

            if (latestPreview?.available === false) {
                emitToast('Sin disponibilidad para las nuevas fechas', 'error');
                return;
            }

            if (latestPreview?.estimate_charge > 0) {
                paymentModal.open(latestPreview.estimate_charge, {
                    pendingApply: true,
                    requireAcceptance: true,
                    meta: { check_in: modalCheckIn, check_out: modalCheckOut },
                });
                setShowDateModal(false);
                return;
            }

            await aplicarCambioFechas(modalCheckIn, modalCheckOut);
            emitToast('Cambio realizado correctamente', 'success');
            setShowDateModal(false);
            refresh();
        } catch (err) {
            emitToast('Error al actualizar las fechas', 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [modalCheckIn, modalCheckOut, fetchPreviewHook, paymentModal, aplicarCambioFechas, refresh]);

    const handleRefundSubmit = useCallback(async () => {
        setIsProcessing(true);
        try {
            const api = await import('@/api/reservas');
            const res = await api.crearSolicitudReembolso(reserva.localizador, {
                monto: refundAmountInput || 0,
                reason_code: refundReason,
                notes: refundNotes,
            });
            if (res.success) {
                emitToast('Solicitud enviada correctamente', 'success');
                setShowRefundModal(false);
                refresh();
            }
        } catch (e) {
            emitToast('Error al procesar solicitud', 'error');
        } finally {
            setIsProcessing(false);
        }
    }, [refundAmountInput, refundNotes, refundReason, reserva, refresh]);

    const isCancelled = useMemo(() => String(reserva?.status || '').toLowerCase().includes('cancelado'), [reserva]);
    const isCheckedIn = useMemo(() => String(reserva?.status || '').toLowerCase() === 'checked_in', [reserva]);

    return {
        // states
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

        // preview
        preview,
        previewLoading,
        previewError,
        fetchPreviewHook,
        vistaPreviaCargada,

        paymentModal,

        // actions
        openDateModal,
        confirmDateModal,
        handleRefundSubmit,

        isCancelled,
        isCheckedIn,
    };
}
