import { useEffect, useRef } from 'react';

// Simple debounce helper
function debounce(fn, wait = 300) {
    let t = null;
    return (...args) => {
        if (t) clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

export default function useReservaEvents(reserva, { onRefresh = () => {}, onDeleted = () => {} } = {}) {
    const channelRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined' || !window.Echo) return;
        if (!reserva?.localizador && !reserva?.id) return;

        const channelName = reserva.id ? `reservas.${reserva.id}` : `reservas.${reserva.localizador}`;
        try {
            const channel = window.Echo.private(channelName);
            channelRef.current = channel;

            const debouncedRefresh = debounce(() => onRefresh(), 250);
            channel.listen('ReservaActualizada', debouncedRefresh);
            channel.listen('ReservaCreada', debouncedRefresh);

            const deletedHandler = () => {
                try {
                    onDeleted();
                    window.location.href = '/404';
                } catch (err) { window.location.href = '/404'; }
            };
            channel.listen('ReservaBorrada', deletedHandler);

            return () => {
                try {
                    channel.stopListening('ReservaActualizada');
                    channel.stopListening('ReservaCreada');
                    channel.stopListening('ReservaBorrada');
                } catch (err) {}
            };
        } catch (err) {
        }
    }, [reserva?.id, reserva?.localizador, onRefresh, onDeleted]);
}
