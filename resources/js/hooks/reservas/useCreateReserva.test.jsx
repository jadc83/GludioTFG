import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import useCreateReserva from './useCreateReserva';

// Mock the service module used by the hook
vi.mock('./service', () => ({
  obtenerTarifas: vi.fn(),
  obtenerHabitacionesDisponibles: vi.fn(),
  calcularPrecio: vi.fn(),
}));

import { obtenerTarifas } from './service';

function TestComponent() {
  const hook = useCreateReserva();

  return (
    <div>
      <button data-testid="open" onClick={() => hook.setAbierto(true)} />
      <button data-testid="toggle-1" onClick={() => hook.toggleTarifa(1)} />
      <div data-testid="tarifas-count">{hook.tarifas.length}</div>
      <div data-testid="selected">{JSON.stringify(hook.tarifasSeleccionadas)}</div>
    </div>
  );
}

describe('useCreateReserva', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carga tarifas al abrir y selecciona automáticamente tarifas gratuitas', async () => {
    obtenerTarifas.mockResolvedValueOnce([
      { id: 1, valor: 0 },
      { id: 2, valor: 25 },
    ]);

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('open'));

    await waitFor(() => expect(screen.getByTestId('tarifas-count').textContent).toBe('2'));

    // Selección automática debe incluir la tarifa con id 1 (valor 0)
    await waitFor(() => expect(screen.getByTestId('selected').textContent).toContain('1'));
  });

  it('no permite togglear tarifas gratuitas', async () => {
    obtenerTarifas.mockResolvedValueOnce([
      { id: 1, valor: 0 },
      { id: 2, valor: 25 },
    ]);

    render(<TestComponent />);

    fireEvent.click(screen.getByTestId('open'));

    await waitFor(() => expect(screen.getByTestId('tarifas-count').textContent).toBe('2'));

    // Intentar togglear la tarifa gratuita: no debe removerse
    fireEvent.click(screen.getByTestId('toggle-1'));

    await waitFor(() => expect(screen.getByTestId('selected').textContent).toContain('1'));
  });
});
