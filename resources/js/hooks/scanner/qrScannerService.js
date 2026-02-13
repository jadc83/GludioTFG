import axios from 'axios';
export class QRScannerService {
    /* Extrae el localizador de un escaneo */

    static extraerLocalizador(texto) {
        let localizador = String(texto || '').trim();
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
            // ignored: fallback to using the raw text as localizador
        }

        return localizador;
    }

    /* Procesa un escaneo de QR enviándolo al backend */
    static async procesar(localizador, action = null) {
        const csrf = window.getCsrfToken?.() || null;

        const payload = { localizador: localizador };
        if (action) {
            payload.action = action;
            payload.accion = action;
        }

        try {
            const { data } = await axios.post(
                route('scan.procesar'),
                payload,
                {
                    headers: {
                        'X-XSRF-TOKEN': csrf || '',
                        Accept: 'application/json',
                    },
                    withCredentials: true,
                },
            );
            return data;
        } catch (err) {
            const body = err?.response?.data;
            throw new Error(
                body?.error ||
                    body?.message ||
                    err?.message ||
                    'Error procesando escaneo',
            );
        }
    }

    /* Qué hacer después de un escaneo correcto */
    static postEscaneo(action, response) {
        if (action === 'checkin') {
            if (response?.success === false) {
                throw new Error(
                    response?.error ||
                        response?.message ||
                        'Error procesando check-in',
                );
            }

            return { type: 'modal', tipoModal: 'checkin' };
        }

        if (action === 'checkout') {
            if (response?.success === false) {
                throw new Error(
                    response?.error ||
                        response?.message ||
                        'Error procesando check-out',
                );
            }
            return { type: 'modal', tipoModal: 'checkout' };
        }

        return { type: 'modal', tipoModal: 'success' };
    }
}
