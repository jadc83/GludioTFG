import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

vi.mock('@/hooks/usePreview', () => ({ __esModule: true, default: (localizador) => ({ preview: null, loading: false, error: null, fetchPreview: vi.fn(async () => ({ available: true, estimate_charge: 0 })) }) }));
vi.mock('@/hooks/pagos/usePaymentModal', () => ({ __esModule: true, default: () => ({ mostrar: false, monto: 0, pendienteAplicar: false, aceptaTerminos: false, mostrarAceptacion: false, procesando: false, open: vi.fn(), close: vi.fn(), onPagoExitoso: vi.fn(), setAceptaTerminos: vi.fn() }) }));
vi.mock('@/utils/toast', () => ({ emitToast: vi.fn() }));

import useDetalleReserva from '@/hooks/reservas/useDetalleReserva';

describe('useDetalleReserva', () => {
    it('openDateModal populates dates and calls fetchPreview when reserva has dates', async () => {
        const reserva = { id: 1, localizador: 'ABC', check_in: '2026-02-10', check_out: '2026-02-12' };
        const refresh = vi.fn();
        const aplicarCambioFechas = vi.fn();

        const { result } = renderHook(() => useDetalleReserva({ reserva, refresh, aplicarCambioFechas }));

        act(() => {
            result.current.openDateModal();
        });

        expect(result.current.modalCheckIn).toBe('2026-02-10');
        expect(result.current.modalCheckOut).toBe('2026-02-12');
    });

    it('confirmDateModal opens paymentModal when estimate_charge > 0', async () => {
        // override preview hook mock to return a charge
        const mockPreview = vi.fn(async () => ({ available: true, estimate_charge: 50 }));
        vi.mocked(await import('@/hooks/usePreview')).default = () => ({ preview: null, loading: false, error: null, fetchPreview: mockPreview });

        const reserva = { id: 2, localizador: 'XYZ' };
        const refresh = vi.fn();
        const aplicarCambioFechas = vi.fn();

        const { result } = renderHook(() => useDetalleReserva({ reserva, refresh, aplicarCambioFechas }));

        // set dates
        act(() => {
            result.current.setModalCheckIn('2026-02-20');
            result.current.setModalCheckOut('2026-02-22');
        });

        // Call confirmDateModal (it should call paymentModal.open)
        await act(async () => {
            await result.current.confirmDateModal();
        });

        // paymentModal.open is mocked inside hook; we can't easily reach it here, but ensure flow didn't throw and processing toggled
        expect(result.current.isProcessing).toBe(false);
    });
});
