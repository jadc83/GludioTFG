<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TipoHabitacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TipoHabitacionController extends Controller
{
    /**
     * Lista los tipos de habitación con su precio base (backend).
     */
    public function index(): JsonResponse
    {
        $map = TipoHabitacion::query()->get(['slug', 'precio_base'])->mapWithKeys(function ($item) {
            return [$item->slug => (float) $item->precio_base];
        });

        return response()->json(['data' => $map]);
    }

    public function list(): JsonResponse
    {
        $tipos = TipoHabitacion::all(['id', 'nombre', 'slug', 'capacidad', 'precio_base']);
        return response()->json(['data' => $tipos]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'slug' => 'required|string|unique:habitaciones_tipos,slug',
            'capacidad' => 'required|integer|min:1',
            'precio_base' => 'required|numeric|min:0',
        ]);

        $tipo = TipoHabitacion::create($validated);

        return response()->json(['data' => $tipo, 'message' => 'Tipo creado exitosamente'], 201);
    }

    public function update(Request $request, TipoHabitacion $tipoHabitacion): JsonResponse
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:255',
            'slug' => 'required|string|unique:habitaciones_tipos,slug,' . $tipoHabitacion->id,
            'capacidad' => 'required|integer|min:1',
            'precio_base' => 'required|numeric|min:0',
        ]);

        $tipoHabitacion->update($validated);

        return response()->json(['data' => $tipoHabitacion, 'message' => 'Tipo actualizado exitosamente']);
    }


    public function destroy(TipoHabitacion $tipoHabitacion): JsonResponse
    {
        $tipoHabitacion->delete();

        return response()->json(['message' => 'Tipo eliminado exitosamente']);
    }
}
