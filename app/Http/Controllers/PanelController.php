<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\Reserva;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PanelController extends Controller
{
public function index(Request $request)
{
    $habitaciones = Habitacion::with('fotos')->get();
    $clientes     = Cliente::orderBy('name')->get();
    $usuarios     = User::orderBy('name')->get();
    $reservas     = Reserva::with('reservable')->get();
    $clientesTodos = $clientes->merge($usuarios)->sortBy('name')->values();

    return Inertia::render('PanelControl',
    [
        'habitaciones'            => $habitaciones,
        'habitacionesDisponibles' => HabitacionController::obtenerDisponibles( $request->check_in, $request->check_out ),
        'clientes'                => $clientes,
        'clientesFiltrados'       => $clientesTodos,
        'reservas'                => $reservas,
        'users'                   => $usuarios,
    ]);
}

}
