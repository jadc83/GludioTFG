<?php

namespace App\Services;

use App\Models\Habitacion;
use Carbon\Carbon;

class HabitacionService
{
    private PrecioService $precioService;

    public function __construct(?PrecioService $precioService = null)
    {
        $this->precioService = $precioService ?? new PrecioService();
    }

    private function formatearHabitaciones($habitaciones, Carbon $checkIn, Carbon $checkOut): array
    {

        $grupos = [];

        foreach ($habitaciones as $habitacion) {
            $tipo = $habitacion->tipo;

            if (!isset($grupos[$tipo])) {

                $grupos[$tipo] = [ 'tipo' => $tipo, 'cantidad' => 0, 'capacidadMaxima' => 0, 'precioMinimo' => null,
                    'precioNoche' => 0, 'precioTotal' => 0, 'habitaciones' => [],
                ];

            }

            $grupos[$tipo]['cantidad']++;
            $grupos[$tipo]['capacidadMaxima'] = max($grupos[$tipo]['capacidadMaxima'], $habitacion->capacidad ?? 1);
            $grupos[$tipo]['habitaciones'][] = [ 'id' => $habitacion->id, 'numero' => $habitacion->numero,
                'tipo' => $habitacion->tipo, 'capacidad' => $habitacion->capacidad, 'descripcion' => $habitacion->descripcion ];
        }

        foreach ($grupos as $tipo => &$grupo) {

            // Calcular precios usando la Action dedicada
            try {
                $action = app(\App\Actions\Habitaciones\CalcularPreciosPorTipoAction::class);
                $preciosMap = $action->handle([$tipo], $checkIn, $checkOut);
                $precioData = $preciosMap[$tipo] ?? null;
                $grupo['precioTotal'] = $precioData['total'] ?? 0;
                $grupo['precioNoche'] = $precioData['por_noche'] ?? 0;
                $grupo['precioMinimo'] = $grupo['precioNoche'];
            } catch (\Throwable $e) {
                $grupo['precioNoche'] = 0;
                $grupo['precioTotal'] = 0;
                $grupo['precioMinimo'] = null;
            }
        }

        return array_values($grupos);
    }

    public function getDisponibles(Carbon $checkIn, Carbon $checkOut, bool $summary = false): array
    {
        // Obtener todas las habitaciones no en mantenimiento
        $habitacionesBase = Habitacion::where('estado', '!=', 'mantenimiento')->orderBy('numero')->get();

        // Agrupar por tipo y calcular slots disponibles considerando reservas asignadas y placeholders
        $tipos = $habitacionesBase->pluck('tipo')->unique()->filter()->values();

        $seleccionadas = collect();

        foreach ($tipos as $tipo) {
            $roomsOfTipo = $habitacionesBase->where('tipo', $tipo);
            $roomIds = $roomsOfTipo->pluck('id')->all();

            // Contar habitaciones asignadas (distinct habitacion_id) que solapan
            $assignedCount = \App\Models\HabitacionReserva::whereNotNull('habitacion_id')
                ->whereIn('habitacion_id', $roomIds)
                ->where('check_in', '<', $checkOut->format('Y-m-d'))
                ->where('check_out', '>', $checkIn->format('Y-m-d'))
                ->distinct('habitacion_id')
                ->count('habitacion_id');

            // Contar placeholders por tipo que solapan
            $placeholdersCount = \App\Models\HabitacionReserva::whereNull('habitacion_id')
                ->where('tipo', $tipo)
                ->where('check_in', '<', $checkOut->format('Y-m-d'))
                ->where('check_out', '>', $checkIn->format('Y-m-d'))
                ->count();

            $totalRooms = count($roomIds);
            $availableSlots = max(0, $totalRooms - ($assignedCount + $placeholdersCount));

            if ($availableSlots <= 0) {
                continue;
            }

            // Seleccionar habitaciones del tipo que no tienen reservas asignadas que solapen
            $candidateRooms = $roomsOfTipo->filter(function ($h) use ($checkIn, $checkOut) {
                return !$h->reservas()->where('check_in', '<', $checkOut->format('Y-m-d'))
                    ->where('check_out', '>', $checkIn->format('Y-m-d'))
                    ->exists();
            })->values();

            $toAdd = $candidateRooms->slice(0, $availableSlots);
            $seleccionadas = $seleccionadas->concat($toAdd);
        }

        $disponibles = $seleccionadas->sortBy('numero')->values();

        $formateadas = $this->formatearHabitaciones($disponibles, $checkIn, $checkOut);

        if ($summary) {
            $resumen = [];
            foreach ($formateadas as $grupo) {
                $resumen[$grupo['tipo']] = [
                    'cantidad' => $grupo['cantidad'],
                    'capacidadMaxima' => $grupo['capacidadMaxima'],
                ];
            }

            return $resumen;
        }

        return $formateadas;
    }

