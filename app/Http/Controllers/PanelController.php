<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PanelController extends Controller
{
    public function index(Request $request)
    {
        $habitaciones = (new HabitacionController())->index($request);
        $clientes = (new ClienteController())->index($request);
        $usuarios = (new UserController())->index($request);
        $reservas = (new ReservaController())->index($request);

        $clientesTodos = collect($clientes['clientes'] ?? [])
            ->concat($usuarios['usuarios'] ?? [])
            ->sortBy('name')
            ->values();

        $statsClientes = [
            'dni' => ($clientes['estadisticas']['dni'] ?? 0) + ($usuarios['estadisticas']['dni'] ?? 0),
            'pasaporte' => ($clientes['estadisticas']['pasaporte'] ?? 0) + ($usuarios['estadisticas']['pasaporte'] ?? 0),
            'tie' => ($clientes['estadisticas']['tie'] ?? 0) + ($usuarios['estadisticas']['tie'] ?? 0),
            'total' => ($clientes['estadisticas']['total'] ?? 0) + ($usuarios['estadisticas']['total'] ?? 0),
            'registrados' => $usuarios['estadisticas']['total'] ?? 0,
            'invitados' => $clientes['estadisticas']['total'] ?? 0,
        ];

        return Inertia::render('PanelControl', [
            'habitaciones' => $habitaciones['habitaciones'] ?? [],
            'habitacionesEstadisticas' => $habitaciones['estadisticas'] ?? [],
            'habitacionesDisponibles' => HabitacionController::obtenerDisponibles(
                $request->check_in,
                $request->check_out
            ),
            'clientes' => $clientes['clientes'] ?? [],
            'clientesFiltrados' => $clientesTodos,
            'clientesEstadisticas' => $statsClientes,
            'reservas' => $reservas['reservas'] ?? [],
            'reservasEstadisticas' => $reservas['estadisticas'] ?? [],
            'users' => User::orderBy('name')->get(),
        ]);
    }
}
