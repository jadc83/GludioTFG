<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\TipoHabitacion;
use Illuminate\Http\JsonResponse;

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
}
