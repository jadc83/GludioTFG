<?php

namespace App\Http\Controllers;

use App\Models\Tarea;
use App\Models\Habitacion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TareaController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * Listar tareas del empleado logueado (solo roles limpieza|mantenimiento)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $empleadoId = $request->query('empleado_id');

        if ($empleadoId) {
            $target = \App\Models\Empleado::find($empleadoId);
            if (!$target) return response()->json(['tareas' => []]);

            // Allow viewing when requesting the authenticated user's own empleado record
            if ($user->empleado && $user->empleado->id === $target->id) {
                $canView = true;
            } else {
                $canView = $user->hasRole('admin') || (
                    is_array($user->roles ?? []) && in_array('encargado', $user->roles) &&
                    $user->empleado && $user->empleado->departamento && $user->empleado->departamento === $target->departamento
                );
            }

            if (!$canView) return response()->json(['tareas' => []]);

            $tareasQuery = Tarea::where('empleado_id', $target->id);
        } else {
            if (!$user->empleado) {
                return response()->json(['tareas' => []]);
            }
            $tareasQuery = Tarea::where('empleado_id', $user->empleado->id);
        }

        $tareas = $tareasQuery->whereIn('status', ['pendiente', 'en_progreso'])
            ->with(['habitacion'])
            ->orderBy('status')->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($t) {
                // Si la descripción termina en un número y ya tenemos habitación, eliminar el número repetido
                $desc = $t->descripcion;
                if ($t->habitacion && is_string($desc) && preg_match('/\d+$/', trim($desc))) {
                    $desc = preg_replace('/\s*\d+$/', '', $desc);
                }

                return [
                    'id' => $t->id,
                    'descripcion' => $desc,
                    'status' => $t->status,
                    'habitacion' => $t->habitacion ? ['id' => $t->habitacion->id, 'numero' => $t->habitacion->numero] : null,
                    'created_at' => $t->created_at->toDateTimeString(),
                ];
            });

        return response()->json(['tareas' => $tareas]);
    }

    /**
     * Asignar una habitacion creando una tarea.
     * POST body: { habitacion_id, empleado_id? }
     * Si se proporciona `empleado_id` se intentará crear la tarea para ese empleado
     * (solo admin o encargado del mismo departamento pueden asignar a terceros).
     */
    public function assignRoom(Request $request): JsonResponse
    {
        $user = $request->user();
        $habitacionId = (int) $request->input('habitacion_id');
        $targetEmpleadoId = $request->input('empleado_id');

        $habitacion = Habitacion::find($habitacionId);
        if (!$habitacion) {
            return response()->json(['error' => 'Habitación no encontrada'], 404);
        }

        $targetEmpleado = null;
        if ($targetEmpleadoId) {
            $targetEmpleado = \App\Models\Empleado::find((int) $targetEmpleadoId);
            if (!$targetEmpleado) {
                return response()->json(['error' => 'Empleado objetivo no encontrado'], 422);
            }

            // Autorizar: admin o encargado del mismo departamento
            $canAssign = $user->hasRole('admin') || (
                is_array($user->roles ?? []) && in_array('encargado', $user->roles) &&
                $user->empleado && $user->empleado->departamento && $user->empleado->departamento === $targetEmpleado->departamento
            );

            if (!$canAssign) {
                return response()->json(['error' => 'No autorizado para asignar tareas a este empleado'], 403);
            }
        } else {
            if (!$user->empleado) {
                return response()->json(['error' => 'El usuario no es un empleado.'], 422);
            }
            $targetEmpleado = $user->empleado;
        }

        // No permitir asignar otra tarea si el empleado ya tiene una tarea activa
        $hasActive = Tarea::where('empleado_id', $targetEmpleado->id)
            ->whereIn('status', ['pendiente', 'en_progreso'])
            ->exists();
        if ($hasActive) {
            return response()->json(['error' => 'El empleado ya tiene una tarea activa. Completa o desasigna antes de asignar otra.'], 409);
        }

        // Evitar duplicados: si ya existe una tarea pendiente para esta habitación y empleado, devolver 409
        $exists = Tarea::where('empleado_id', $targetEmpleado->id)
            ->where('habitacion_id', $habitacion->id)
            ->whereIn('status', ['pendiente', 'en_progreso'])
            ->exists();
        if ($exists) {
            return response()->json(['error' => 'Ya existe una tarea activa para esta habitación y empleado'], 409);
        }

        $tarea = Tarea::create([
            'empleado_id' => $targetEmpleado->id,
            'habitacion_id' => $habitacion->id,
            'descripcion' => 'Atender habitación ' . $habitacion->numero,
            'status' => 'pendiente',
            'created_by' => $user->id,
        ]);

        return response()->json(['tarea' => [
            'id' => $tarea->id,
            'descripcion' => $tarea->descripcion,
            'status' => $tarea->status,
            'habitacion' => ['id' => $habitacion->id, 'numero' => $habitacion->numero],
            'created_at' => $tarea->created_at->toDateTimeString(),
        ]], 201);
    }

    /**
     * Marcar una tarea como completada. Actualiza estado de habitación a 'disponible'.
     */
    public function complete(Request $request, Tarea $tarea): JsonResponse
    {
        $user = $request->user();
        if (!$user->empleado || $user->empleado->id !== $tarea->empleado_id) {
            return response()->json(['error' => 'No autorizado para completar esta tarea'], 403);
        }

        if ($tarea->status === 'completada') {
            return response()->json(['error' => 'Tarea ya completada'], 409);
        }

        // Actualizar dentro de transacción
        DB::transaction(function () use ($tarea, $user) {
            $tarea->status = 'completada';
            $tarea->completed_by = $user->id;
            $tarea->completed_at = now();
            $tarea->save();

            if ($tarea->habitacion) {
                $tarea->habitacion->estado = 'disponible';
                $tarea->habitacion->save();
            }
        });

        return response()->json(['tarea' => [
            'id' => $tarea->id,
            'status' => $tarea->status,
            'completed_by' => $tarea->completed_by,
            'completed_at' => $tarea->completed_at?->toDateTimeString(),
        ]]);
    }

    /**
     * Desasignar una tarea: marcarla como 'cancelada' y devolver la habitación a 'limpieza'
     */
    public function cancel(Request $request, Tarea $tarea): JsonResponse
    {
        $user = $request->user();
        if (!$user->empleado || $user->empleado->id !== $tarea->empleado_id) {
            return response()->json(['error' => 'No autorizado para desasignar esta tarea'], 403);
        }

        if ($tarea->status === 'completada') {
            return response()->json(['error' => 'Tarea ya completada'], 409);
        }

        DB::transaction(function () use ($tarea) {
            $tarea->status = 'cancelada';
            // Limpiamos campos de completado si existieran
            $tarea->completed_by = null;
            $tarea->completed_at = null;
            $tarea->save();

            if ($tarea->habitacion) {
                $tarea->habitacion->estado = 'limpieza';
                $tarea->habitacion->save();
            }
        });

        return response()->json(['tarea' => [
            'id' => $tarea->id,
            'status' => $tarea->status,
        ]]);
    }

    /* Listar tareas completadas por el usuario logueado */
    public function completedByUser(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $tareas = Tarea::where('completed_by', $user->id)
            ->with('habitacion')
            ->orderBy('completed_at', 'desc')
            ->get()
            ->map(function($t) {
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
                        try {
                            $completedTs = \Carbon\Carbon::parse($t->completed_at)->getTimestamp();
                            $createdTs = \Carbon\Carbon::parse($t->created_at)->getTimestamp();
                            $durationSeconds = (int) abs($completedTs - $createdTs);
                            Log::info('Tarea duration calc', ['id' => $t->id, 'created_at' => (string)$t->created_at, 'completed_at' => (string)$t->completed_at, 'seconds' => $durationSeconds]);
                            $interval = \Carbon\CarbonInterval::seconds($durationSeconds);
                            $durationHuman = $interval->forHumans(['join' => true, 'parts' => 3, 'short' => false, 'locale' => 'es']);
                        } catch (\Throwable $e) {
                            $durationSeconds = null;
                            $durationHuman = null;
                            Log::error('Error computing duration timestamps', ['id' => $t->id, 'error' => (string)$e]);
                        }
                    } catch (\Throwable $e) {
                        $durationHuman = null;
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
                    'completed_at' => $completedAt,
                    'duration' => $durationHuman,
                ];
            });

        return response()->json(['tareas' => $tareas]);
    }
}