    public function getImagen(string $tipo): string
    {
        $imagenes = [
            'individual' => 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop',
            'doble' => 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=400&h=300&fit=crop',
            'familiar' => 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=400&h=300&fit=crop',
            'suite' => 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop',
        ];

        return $imagenes[strtolower($tipo)] ?? 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=400&h=300&fit=crop';
    }

    /**
     * Cuenta habitaciones disponibles por tipo.
     * Si $considerarPlaceholders = false se hace una consulta agregada rápida (no considera placeholders).
     * Si $considerarPlaceholders = true devuelve la disponibilidad real teniendo en cuenta habitaciones asignadas y placeholders (HabitacionReserva).
     */
    public function contarDisponiblesPorTipo(Carbon $checkIn, Carbon $checkOut, bool $considerarPlaceholders = false): array
    {
        if (! $considerarPlaceholders) {
            $disponibles = Habitacion::selectRaw('tipo, COUNT(*) as cantidad, MAX(capacidad) as capacidadMaxima')
                ->where('estado', '!=', 'mantenimiento')
                ->whereDoesntHave('reservas', function ($consulta) use ($checkIn, $checkOut) {
                    $consulta->where('check_in', '<', $checkOut)
                      ->where('check_out', '>', $checkIn);
                })
                ->groupBy('tipo')
                ->get();

            $resumen = [];
            foreach ($disponibles as $disponible) {
                $resumen[$disponible->tipo] = [ 'cantidad' => (int)$disponible->cantidad, 'capacidadMaxima' => (int)$disponible->capacidadMaxima ];
            }

            return $resumen;
        }

        // Considerar placeholders y habitaciones ya asignadas (más preciso, pero más consultas)
        // Totales por tipo (excluyendo mantenimiento)
        $totales = Habitacion::where('estado', '!=', 'mantenimiento')
            ->selectRaw('tipo, COUNT(*) as total, MAX(capacidad) as capacidadMaxima')
            ->groupBy('tipo')
            ->get()
            ->keyBy('tipo');

        // Habitaciones asignadas (distinct habitacion_id) que se solapan
        $ocupadasAsignadas = \App\Models\HabitacionReserva::whereNotNull('habitacion_id')
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn)
            ->join('habitaciones', 'habitacion_reserva.habitacion_id', '=', 'habitaciones.id')
            ->where('habitaciones.estado', '!=', 'mantenimiento')
            ->selectRaw('habitaciones.tipo, COUNT(DISTINCT habitacion_reserva.habitacion_id) as cnt')
            ->groupBy('habitaciones.tipo')
            ->pluck('cnt', 'tipo')
            ->toArray();

        // Placeholders por tipo
        $placeholders = \App\Models\HabitacionReserva::whereNull('habitacion_id')
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn)
            ->selectRaw('tipo, COUNT(*) as cnt')
            ->groupBy('tipo')
            ->pluck('cnt', 'tipo')
            ->toArray();

        $resumen = [];
        foreach ($totales as $tipo => $row) {
            $total = (int)$row->total;
            $capacidadMaxima = (int)$row->capacidadMaxima;
            $ocupadas = (int)($ocupadasAsignadas[$tipo] ?? 0) + (int)($placeholders[$tipo] ?? 0);
            $disponible = max(0, $total - $ocupadas);

            $resumen[$tipo] = ['cantidad' => $disponible, 'capacidadMaxima' => $capacidadMaxima];
        }

        return $resumen;
    }
}
