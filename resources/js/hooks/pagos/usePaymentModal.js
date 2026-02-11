import { useCallback, useState } from 'react';

/**
 * usePaymentModal
 * - Orquestra la UI del modal de pago sin tocar el componente ModalPago
 * - Provee open(options), close(), and props para pasar al modal
 */
export default function usePaymentModal({ aplicarCambioFechas, refresh, showToast } = {}) {
    const [mostrar, setMostrar] = useState(false);
    const [monto, setMonto] = useState(0);
    const [pendienteAplicar, setPendienteAplicar] = useState(false);
    const [pendingMeta, setPendingMeta] = useState(null);
    const [aceptaTerminos, setAceptaTerminos] = useState(false);
    const [mostrarAceptacion, setMostrarAceptacion] = useState(false);
    const [procesando, setProcesando] = useState(false);

    const open = useCallback((montoArg = 0, { pendingApply = false, requireAcceptance = false, meta = null } = {}) => {
        setMonto(montoArg);
        setPendienteAplicar(Boolean(pendingApply));
        setPendingMeta(meta || null);
        setAceptaTerminosIfNeeded(requireAcceptance, Boolean(requireAcceptance));
        setMostrar(true);
    }, []);

    const setAceptaTerminosIfNeeded = useCallback((value, setValue) => {
        setMostrarAceptacion(Boolean(value));
        setAceptaTerminos(Boolean(setValue));
    }, []);

    const close = useCallback(() => {
        setMostrar(false);
    }, []);

    const onPagoExitoso = useCallback(async (paymentResult = {}) => {
        console.log('--- [usePaymentModal] onPagoExitoso called with:', paymentResult);
        setMostrar(false);
        if (!pendienteAplicar) return { success: false, reason: 'no_pending' };
        try {
            setProcesando(true);
            if (!aplicarCambioFechas) {
                showToast?.('Error al aplicar cambios tras el pago, consulte a recepción', 'error');
                return { success: false, message: 'aplicarCambioFechas missing' };
            }
            // Use pendingMeta if supplied (useful for applying date changes)
            const ci = pendingMeta?.check_in;
            const co = pendingMeta?.check_out;
            await aplicarCambioFechas(ci, co, paymentResult?.pago_id);
            showToast?.('Pago y actualizacion de reserva completados', 'success');
            setMostrar(false);
            await refresh?.();
            return { success: true };
        } catch (err) {
            showToast?.('Error al aplicar cambios tras el pago, consulte a recepción', 'error');
            return { success: false, err };
        } finally {
            setPendienteAplicar(false);
            setPendingMeta(null);
            setProcesando(false);
        }
    }, [aplicarCambioFechas, pendienteAplicar, refresh, showToast, pendingMeta]);

    return {
        mostrar,
        monto,
        pendienteAplicar,
        aceptaTerminos,
        mostrarAceptacion,
        procesando,
        open,
        close,
        onPagoExitoso,
        setAceptaTerminos: setAceptaTerminosIfNeeded,
    };
}
