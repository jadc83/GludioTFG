import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock Inertia usePage to simulate authenticated user
vi.mock('@inertiajs/react', () => ({ usePage: vi.fn(() => ({ props: { auth: { user: { id: 1 } } } })) }));
// Mock toast
vi.mock('@/utils/toast', () => ({ emitToast: vi.fn() }));

import useReservaEvents from '@/hooks/reservas/useReservaEvents';
import { emitToast } from '@/utils/toast';


function TestComponent({ reserva, onRefresh, onUpdated, suppressToast = false }) {
    useReservaEvents(reserva, { onRefresh, onUpdated, suppressToast });
    return <div data-testid="ok">ok</div>;
}

describe('useReservaEvents', () => {
    beforeEach(() => {
        // Reset global Echo
        delete window.Echo;
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('subscribes to ReservaActualizada and calls onRefresh (debounced)', async () => {
        const handlers = {};
        const listener = {
            listen: (event, cb) => {
                handlers[event] = cb;
                return listener;
            },
            stopListening: vi.fn(() => listener),
        };

        window.Echo = {
            private: vi.fn(() => listener),
        };

        let updatedObj = null;
        const onRefresh = vi.fn(() => Promise.resolve({ id: 123, pago: 'pagado' }).then((r) => { updatedObj = r; return r; }));
        const onUpdated = vi.fn((r) => { updatedObj = r; });
        render(<TestComponent reserva={{ id: 123 }} onRefresh={onRefresh} onUpdated={onUpdated} suppressToast={true} />);

        expect(window.Echo.private).toHaveBeenCalledWith('reservas.123');

        // simulate event firing (Echo passes the event object as argument)
        handlers['ReservaActualizada']({ type: 'ReservaActualizada' });

        // debounce default is 250ms
        vi.advanceTimersByTime(300);
        // flush any pending timers and microtasks
        await vi.runAllTimersAsync();

        expect(onRefresh).toHaveBeenCalled();
        // onUpdated should be called with the updated object
        expect(onUpdated).toHaveBeenCalled();
        expect(updatedObj).toEqual({ id: 123, pago: 'pagado' });
        // toast is suppressed in this test
        expect(emitToast).not.toHaveBeenCalled();
    });
});
