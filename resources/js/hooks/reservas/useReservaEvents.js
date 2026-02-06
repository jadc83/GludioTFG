import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { emitToast } from '@/utils/toast';

const debounce = (fn, wait = 300) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
};

export default function useReservaEvents(
    reserva,
    { onRefresh = () => {}, onDeleted = () => {}, onUpdated = null, suppressToast = false } = {},
) {
    const { props } = usePage();

    useEffect(() => {
        const echo = window.Echo;
        const id = reserva?.id || reserva?.localizador;

        if (!echo || !id) return;

        const canal = `reservas.${id}`;
        const refresh = debounce(async () => {
            try {
                const updated = await onRefresh();
                if (updated && typeof onUpdated === 'function') {
                    try { onUpdated(updated); } catch (e) { /* noop */ }
                }

                if (!suppressToast) emitToast('Reserva actualizada', 'success');
            } catch (e) {
                if (!suppressToast) emitToast('Error al actualizar la reserva', 'error');
            }
        }, 250);

        const isAuthed = Boolean(props?.auth?.user);
        const subscribeMethod = isAuthed && echo.private ? 'private' : 'channel';

        const subscriber = echo[subscribeMethod](canal);

        const listener = subscriber
            .listen('ReservaActualizada', refresh)
            .listen('ReservaCreada', refresh)
            .listen('ReservaBorrada', () => {
                onDeleted();
                window.location.href = '/404';
            });

        return () => {
            listener.stopListening('ReservaActualizada');
            listener.stopListening('ReservaCreada');
            listener.stopListening('ReservaBorrada');
        };
    }, [reserva?.id, reserva?.localizador, onRefresh, onDeleted, props, onUpdated, suppressToast]);
}
