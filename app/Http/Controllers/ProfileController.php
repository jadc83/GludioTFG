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

        // Si el usuario actual es admin y se pasó ?user_id=xx, permitir ver el perfil de ese usuario (reservas incluidas)
        $targetUser = $user;
        $requestedUserId = $request->query('user_id');
        if ($requestedUserId) {
            $maybe = \App\Models\User::find($requestedUserId);
            if ($maybe) {
                $targetUser = $maybe;
            }
        }

        // Obtener las reservas del usuario.
        // Incluimos:
        // - reservas donde el reservable es el propio User
        // - reservas donde el reservable es un Cliente con el mismo email (reservas hechas como invitado)
        // - reservas donde el usuario fue quien creó / reservó (booked_by_user_id)
        $reservasQuery = \App\Models\Reserva::with(['habitaciones.habitacion', 'pagos', 'reembolsos'])
            ->where(function ($q) use ($targetUser) {
                // Reservas donde reservable es el usuario
                $q->where(function ($q2) use ($targetUser) {
                    $q2->where('reservable_type', \App\Models\User::class)
                        ->where('reservable_id', $targetUser->id);
                });

                // Reservas donde reservable es un Cliente con el mismo email
                $q->orWhereHasMorph('reservable', [\App\Models\Cliente::class], function ($q3) use ($targetUser) {
                    $q3->where('email', $targetUser->email);
                });

                // Reservas creadas por el usuario
                $q->orWhere('booked_by_user_id', $targetUser->id);
            })
            ->orderBy('check_in', 'desc');

        $reservas = $reservasQuery->get();

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

        if ($targetUser->empleado) {
            $targetUser->empleado->load('departamento');
            $empleadoData = [
                'id' => $targetUser->empleado->id,
                'name' => $targetUser->name,
                'email' => $targetUser->email,
                'departamento' => $targetUser->empleado->departamento?->name ?? null,
                // Incluir datos de perfil del usuario para mostrarlos en el perfil de empleado
                'role' => $targetUser->getRoleNames()->first() ? ucwords(str_replace('_', ' ', $targetUser->getRoleNames()->first())) : null,
                'telefono' => $targetUser->telefono ?? null,
                'direccion' => $targetUser->direccion ?? null,
                'ciudad' => $targetUser->ciudad ?? null,
                'codigo_postal' => $targetUser->codigo_postal ?? null,
                'nacionalidad' => $targetUser->nacionalidad ?? null,
                'tipo_documento' => $targetUser->tipo_documento ?? null,
                'numero_documento' => $targetUser->numero_documento ?? null,
            ];

            // Buscar encargado del mismo departamento (usuario con rol 'encargado')
            $departamentoId = $targetUser->empleado->departamento?->id ?? null;
            $departamentoEncargado = null;
            if ($departamentoId) {
                try {
                    $enc = \App\Models\User::role('encargado')
                        ->whereHas('empleado', function ($q) use ($departamentoId) {
                            $q->where('departamento_id', $departamentoId);
                        })
                        ->with('empleado')
                        ->first();
                    if ($enc) {
                        $departamentoEncargado = [
                            'name' => $enc->name,
                            'email' => $enc->email ?? null,
                            'telefono' => $enc->telefono ?? null,
                        ];
                    }
                } catch (\Throwable $e) {
                    // no hacemos nada, solo evitamos romper la vista
                    \Log::debug('No se pudo obtener encargado de departamento', ['error' => (string) $e]);
                }
            }

            $empleadoData['departamento_encargado'] = $departamentoEncargado;

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

        // Determinar si el usuario que visualiza pertenece al departamento Recepcion
        $viewer = $request->user();
        $viewerIsReception = false;
        if ($viewer->empleado && $viewer->empleado->departamento) {
            try {
                $viewerIsReception = strcasecmp($viewer->empleado->departamento->name, 'recepcion') === 0;
            } catch (\Throwable $e) {
                $viewerIsReception = false;
            }
        }

        // Determinar si el usuario que visualiza puede ver las reservas.
        // Política: sólo administradores y personal de Recepción pueden ver la sección de reservas.
        $canViewReservas = false;
        try {
            if ($viewer && method_exists($viewer, 'hasRole') && $viewer->hasRole('admin')) {
                $canViewReservas = true;
            } elseif ($viewer && $viewer->empleado && $viewer->empleado->departamento) {
                $deptName = strtolower($viewer->empleado->departamento->name ?? '');
                if (in_array($deptName, ['recepcion'])) {
                    $canViewReservas = true;
                }
            }
        } catch (\Throwable $e) {
            $canViewReservas = false;
        }

        // Determinar visibilidad de 'Tareas'/'Turnos': por defecto si tiene empleado.
        // Además permitir a administradores ver estas pestañas (comprobación segura).
        $canViewTareas = false;
        try {
            $canViewTareas = ($viewer && $viewer->empleado) || (method_exists($viewer, 'hasRole') && $viewer->hasRole('admin'));
        } catch (\Throwable $e) {
            $canViewTareas = ($viewer && $viewer->empleado);
        }

        return Inertia::render('Profile/Edit', [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => session('status'),
            'reservas' => $reservasFormateadas,
            'empleado' => $empleadoData,
            'habitacionesLimpieza' => $habitacionesLimpieza,
            // Mostrar 'Mis Reservas' a: el propio usuario (si está autenticado),
            // y además a administradores / personal de Recepción cuando visualizan otros perfiles
            'can_view_reservas' => $canViewReservas,
            // Mostrar la pestaña Tareas y Turnos solo para usuarios con empleado asociado
            'can_view_tareas' => $canViewTareas,
            // Mostrar la pestaña 'Mi Perfil' para todos (contenido de tareas/turnos sigue restringido)
            'show_profile_tab' => true,
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
