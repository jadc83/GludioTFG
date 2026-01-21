<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{

    /**
     * Display the user's profile form.
     */
    public function edit(Request $request): Response
    {
        $user = $request->user();

        // Obtener las reservas del usuario
        $reservas = $user->reservas()
            ->with(['habitaciones.habitacion', 'pagos', 'reembolsos'])
            ->orderBy('check_in', 'desc')
            ->get();

        // Mapear los datos para mostrar en la vista
        $reservasFormateadas = $reservas->map(fn($reserva) => [
            'id' => $reserva->id,
            'localizador' => $reserva->localizador,
            'habitacion' => [
                'numero' => $reserva->habitaciones?->first()?->habitacion?->numero ?? 'N/A',
            ],
            'fecha_entrada' => (new \DateTime($reserva->check_in))->format('d/m/Y'),
            'fecha_salida' => (new \DateTime($reserva->check_out))->format('d/m/Y'),
            'noches' => $reserva->check_in ? (new \DateTime($reserva->check_out))->diff(new \DateTime($reserva->check_in))->days : 0,
            'monto_total' => number_format($reserva->precio_total, 2, ',', '.') . '€',
            'estado' => (
                (isset($reserva->reembolsos) && $reserva->reembolsos->isNotEmpty())
                || ($reserva->pago ?? '') === 'devuelto'
            ) ? 'Reembolsado' : $this->mapearEstado($reserva->status),
        ]);

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'reservas' => $reservasFormateadas,
        ]);
    }

    /**
     * Mapear estados de reserva a español
     */
    private function mapearEstado(string $status): string
    {
        $estados = [
            'pendiente' => 'Pendiente',
            'confirmado' => 'Confirmada',
            'checked_in' => 'En curso',
            'checked_out' => 'Completada',
            'cancelado' => 'Cancelada',
            'no_presentado' => 'No presentada',
        ];
        return $estados[$status] ?? $status;
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $request->user()->fill($request->validated());

        if ($request->user()->isDirty('email')) {
            $request->user()->email_verified_at = null;
        }

        $request->user()->save();

        return Redirect::route('profile.edit');
    }

    /**
     * Delete the user's account.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $request->validate([
            'password' => ['required', 'current_password'],
        ]);

        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
