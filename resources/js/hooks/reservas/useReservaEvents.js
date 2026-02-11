import { useEffect } from 'react';
import { t } from '@/i18n';
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
    const isAuthedUserId = Boolean(props?.auth?.user?.id);

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

                if (!suppressToast) emitToast(t('toasts.reserva_updated'), 'success');
            } catch (e) {
                if (!suppressToast) emitToast(t('toasts.reserva_update_error'), 'error');
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
    }, [reserva?.id, reserva?.localizador, onRefresh, onDeleted, onUpdated, suppressToast, isAuthedUserId]);
}
