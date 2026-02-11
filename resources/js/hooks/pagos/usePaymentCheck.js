import * as pagosService from '@/services/pagosService';
import { useEffect, useRef } from 'react';

/**
 * usePaymentCheck
 * - Subscribes to `reservas.{reservaId}` via window.Echo (if available) and listens for `ReservaActualizada` events
 * - If sessionId provided, runs exponential-backoff polling against `/pagos/check-session` until paid or attempts exhausted
 * - Calls onConfirmed(response) when either the event arrives or poll detects paid
 */
export default function usePaymentCheck({
    reservaId,
    sessionId = null,
    onConfirmed = () => {},
    opts = {},
}) {
    const { maxAttempts = 5, initialDelay = 3000, factor = 2 } = opts || {};
    const stoppedRef = useRef(false);
    const eventReceivedRef = useRef(false);

    useEffect(() => {
        stoppedRef.current = false;
        eventReceivedRef.current = false;

        const channelName = `reservas.${reservaId}`;
        let listener = null;

        if (
            typeof window !== 'undefined' &&
            window.Echo &&
            typeof window.Echo.private === 'function'
        ) {
            try {
                const ch = window.Echo.private(channelName);
                listener = ch.listen('ReservaActualizada', (event) => {
                    if (stoppedRef.current) return;
                    eventReceivedRef.current = true;
                    try {
                        onConfirmed(event);
                    } catch (e) {
                        console.warn('usePaymentCheck onConfirmed threw', e);
                    }
                });
            } catch (e) {
                console.debug(e);
            }
        }

        // Polling fallback for Checkout redirect (session_id)
        let attempts = 0;
        let timerId = null;

        const doPoll = async () => {
            if (stoppedRef.current || eventReceivedRef.current) return;
            if (!sessionId) return;
            try {
                attempts += 1;
                const resp = await pagosService.checkSession(sessionId);
                if (resp?.success && resp?.paid) {
                    eventReceivedRef.current = true; // stop other work
                    onConfirmed(resp);
                    return;
                }
            } catch (e) {
                console.debug(e);
            }

            if (
                !stoppedRef.current &&
                !eventReceivedRef.current &&
                attempts < maxAttempts
            ) {
                const wait = initialDelay * Math.pow(factor, attempts - 1);
                timerId = setTimeout(doPoll, wait);
            }
        };

        // start polling if sessionId present
        if (sessionId) doPoll();

        return () => {
            stoppedRef.current = true;
            if (listener && typeof listener.stopListening === 'function') {
                try {
                    listener.stopListening();
                } catch (e) {
                    console.debug(e);
                }
            }
            if (typeof timerId === 'number') clearTimeout(timerId);
        };
    }, [reservaId, sessionId, onConfirmed, maxAttempts, initialDelay, factor]);
}
