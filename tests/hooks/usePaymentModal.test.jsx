import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';

import usePaymentModal from '@/hooks/pagos/usePaymentModal';

describe('usePaymentModal', () => {
    it('opens/closes and stores monto + pending flag', () => {
        const { result } = renderHook(() => usePaymentModal());
        act(() => {
            result.current.open(123.45, { pendingApply: true, requireAcceptance: true });
        });
        expect(result.current.mostrar).toBe(true);
        expect(result.current.monto).toBe(123.45);
        expect(result.current.pendienteAplicar).toBe(true);
        expect(result.current.mostrarAceptacion).toBe(true);
        act(() => result.current.close());
        expect(result.current.mostrar).toBe(false);
    });

    it('onPagoExitoso calls aplicarCambioFechas when pending and refresh/showToast used', async () => {
        const aplicarCambioFechas = vi.fn(async (ci, co, pagoId) => ({ success: true }));
        const refresh = vi.fn(async () => {});
        const showToast = vi.fn();

        const { result } = renderHook(() => usePaymentModal({ aplicarCambioFechas, refresh, showToast }));

        // open with pendingApply=true and meta dates
        act(() => {
            result.current.open(99, { pendingApply: true, meta: { check_in: '2026-02-10', check_out: '2026-02-12' } });
        });

        await act(async () => {
            const res = await result.current.onPagoExitoso({ pago_id: 77 });
            expect(res).toEqual({ success: true });
        });

        expect(aplicarCambioFechas).toHaveBeenCalledWith('2026-02-10', '2026-02-12', 77);
        expect(showToast).toHaveBeenCalledWith('Pago y actualizacion de reserva completados', 'success');
        expect(refresh).toHaveBeenCalled();
    });

    it('onPagoExitoso handles missing aplicarCambioFechas gracefully', async () => {
        const showToast = vi.fn();
        const { result } = renderHook(() => usePaymentModal({ showToast }));
        act(() => result.current.open(10, { pendingApply: true }));
        await act(async () => {
            const res = await result.current.onPagoExitoso({ pago_id: 1 });
            expect(res).toHaveProperty('success', false);
        });
        expect(showToast).toHaveBeenCalledWith('Error al aplicar cambios tras el pago, consulte a recepción', 'error');
    });
});
