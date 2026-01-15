import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { formatearFecha } from '../utils/fecha';

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
     */
    const prepararDatosReserva = (getValues, rango, habitacionesSeleccionadas, idClienteSeleccionado, tipoClienteSeleccionado, usuarioActual) => {
        const values = getValues();
        const habitaciones = Object.entries(habitacionesSeleccionadas).filter(([, r]) => r.cantidad > 0)
              .map(([tipo, r]) => ({ tipo, cantidad: r.cantidad, personas_por_habitacion: Number(r.personas) > 0 ? Number(r.personas) : 1 }));

        // Devolver datos crudos el servidor hará la validación y transformación
        return {
            name: values.name,
            email: values.email,
            telefono: values.telefono,
            tipo_documento: values.tipo_documento,
            numero_documento: values.numero_documento,
            nacionalidad: values.nacionalidad,
            direccion: values.direccion,
            check_in: formatearFecha(rango?.from),
            check_out: formatearFecha(rango?.to),
            habitaciones,
            reservable_id: idClienteSeleccionado,
            tipo_usuario: tipoClienteSeleccionado || 'cliente',
            booked_by_user_id: usuarioActual?.id || null,
        };
    };

    /**
     * Crea una reserva para pago al llegar
     * El servidor ahora valida, prepara y asigna todo
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

                throw {
                    status: res.status,
                    ...errorData
                };
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

    return { procesando, errorPago, prepararDatosReserva, crearReservaAlLlegar, resetearErrores};
}
