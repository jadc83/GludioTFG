import { router } from '@inertiajs/react';
import { useCallback, useState } from 'react';
import { QRScannerService } from './qrScannerService';

/* Hook personalizado para manejar la lógica del escáner QR */
export function useQRScanner(action = null) {
    const [datosEscaner, setDatosEscaner] = useState(null);
    const [error, setError] = useState(null);
    const [asignarDetalles, setAsignarDetalles] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleScanSuccess = useCallback(
        async (decodedText) => {
            if (isProcessing) return; // Evitar múltiples procesamientos simultáneos

            setIsProcessing(true);
            setError(null);
            setAsignarDetalles(null);

            try {
                const localizador =
                    QRScannerService.extraerLocalizador(decodedText);
                if (!localizador) return;

                setDatosEscaner(localizador);

                const response = await QRScannerService.procesar(
                    localizador,
                    action,
                );
                const postAction = QRScannerService.postEscaneo(
                    action,
                    response,
                    response?.reserva,
                );

                if (postAction.type === 'redirect') {
                    router.visit(postAction.url);
                } else if (postAction.type === 'modal') {
                    // Adjuntar posibles asignaciones que vengan en la respuesta
                    const reservaAug = {
                        ...(response?.reserva || {}),
                        asignaciones:
                            response?.asignaciones ||
                            postAction?.asignaciones ||
                            null,
                    };

                    return {
                        type: 'modal',
                        tipoModal: postAction.tipoModal,
                        reservaInfo: reservaAug,
                    };
                }
            } catch (err) {
                setError(err.message || 'Error procesando la reserva');
                setAsignarDetalles(err.details || null);
            } finally {
                setIsProcessing(false);
            }
        },
        [action, isProcessing],
    );

    const clearError = useCallback(() => {
        setError(null);
        setAsignarDetalles(null);
    }, []);

    return {
        datosEscaner,
        error,
        asignarDetalles,
        isProcessing,
        handleScanSuccess,
        clearError,
    };
}
