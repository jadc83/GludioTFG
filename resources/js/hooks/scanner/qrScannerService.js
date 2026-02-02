/**
 * Servicio para manejar operaciones relacionadas con el escaneo de QR
 */
import axios from 'axios';
export class QRScannerService {
    /**
     * Extrae el localizador de un texto escaneado (puede ser URL o texto directo)
     */
    static extractLocalizador(decodedText) {
        let localizador = String(decodedText || '').trim();
        if (!localizador) return null;

        try {
            if (localizador.startsWith('http')) {
                const url = new URL(localizador);
                const parts = url.pathname.split('/').filter(Boolean);
                if (parts.length > 0) {
                    localizador = parts[parts.length - 1];
                }
            }
        } catch (e) {
            // Si no es una URL válida, usar el texto tal cual
        }

        return localizador;
    }

    /**
     * Procesa un escaneo de QR enviándolo al backend
     */
    static async processScan(localizador, action = null) {
        // Obtener CSRF token
        const csrf =
            typeof document !== 'undefined'
                ? document
                      .querySelector('meta[name="csrf-token"]')
                      ?.getAttribute('content')
                : null;

        const payload = { localizador: localizador };
        if (action) {
            // Enviar tanto 'action' como 'accion' para compatibilidad con backend en español
            payload.action = action;
            payload.accion = action;
        }

        try {
            const { data } = await axios.post(route('scan.procesar'), payload, {
                headers: { 'X-CSRF-TOKEN': csrf || '', Accept: 'application/json' },
                withCredentials: true,
            });
            return data;
        } catch (err) {
            const body = err?.response?.data;
            throw new Error(body?.error || body?.message || err?.message || 'Error procesando escaneo');
        }
    }

    /**
     * Determina qué hacer después de un escaneo exitoso basado en la acción
     */
    static getPostScanAction(action, response, reservaInfo) {
        if (action === 'checkin') {
            if (response?.success === false) {
                throw new Error(
                    response?.error ||
                        response?.message ||
                        'Error procesando check-in',
                );
            }
            // Mostrar modal de éxito antes de redirigir
            return { type: 'modal', modalType: 'checkin' };
        }

        if (action === 'checkout') {
            if (response?.success === false) {
                throw new Error(
                    response?.error ||
                        response?.message ||
                        'Error procesando check-out',
                );
            }
            return { type: 'modal', modalType: 'checkout' };
        }

        // Sin acción: mostrar modal de éxito antes de redirigir
        return { type: 'modal', modalType: 'success' };
    }
}
