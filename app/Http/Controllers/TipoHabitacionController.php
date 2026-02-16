<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TipoHabitacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Gate;

class TipoHabitacionController extends Controller
{
    /**
     * Lista los tipos de habitación con su precio base.
     */
    public function index(): JsonResponse
    {
        $map = TipoHabitacion::query()->get(['slug', 'precio_base'])->mapWithKeys(function ($item) {
            return [$item->slug => (float) $item->precio_base];
        });

        return response()->json(['data' => $map]);
    }

    /**
     * Actualiza un tipo de habitación.
     */
    public function update(TipoHabitacion $tipoHabitacion, \Illuminate\Http\Request $request): JsonResponse
    {
        // Solo permitir cambios a usuarios con rol 'admin'
        try {
            if (! auth()->check() || ! Auth::user()->hasRole('admin')) {
                \Illuminate\Support\Facades\Log::info('TipoHabitacion update denied', [
                    'user' => auth()->user()?->id ?? null,
                    'roles' => auth()->user()?->getRoleNames()->toArray() ?? [],
                    'tipoHabitacion' => $tipoHabitacion->id ?? null,
                ]);
                abort(403);
            }
        } catch (\Throwable $e) {
            abort(403);
        }

        $validated = $request->validate([
            'nombre' => 'required|string',
            'capacidad' => 'required|integer|min:1',
            'precio_base' => 'required|numeric|min:0',
        ]);

        $tipoHabitacion->update($validated);

        return response()->json([
            'success' => true,
            'data' => $tipoHabitacion,
        ]);
    }
}
