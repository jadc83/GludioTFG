import React from 'react';
import { render } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';

// Mock inertia page to avoid GuestLayout reading real props
vi.mock('@inertiajs/react', () => ({ usePage: vi.fn(() => ({ props: { auth: { user: null } } })), Link: ({ children, ...props }) => <a {...props}>{children}</a> }));
// Mock the layout to avoid rendering the full site chrome in smoke test
vi.mock('@/Layouts/GuestLayout', () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));

// Mock hooks used by DetalleReserva to keep the test isolated
vi.mock('@/hooks/reservas/useReserva', () => ({ __esModule: true, default: (initial) => ({ reserva: initial, setReserva: vi.fn(), refresh: vi.fn(), aplicarCambioFechas: vi.fn() }) }));
vi.mock('@/hooks/reservas/useReservaEvents', () => ({ __esModule: true, default: () => {} }));
vi.mock('@/hooks/usePreview', () => ({ __esModule: true, default: () => ({ preview: null, loading: false, error: null, fetchPreview: vi.fn() }) }));
vi.mock('@/hooks/pagos/usePayments', () => ({ __esModule: true, default: () => ({ checkSession: vi.fn(), confirmarPaymentIntent: vi.fn(), createPaymentIntent: vi.fn() }) }));
vi.mock('@/hooks/pagos/usePaymentCheck', () => ({ __esModule: true, default: () => {} }));
vi.mock('@/hooks/pagos/usePaymentModal', () => ({ __esModule: true, default: () => ({ mostrar:false, monto:0, pendienteAplicar:false, aceptaTerminos:false, mostrarAceptacion:false, procesando:false, open: vi.fn(), close: vi.fn(), onPagoExitoso: vi.fn(), setAceptaTerminos: vi.fn() }) }));

// Stub subcomponents used by DetalleReserva to keep the test focused and avoid needing React imports everywhere
vi.mock('@/Components/reservas/comunes/ReservaHeader', () => ({ __esModule: true, default: (props) => <div>ReservaHeader</div> }));
vi.mock('@/Components/reservas/usuario/ReservaRooms', () => ({ __esModule: true, default: (props) => <div>ReservaRooms</div> }));
vi.mock('@/Components/reservas/usuario/ReservaInfo', () => ({ __esModule: true, default: (props) => <div>ReservaInfo</div> }));
vi.mock('@/Components/reservas/comunes/ReservaSidebar', () => ({ __esModule: true, default: (props) => <div>ReservaSidebar</div> }));
vi.mock('@/Components/reservas/comunes/ModalFechas', () => ({ __esModule: true, default: (props) => <div>ModalFechas</div> }));
vi.mock('@/Components/reservas/comunes/ModalPago', () => ({ __esModule: true, default: (props) => <div>ModalPago</div> }));
vi.mock('@/Components/reservas/comunes/ModalReembolso', () => ({ __esModule: true, default: (props) => <div>ModalReembolso</div> }));

import DetalleReserva from '@/Pages/Reservas/EditReservaUsuario';

describe('DetalleReserva smoke', () => {
    it('renders without errors with minimal reserva', () => {
        const consoleErr = vi.spyOn(console, 'error').mockImplementation(() => {});
        const reserva = { id: 1, localizador: 'TEST01', habitaciones: [], status: 'creada', precio_total: 100 };
        const { getByText } = render(<DetalleReserva reserva={reserva} />);

        // Check for stubbed subcomponent content rendered by the component
        expect(getByText(/ReservaInfo/i)).toBeTruthy();
        expect(consoleErr).not.toHaveBeenCalled();
        consoleErr.mockRestore();
    });
});
