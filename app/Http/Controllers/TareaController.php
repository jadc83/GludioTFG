<?php

namespace App\Http\Controllers;

use App\Models\Tarea;
use App\Models\Habitacion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
        if (!$user->hasAnyRole(['limpieza', 'mantenimiento'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if (!$user->empleado) {
            return response()->json(['tareas' => []]);
        }

        $tareas = Tarea::where('empleado_id', $user->empleado->id)
            ->whereIn('status', ['pendiente', 'en_progreso'])
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
     * Asignar una habitacion al empleado logueado creando una tarea
     * POST body: { habitacion_id }
     */
    public function assignRoom(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->hasAnyRole(['limpieza', 'mantenimiento'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $habitacionId = (int) $request->input('habitacion_id');
        $habitacion = Habitacion::find($habitacionId);
        if (!$habitacion) {
            return response()->json(['error' => 'Habitación no encontrada'], 404);
        }

        if (!$user->empleado) {
            return response()->json(['error' => 'Empleado no encontrado para el usuario'], 422);
        }

        // No permitir asignar otra tarea si el empleado ya tiene una tarea activa
        $hasActive = Tarea::where('empleado_id', $user->empleado->id)
            ->whereIn('status', ['pendiente', 'en_progreso'])
            ->exists();
        if ($hasActive) {
            return response()->json(['error' => 'Ya tienes una tarea activa. Completa o desasigna antes de asignar otra.'], 409);
        }

        // Evitar duplicados: si ya existe una tarea pendiente para esta habitación y empleado, devolver 409
        $exists = Tarea::where('empleado_id', $user->empleado->id)
            ->where('habitacion_id', $habitacion->id)
            ->whereIn('status', ['pendiente', 'en_progreso'])
            ->exists();
        if ($exists) {
            return response()->json(['error' => 'Ya existe una tarea activa para esta habitación'], 409);
        }

        $tarea = Tarea::create([
            'empleado_id' => $user->empleado->id,
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
        if (!$user->hasAnyRole(['limpieza', 'mantenimiento'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if (!$user->empleado || $user->empleado->id !== $tarea->empleado_id) {
            return response()->json(['error' => 'No autorizado para completar esta tarea'], 403);
        }

        if ($tarea->status === 'completada') {
            return response()->json(['error' => 'Tarea ya completada'], 409);
        }

        // Actualizar dentro de transacción
        \DB::transaction(function () use ($tarea, $user) {
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
        if (!$user->hasAnyRole(['limpieza', 'mantenimiento'])) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        if (!$user->empleado || $user->empleado->id !== $tarea->empleado_id) {
            return response()->json(['error' => 'No autorizado para desasignar esta tarea'], 403);
        }

        if ($tarea->status === 'completada') {
            return response()->json(['error' => 'Tarea ya completada'], 409);
        }

        \DB::transaction(function () use ($tarea, $user) {
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

    /**
     * Listar tareas completadas por el usuario logueado
     */
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
                            \Log::info('Tarea duration calc', ['id' => $t->id, 'created_at' => (string)$t->created_at, 'completed_at' => (string)$t->completed_at, 'seconds' => $durationSeconds]);
                            $interval = \Carbon\CarbonInterval::seconds($durationSeconds);
                            $durationHuman = $interval->forHumans(['join' => true, 'parts' => 3, 'short' => false, 'locale' => 'es']);
                        } catch (\Throwable $e) {
                            $durationSeconds = null;
                            $durationHuman = null;
                            \Log::error('Error computing duration timestamps', ['id' => $t->id, 'error' => (string)$e]);
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
