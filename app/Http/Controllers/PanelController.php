<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\Reserva;
use App\Models\User;
use App\Services\ReservaService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PanelController extends Controller
{
    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        $this->reservaService = $reservaService;
    }

    public function index(Request $request)
    {
        $clientes = Cliente::buscar($request->busqueda)
            ->tipoDocumento($request->tipo_documento)
            ->orderBy('name')
            ->get();

        $usuarios = User::buscar($request->busqueda)
            ->tipoDocumento($request->tipo_documento)
            ->orderBy('name')
            ->get();

        $reservas = Reserva::with(['reservable', 'habitaciones.habitacion'])
            ->status($request->status)
            ->localizador($request->localizador)
            ->cliente($request->cliente)
            ->habitacion($request->habitacion)
            ->orderBy('check_in', 'desc')
            ->get();

        $habitaciones = Habitacion::with('fotos')
            ->buscar($request->busqueda)
            ->estado($request->estado)
            ->tipo($request->tipo)
            ->capacidad($request->capacidad)
            ->precioMin($request->precio_min)
            ->precioMax($request->precio_max)
            ->orderBy('numero')
            ->get();

        return Inertia::render('Panel/PanelControl', [
            'habitaciones'            => $habitaciones,
            'habitacionesDisponibles' => HabitacionController::getDisponibles($request->check_in, $request->check_out),
            'clientes'                => Cliente::orderBy('name')->get(),
            'users'                   => User::orderBy('name')->get(),
            'clientesFiltrados'       => $clientes->merge($usuarios)->sortBy('name')->values(),
            'reservas'                => $this->reservaService->formatearReservas($reservas),
        ]);
    }
}
