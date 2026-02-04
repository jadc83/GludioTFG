import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock Inertia usePage to simulate authenticated user
vi.mock('@inertiajs/react', () => ({ usePage: vi.fn(() => ({ props: { auth: { user: { id: 1 } } } })) }));

import useReservaEvents from '@/hooks/reservas/useReservaEvents';

function TestComponent({ reserva, onRefresh }) {
    useReservaEvents(reserva, { onRefresh });
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

        const onRefresh = vi.fn();
        render(<TestComponent reserva={{ id: 123 }} onRefresh={onRefresh} />);

        expect(window.Echo.private).toHaveBeenCalledWith('reservas.123');

        // simulate event firing
        handlers['ReservaActualizada']();

        // debounce default is 250ms
        vi.advanceTimersByTime(300);

        expect(onRefresh).toHaveBeenCalled();
    });
});
