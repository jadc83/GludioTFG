import { useState, useCallback } from 'react';
import * as api from '@/api/reservas';

export default function useReserva(initialReserva) {
    const [reserva, setReserva] = useState(initialReserva);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const refresh = useCallback(async (fallbackLocalizador = null) => {
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
    }, [reserva]);

    const aplicarCambioFechas = useCallback(async (newCheckIn, newCheckOut, pagoId = null) => {
        const payload = { check_in: newCheckIn.format('YYYY-MM-DD'), check_out: newCheckOut.format('YYYY-MM-DD') };
        if (pagoId) payload.pago_id = pagoId;
        return api.modificarEstancia(reserva.localizador, payload);
    }, [reserva]);

    const solicitarReembolso = useCallback(async (monto, cancelar = false) => {
        return api.solicitarReembolso(reserva.id, { monto, cancelar });
    }, [reserva]);

    return {
        reserva,
        setReserva,
        loading,
        error,
        refresh,
        aplicarCambioFechas,
        solicitarReembolso
    };
}
