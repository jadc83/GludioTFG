<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\Reserva;
use App\Models\User;
use App\Models\Empleado;
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

        // Empleados (unimos algunos campos del usuario para simplificar el front)
        $empleados = Empleado::with('user')->orderBy('id')->get()->map(function ($empleado) {
            $data = $empleado->toArray();
            if ($empleado->user) {
                $data['name'] = $empleado->user->name;
                $data['email'] = $empleado->user->email;
                $data['tipo_documento'] = $empleado->user->tipo_documento;
                $data['numero_documento'] = $empleado->user->numero_documento;
                $data['nacionalidad'] = $empleado->user->nacionalidad;
                $data['direccion'] = $empleado->user->direccion;
                $data['ciudad'] = $empleado->user->ciudad;
                $data['codigo_postal'] = $empleado->user->codigo_postal;
                $data['telefono'] = $empleado->user->telefono;
            }
            return $data;
        });

        return Inertia::render('Panel/PanelControl', [
            'habitaciones'            => $habitaciones,
            'habitacionesDisponibles' => HabitacionController::getDisponibles($request->check_in, $request->check_out),
            'clientes'                => Cliente::orderBy('name')->get(),
            'users'                   => User::orderBy('name')->get(),
            'clientesFiltrados'       => $clientes->merge($usuarios)->sortBy('name')->values(),
            'reservas'                => $this->reservaService->formatearReservas($reservas),
            'empleados'               => $empleados,
        ]);
    }
}
