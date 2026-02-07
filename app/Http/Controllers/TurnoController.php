<?php

namespace App\Http\Controllers;

use App\Models\Turno;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Carbon;

class TurnoController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    /**
     * List turnos for the logged-in empleado
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->empleado) {
            return response()->json(['turnos' => []]);
        }

        $turnos = Turno::where('empleado_id', $user->empleado->id)->orderBy('starts_at', 'asc')->get()->map(function ($t) {
            return [
                'id' => $t->id,
                'title' => $t->actividad ?: 'Turno',
                'start' => $t->starts_at?->toDateTimeString(),
                'end' => $t->ends_at?->toDateTimeString(),
                'meta' => $t->meta,
            ];
        });

        return response()->json(['turnos' => $turnos]);
    }

    /**
     * Create new turno for logged-in empleado
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 422);
        }

        $data = $request->validate([
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'actividad' => 'nullable|string|max:255',
            'meta' => 'nullable|array',
        ]);

        $starts = Carbon::parse($data['starts_at']);
        $ends = Carbon::parse($data['ends_at']);

        // Check overlap (exclusive): allow back-to-back shifts (e.g. 08:00-12:00 and 12:00-16:00)
        $exists = Turno::where('empleado_id', $user->empleado->id)
            ->where(function ($q) use ($starts, $ends) {
                // overlap iff existing.starts_at < new_ends AND existing.ends_at > new_starts
                $q->where('starts_at', '<', $ends)
                  ->where('ends_at', '>', $starts);
            })->exists();

        if ($exists) {
            return response()->json(['error' => 'Solapamiento detectado con otro turno'], 409);
        }

        $turno = Turno::create([
            'empleado_id' => $user->empleado->id,
            'created_by' => $user->id,
            'actividad' => $data['actividad'] ?? null,
            'starts_at' => $starts,
            'ends_at' => $ends,
            'meta' => $data['meta'] ?? null,
        ]);

        return response()->json(['turno' => $turno], 201);
    }

    /**
     * Update turno (move / resize / edit)
     */
    public function update(Request $request, Turno $turno): JsonResponse
    {
        $user = $request->user();
        if (!$user->empleado || $turno->empleado_id !== $user->empleado->id) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $data = $request->validate([
            'starts_at' => 'required|date',
            'ends_at' => 'required|date|after:starts_at',
            'actividad' => 'nullable|string|max:255',
            'meta' => 'nullable|array',
        ]);

        $starts = Carbon::parse($data['starts_at']);
        $ends = Carbon::parse($data['ends_at']);

        $exists = Turno::where('empleado_id', $user->empleado->id)
            ->where('id', '!=', $turno->id)
            ->where(function ($q) use ($starts, $ends) {
                // overlap iff existing.starts_at < new_ends AND existing.ends_at > new_starts
                $q->where('starts_at', '<', $ends)
                  ->where('ends_at', '>', $starts);
            })->exists();

        if ($exists) {
            return response()->json(['error' => 'Solapamiento detectado con otro turno'], 409);
        }

        $turno->actividad = $data['actividad'] ?? $turno->actividad;
        $turno->starts_at = $starts;
        $turno->ends_at = $ends;
        $turno->meta = $data['meta'] ?? $turno->meta;
        $turno->save();

        return response()->json(['turno' => $turno]);
    }

    /**
     * Delete turno
     */
    public function destroy(Request $request, Turno $turno): JsonResponse
    {
        $user = $request->user();
        if (!$user->empleado || $turno->empleado_id !== $user->empleado->id) {
            return response()->json(['error' => 'No autorizado'], 403);
        }

        $turno->delete();
        return response()->json(['success' => true]);
    }

    /**
     * Clear all turnos for the logged-in empleado and return deleted records
     */
    public function clear(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->empleado) {
            return response()->json(['error' => 'Empleado no encontrado'], 422);
        }

        $turnos = Turno::where('empleado_id', $user->empleado->id)->get();
        $deleted = $turnos->map(function ($t) {
            return [
                'actividad' => $t->actividad,
                'starts_at' => (string) $t->starts_at,
                'ends_at' => (string) $t->ends_at,
                'meta' => $t->meta,
            ];
        })->values();

        // Delete all
        Turno::where('empleado_id', $user->empleado->id)->delete();

        return response()->json(['deleted' => $deleted]);
    }
}
