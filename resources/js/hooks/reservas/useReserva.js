import axios from 'axios';
import { useCallback, useState } from 'react';
import * as api from './service';

export default function useReserva(initialReserva) {
    const [reserva, setReserva] = useState(initialReserva);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(
        async (fallbackLocalizador = null) => {
            try {
                setLoading(true);
                const localizador = reserva?.localizador ?? fallbackLocalizador;
                if (!localizador) return null;
                const r = await api.buscarReserva(localizador);
                if (r) setReserva(r);
                return r;
            } catch (err) {
                setError(err);
                return null;
            } finally {
                setLoading(false);
            }
        },
        [reserva],
    );

    const aplicarCambioFechas = useCallback(
        async (newCheckIn, newCheckOut, pagoId = null) => {
            // Restaurar la funcionalidad: realizar PUT a /reservas/{id} con las nuevas fechas.
            try {
                setLoading(true);
                if (!reserva || !reserva.id)
                    return { success: false, message: 'Reserva inválida' };

                const payload = {
                    check_in: newCheckIn,
                    check_out: newCheckOut,
                    status: reserva.status || 'pendiente',
                    pago: reserva?.pago?.estado || reserva?.pago || 'pendiente',
                    habitacion_ids: (reserva.habitaciones || [])
                        .map((h) => Number(h.habitacion_id ?? h.id))
                        .filter((n) => Number.isInteger(n)),
                };
                if (pagoId) payload.pago_id = pagoId;

                const res = await axios.put(
                    `/reservas/${reserva.id}`,
                    payload,
                    {
                        headers: {
                            Accept: 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                        },
                    },
                );

                const data = res?.data ?? null;
                if (data?.success === false)
                    return {
                        success: false,
                        message:
                            data?.message || 'Error aplicando cambio de fechas',
                        res: data,
                    };

                // Normalizar distintos formatos de respuesta
                const reservaData =
                    (data.data ?? data).reserva ?? data.reserva ?? data;
                if (reservaData) setReserva(reservaData);

                return { success: true, reserva: reservaData, res: data };
            } catch (err) {
                return { success: false, err: err?.response?.data ?? err };
            } finally {
                setLoading(false);
            }
        },
        [reserva],
    );

    const solicitarReembolso = useCallback(
        async (monto, cancelar = false) => {
            return api.solicitarReembolso(reserva.id, { monto, cancelar });
        },
        [reserva],
    );

    return {
        reserva,
        setReserva,
        loading,
        error,
        refresh,
        aplicarCambioFechas,
        solicitarReembolso,
    };
}
