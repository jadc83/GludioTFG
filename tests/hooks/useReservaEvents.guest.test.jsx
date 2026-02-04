import { render } from '@testing-library/react';
import React from 'react';
import { vi } from 'vitest';

// Mock Inertia usePage to simulate unauthenticated user
vi.mock('@inertiajs/react', () => ({ usePage: vi.fn(() => ({ props: {} })) }));

import useReservaEvents from '@/hooks/reservas/useReservaEvents';

function TestComponent({ reserva, onRefresh }) {
    useReservaEvents(reserva, { onRefresh });
    return <div data-testid="ok">ok</div>;
}

describe('useReservaEvents (guest)', () => {
    beforeEach(() => {
        delete window.Echo;
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('uses channel() when no auth user present', async () => {
        const handlers = {};
        const listener = {
            listen: (event, cb) => {
                handlers[event] = cb;
                return listener;
            },
            stopListening: vi.fn(() => listener),
        };

        window.Echo = {
            channel: vi.fn(() => listener),
        };

        const onRefresh = vi.fn();
        render(<TestComponent reserva={{ id: 999 }} onRefresh={onRefresh} />);

        expect(window.Echo.channel).toHaveBeenCalledWith('reservas.999');

        // simulate event firing
        handlers['ReservaActualizada']();
        vi.advanceTimersByTime(300);
        expect(onRefresh).toHaveBeenCalled();
    });
});
