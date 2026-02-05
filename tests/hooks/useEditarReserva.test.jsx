import { renderHook } from '@testing-library/react';
import { vi } from 'vitest';

// Mock usePaymentCheck hook (used to detect session_id)
vi.mock('@/hooks/pagos/usePaymentCheck', () => ({
    default: ({ onConfirmed } = {}) => {
        // Immediately call onConfirmed as if the session was paid
        if (typeof onConfirmed === 'function') {
            onConfirmed({ success: true, paid: true, pago_id: 99 });
        }
        return;
    },
}));

import useEditarReserva from '@/hooks/reservas/useEditarReserva';

describe('useEditarReserva (session_id polling)', () => {
    beforeEach(() => {
        // Ensure search contains session_id
        const original = window.location;
        delete window.location;
        window.location = new URL('http://localhost/?session_id=test_sess');
        // simple global restore not needed; test runner tears down window between tests
    });

    afterEach(() => {
        vi.clearAllMocks();
        // cleanup location
        const original = new URL('http://localhost/');
        window.location = original;
    });

    it('calls checkSession and refreshes when payment confirmed', async () => {
        const mockRefresh = vi.fn();
        const mockShowToast = vi.fn();
        const mockPagoExitoso = vi.fn();

        const props = {
            reserva: { id: 1, localizador: 'LOC' },
            setReserva: vi.fn(),
            initialHabitacionesDisponibles: [],
            refresh: mockRefresh,
            showToast: mockShowToast,
            aplicarCambioFechas: vi.fn(),
            obtenerPreview: vi.fn(),
        };

        const { result, waitForNextUpdate } = renderHook(() => useEditarReserva(props));

        // wait a tick for effect to run
        await new Promise((r) => setTimeout(r, 0));

        expect(mockShowToast).toHaveBeenCalledWith('Pago confirmado. Actualizando reserva...', 'success');
        expect(mockRefresh).toHaveBeenCalled();
    });
});
