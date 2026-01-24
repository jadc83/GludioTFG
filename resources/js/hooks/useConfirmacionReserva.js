import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { getReservaPayload } from '@/utils/reservaPayload';

/**
 * Hook para manejar la confirmación y creación de reservas
 */
export default function useConfirmacionReserva() {
    const page = usePage();
    const csrfToken = page?.props?.csrf_token || '';

    const [procesando, setProcesando] = useState(false);
    const [errorPago, setErrorPago] = useState(null);

    /**
     * Prepara los datos de la reserva para enviar al servidor
     * Implementado localmente para delegar la validación autoritativa al backend.
     */
    const prepararDatosReservaHook = (getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual) => {
        return getReservaPayload({ getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual });
    };

    /**
     * Crea una reserva para pago al llegar
     */
    const crearReservaAlLlegar = async (datosReserva) => {
        try {

            setProcesando(true);
            setErrorPago(null);

            const res = await fetch('/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify(datosReserva),
            });

            if (!res.ok) {
                const contentType = res.headers.get('content-type');
                let errorData = { error: `Error HTTP ${res.status}` };

                if (contentType?.includes('application/json')) {
                    errorData = await res.json();
                }

                throw { status: res.status, ...errorData };
            }

            const data = await res.json();
            return data;
        } catch (error) {
            // Manejar respuesta 409 - cliente existe sin confirmación
            if (error.status === 409) {
                const mensaje = error.cliente_existente
                    ? `Este DNI ya está registrado a nombre de: ${error.cliente_existente.name}`
                    : 'Este cliente ya existe. ¿Deseas usar sus datos?';
                setErrorPago(mensaje);
            } else {
                const mensaje = error.message || error.error || 'Error desconocido al crear la reserva';
                setErrorPago(mensaje);
            }
            throw error;
        } finally {
            setProcesando(false);
        }
    };

    /**
     * Resetea el estado de la confirmación
     */
    const resetearErrores = () => {
        setErrorPago(null);
    };

    return { procesando, errorPago, prepararDatosReserva: prepararDatosReservaHook, crearReservaAlLlegar, resetearErrores};
}
