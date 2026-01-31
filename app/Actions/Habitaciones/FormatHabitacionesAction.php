<?php

namespace App\Actions\Habitaciones;

use App\Models\TipoHabitacion;
use Illuminate\Support\Collection;

class FormatHabitacionesAction
{
    /* Formatea una colección de habitaciones para el frontend. */
    public function handle(Collection $habitaciones, array $preciosPorTipo = []): array
    {
        $slugs = $habitaciones->pluck('tipo')->unique()->filter()->values()->all();
        $tiposMap = TipoHabitacion::whereIn('slug', $slugs)->get()->keyBy('slug');

        return $habitaciones->map(function ($habitacion) use ($tiposMap, $preciosPorTipo) {
            $tipoModelo = $tiposMap->get($habitacion->tipo);
            $precioTipo = $tipoModelo ? (float) $tipoModelo->precio_base : null;
            $precioEntre = null;
            $precioEntreNoche = null;
            if (isset($preciosPorTipo[$habitacion->tipo]) && is_array($preciosPorTipo[$habitacion->tipo])) {
                $precioEntre = (float)($preciosPorTipo[$habitacion->tipo]['total'] ?? null);
                $precioEntreNoche = isset($preciosPorTipo[$habitacion->tipo]['por_noche']) ? (float)$preciosPorTipo[$habitacion->tipo]['por_noche'] : null;
            }

            return [ 'id' => $habitacion->id, 'numero' => $habitacion->numero, 'tipo' => $habitacion->tipo, 'capacidad' => $habitacion->capacidad,
                     'estado' => $habitacion->estado, 'descripcion' => $habitacion->descripcion, 'notas' => $habitacion->notas,
                     'precioTipo' => $precioTipo, 'precioEntreFechas' => $precioEntre, 'precioEntreNoche' => $precioEntreNoche,
                     'fotos' => $habitacion->fotos->map(function ($foto) {
                        return [ 'id' => $foto->id, 'ruta' => $foto->ruta, 'orden' => $foto->orden, 'url' => asset('storage/' . $foto->ruta) ]; })->values()
            ];
        })->values()->all();
    }
}
