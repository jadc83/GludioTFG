import { useCallback, useState } from 'react';
import { router } from '@inertiajs/react';
import { QRScannerService } from './qrScannerService';

/**
 * Hook personalizado para manejar la lógica del escáner QR
 */
export function useQRScanner(action = null) {
    const [scannedData, setScannedData] = useState(null);
    const [error, setError] = useState(null);
    const [assignDetails, setAssignDetails] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleScanSuccess = useCallback(async (decodedText) => {
        if (isProcessing) return; // Evitar múltiples procesamientos simultáneos

        setIsProcessing(true);
        setError(null);
        setAssignDetails(null);

        try {
            // Extraer localizador del texto escaneado
            const localizador = QRScannerService.extractLocalizador(decodedText);
            if (!localizador) return;

            setScannedData(localizador);

            // Procesar el escaneo
            const response = await QRScannerService.processScan(localizador, action);

            // Determinar qué hacer después del escaneo
            const postAction = QRScannerService.getPostScanAction(action, response, response?.reserva);

            if (postAction.type === 'redirect') {
                router.visit(postAction.url);
            } else if (postAction.type === 'modal') {
                // Retornar información para que el componente maneje el modal
                return {
                    type: 'modal',
                    modalType: postAction.modalType,
                    reservaInfo: response?.reserva
                };
            }

        } catch (err) {
            setError(err.message || 'Error procesando la reserva');
            setAssignDetails(err.details || null);
        } finally {
            setIsProcessing(false);
        }
    }, [action, isProcessing]);

    const clearError = useCallback(() => {
        setError(null);
        setAssignDetails(null);
    }, []);

    return {
        scannedData,
        error,
        assignDetails,
        isProcessing,
        handleScanSuccess,
        clearError
    };
}
