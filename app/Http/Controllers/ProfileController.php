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

        // Si el usuario tiene un empleado asociado, preparar datos para el perfil
        $empleadoData = null;
        $habitacionesLimpieza = [];

        if ($user->empleado) {
            $user->empleado->load('departamento');
            $empleadoData = [
                'id' => $user->empleado->id,
                'name' => $user->name,
                'email' => $user->email,
                'puesto' => $user->empleado->puesto,
                'departamento' => $user->empleado->departamento?->name ?? null,
                // Incluir datos de perfil del usuario para mostrarlos en el perfil de empleado
                'role' => $user->getRoleNames()->first() ? ucwords(str_replace('_', ' ', $user->getRoleNames()->first())) : null,
                'telefono' => $user->telefono ?? null,
                'direccion' => $user->direccion ?? null,
                'ciudad' => $user->ciudad ?? null,
                'codigo_postal' => $user->codigo_postal ?? null,
                'nacionalidad' => $user->nacionalidad ?? null,
                'tipo_documento' => $user->tipo_documento ?? null,
                'numero_documento' => $user->numero_documento ?? null,
            ];

            // Cargar habitaciones en estado 'limpieza' para mostrar en el perfil de empleado
            // Excluir habitaciones que ya tienen una tarea activa (pendiente|en_progreso)
            $habitaciones = \App\Models\Habitacion::where('estado', 'limpieza')
                ->whereDoesntHave('tareas', function($q){ $q->whereIn('status', ['pendiente', 'en_progreso']); })
                ->with('fotos')
                ->limit(100)
                ->get();
            $action = app(\App\Actions\Habitaciones\FormatHabitacionesAction::class);
            $habitacionesLimpieza = $action->handle($habitaciones);
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'reservas' => $reservasFormateadas,
            'empleado' => $empleadoData,
            'habitacionesLimpieza' => $habitacionesLimpieza,
            // Usar Spatie para indicar si el usuario puede ver "Mis Reservas"
            'can_view_reservas' => $user->hasAnyRole(['user','admin']),
            // Mostrar la pestaña Tareas solo para usuarios con rol limpieza o mantenimiento
            'can_view_tareas' => $user->hasAnyRole(['limpieza','mantenimiento']),
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
            'Reembolso parcial pendiente' => 'Reembolso Parcial Pendiente',
            'Reembolso completo pendiente' => 'Reembolso Completo Pendiente',
            'Reembolso parcial confirmado' => 'Reembolso Parcial Confirmado',
            'Reembolso completo confirmado' => 'Reembolso Completo Confirmado',
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
     * Mostrar vista de historial de tareas completadas por el usuario
     */
    public function tareasCompleted(Request $request)
    {
        $user = $request->user();
        $tareas = \App\Models\Tarea::where('completed_by', $user->id)
            ->with('habitacion')
            ->orderBy('completed_at', 'desc')
            ->get()
            ->map(function ($t) {
                $completedAt = null;
                if ($t->completed_at) {
                    try {
                        $completedAt = \Carbon\Carbon::parse($t->completed_at)->toDateTimeString();
                    } catch (\Throwable $e) {
                        $completedAt = (string) $t->completed_at;
                    }
                }

                // Calcular duración (segundos) entre asignación (created_at) y completado (completed_at)
                $durationSeconds = null;
                $durationHuman = null;
                if ($t->completed_at && $t->created_at) {
                    try {
                        // Use absolute difference of timestamps to avoid negative diffs
                        try {
                            $completedTs = \Carbon\Carbon::parse($t->completed_at)->getTimestamp();
                            $createdTs = \Carbon\Carbon::parse($t->created_at)->getTimestamp();
                            $durationSeconds = (int) abs($completedTs - $createdTs);
                            \Log::info('Tarea duration calc', ['id' => $t->id, 'created_at' => (string)$t->created_at, 'completed_at' => (string)$t->completed_at, 'seconds' => $durationSeconds]);
                            $interval = \Carbon\CarbonInterval::seconds($durationSeconds)->cascade();
                            $durationHuman = $interval->forHumans(['join' => true, 'parts' => 2, 'short' => false, 'locale' => 'es']);
                            \Log::info('Tarea duration human', ['id' => $t->id, 'human' => $durationHuman]);
                        } catch (\Throwable $e) {
                            $durationSeconds = null;
                            $durationHuman = null;
                            \Log::error('Error computing duration timestamps', ['id' => $t->id, 'error' => (string)$e]);
                        }
                    } catch (\Throwable $e) {
                        $durationHuman = null;
                        \Log::error('Error computing duration', ['id' => $t->id, 'error' => (string)$e]);
                    }
                }

                // Si la descripción termina en un número y ya tenemos habitación, eliminar el número repetido
                $desc = $t->descripcion;
                if ($t->habitacion && is_string($desc) && preg_match('/\d+$/', trim($desc))) {
                    $desc = preg_replace('/\s*\d+$/', '', $desc);
                }

                return [
                    'id' => $t->id,
                    'descripcion' => $desc,
                    'habitacion' => $t->habitacion ? ['id' => $t->habitacion->id, 'numero' => $t->habitacion->numero] : null,
                    'assigned_at' => $t->created_at ? (\Carbon\Carbon::parse($t->created_at)->toDateTimeString() ?? (string) $t->created_at) : null,
                    'completed_at' => $completedAt,
                    'duration' => $durationHuman,
                ];
            });

        return Inertia::render('Profile/CompletedTasks', [
            'tareas' => $tareas,
        ]);
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
