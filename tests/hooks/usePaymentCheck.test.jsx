import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

vi.mock('@/services/pagosService', () => ({
    checkSession: vi.fn(async (id) => {
        if (id === 'sess_paid') return { success: true, paid: true, pago_id: 55 };
        return { success: true, paid: false };
    }),
}));

import usePaymentCheck from '@/hooks/pagos/usePaymentCheck';
import * as pagosApi from '@/services/pagosService';

describe('usePaymentCheck', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // clear global Echo
        delete window.Echo;
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.clearAllMocks();
    });

    it('polls checkSession and calls onConfirmed when paid', async () => {
        const onConfirmed = vi.fn();
        renderHook(() => usePaymentCheck({ reservaId: 123, sessionId: 'sess_paid', onConfirmed }));

        // advance timers to let poll run (initialDelay default 3000)
        await vi.runAllTimersAsync();

        expect(pagosApi.checkSession).toHaveBeenCalledWith('sess_paid');
        expect(onConfirmed).toHaveBeenCalledWith({ success: true, paid: true, pago_id: 55 });
    });

    it('listens to Echo and calls onConfirmed when event arrives (and stops polling)', async () => {
        // prepare Echo mock
        const handlers = {};
        const listener = {
            listen: (event, cb) => { handlers[event] = cb; return listener; },
            stopListening: vi.fn(() => listener),
        };
        window.Echo = {
            private: vi.fn(() => listener),
        };

        const onConfirmed = vi.fn();
        renderHook(() => usePaymentCheck({ reservaId: 456, sessionId: 'sess_notpaid', onConfirmed }));

        expect(window.Echo.private).toHaveBeenCalledWith('reservas.456');

        // fire event
        handlers['ReservaActualizada']({ type: 'ReservaActualizada', pago_id: 99 });

        expect(onConfirmed).toHaveBeenCalledWith({ type: 'ReservaActualizada', pago_id: 99 });
        // ensure we didn't poll into infinite loop; advance timers just to be safe
        await vi.runAllTimersAsync();
    });
});
