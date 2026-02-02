<?php

namespace App\Services;

use App\Models\Tarifa;

class TarifasService
{
    /**
     * Obtiene todas las tarifas ordenadas por ID
     */
    public function obtenerTodas(): \Illuminate\Database\Eloquent\Collection
    {
        return Tarifa::orderBy('id')->get();
    }

    /**
     * Obtiene una tarifa por ID
     */
    public function obtenerPorId(int $id): ?Tarifa
    {
        return Tarifa::find($id);
    }

    /**
     * Obtiene tarifas activas
     */
    public function obtenerActivas(): \Illuminate\Database\Eloquent\Collection
    {
        return Tarifa::where('activa', true)->orderBy('id')->get();
    }
}
