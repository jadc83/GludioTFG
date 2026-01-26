<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use App\Events\ReservaCreada;

class ReservaCreator
{
    private ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function create(array $datos, ?User $usuario = null, string $status = 'pendiente'): Reserva
    {
        $datosPreparados = $this->reservaService->prepararDatosReserva($datos);

        // Verificar disponibilidad
        $this->reservaService->verificarDisponibilidad($datosPreparados['habitaciones'], $datosPreparados['check_in'], $datosPreparados['check_out']);

        // Resolver reservable (usuario o cliente)
        if (($datosPreparados['tipo_usuario'] ?? '') === 'usuario' && $usuario) {
            $datosPreparados['reservable_id'] = $usuario->id;
            $reservableType = User::class;
        } else {
            $clienteId = $this->reservaService->obtenerOCrearCliente($datosPreparados);
            $datosPreparados['reservable_id'] = $clienteId;
            $reservableType = Cliente::class;
            $datosPreparados['tipo_usuario'] = 'cliente';
        }

        return DB::transaction(function () use ($datosPreparados, $usuario, $status, $reservableType) {
            $localizador = $this->reservaService->generarLocalizador();

            $reserva = Reserva::create([
                'localizador' => $localizador,
                'reservable_id' => $datosPreparados['reservable_id'],
                'reservable_type' => $reservableType,
                'booked_by_user_id' => $usuario->id ?? null,
                'check_in' => $datosPreparados['check_in'],
                'check_out' => $datosPreparados['check_out'],
                'precio_total' => $datosPreparados['precio_total'],
                'status' => $status,
                'pago' => $datosPreparados['pago'] ?? 'pendiente',
                'notas' => $datosPreparados['notas'] ?? 'Reserva creada',
            ]);

            // Asignar habitaciones
            $this->reservaService->asignarHabitaciones($reserva, $datosPreparados['habitaciones']);

            // Disparar evento
            event(new ReservaCreada($reserva));

            return $reserva;
        });
    }
}
