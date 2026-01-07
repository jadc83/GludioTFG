<?php

namespace App\Services;

use App\Models\Habitacion;
use Carbon\Carbon;

class HabitacionService
{
    private PrecioService $precioService;

    public function __construct(PrecioService $precioService = null)
    {
        $this->precioService = $precioService ?? new PrecioService();
    }

    /**
     * Obtiene habitaciones disponibles para un rango de fechas
     */
    public function obtenerDisponibles(Carbon $checkIn, Carbon $checkOut): array
    {
        // Buscar habitaciones que NO tienen reservas que se solapan con el rango
        // Y que no estén en estado 'ocupada' o 'mantenimiento'
        $habitacionesDisponibles = Habitacion::whereIn('estado', ['disponible', 'limpieza'])
            ->whereDoesntHave('reservas', function ($query) use ($checkIn, $checkOut) {
                // Una reserva se solapa si:
                // check_in < checkout solicitado Y check_out > checkin solicitado
                $query->where('check_in', '<', $checkOut)
                      ->where('check_out', '>', $checkIn);
            })->get();

        return $this->agruparYEnriquecer($habitacionesDisponibles, $checkIn, $checkOut);
    }

    /**
     * Agrupa habitaciones por tipo
     */
    private function agruparYEnriquecer($habitaciones, Carbon $checkIn, Carbon $checkOut): array
    {
        $agrupadasPorTipo = [];

        foreach ($habitaciones as $habitacion) {
            $tipo = $habitacion->tipo;

            if (!isset($agrupadasPorTipo[$tipo])) {
                $agrupadasPorTipo[$tipo] = [
                    'tipo' => $tipo,
                    'cantidad' => 0,
                    'capacidadMaxima' => 0,
                    'precioMinimo' => INF,
                    'precioNoche' => 0,
                    'precioTotal' => 0,
                    'habitaciones' => [],
                ];
            }

            $agrupadasPorTipo[$tipo]['cantidad']++;
            $agrupadasPorTipo[$tipo]['capacidadMaxima'] = max(
                $agrupadasPorTipo[$tipo]['capacidadMaxima'],
                $habitacion->capacidad ?? 1
            );

            // Calcular precio dinámico
            $noches = $checkOut->diffInDays($checkIn);

            // Calcular precio usando PrecioService
            $precioCalculo = $this->precioService->calcularPrecioDinamico(
                $habitacion->tipo,
                $checkIn,
                $checkOut
            );

            $precioTotal = $precioCalculo['total'] ?? 0;
            $precioPorNoche = $precioCalculo['precioPromedioPorNoche'] ?? 0;

            // Mantener el precio mínimo encontrado
            $agrupadasPorTipo[$tipo]['precioMinimo'] = min(
                $agrupadasPorTipo[$tipo]['precioMinimo'],
                $precioPorNoche
            );
            $agrupadasPorTipo[$tipo]['precioNoche'] = $precioPorNoche;
            $agrupadasPorTipo[$tipo]['precioTotal'] = $precioTotal;
            $agrupadasPorTipo[$tipo]['habitaciones'][] = [
                'id' => $habitacion->id,
                'numero' => $habitacion->numero,
                'tipo' => $habitacion->tipo,
                'capacidad' => $habitacion->capacidad,
                'descripcion' => $habitacion->descripcion,
            ];
        }

        // Normalizar precioMinimo infinito a null
        foreach ($agrupadasPorTipo as &$grupo) {
            if ($grupo['precioMinimo'] === INF) {
                $grupo['precioMinimo'] = null;
            }
        }

        return array_values($agrupadasPorTipo);
    }

    /**
     * Obtiene el icono Unicode para un tipo de habitación
     */
    public function getIcono(string $tipo): string
    {
        $iconos = [
            'individual' => '🛏️',
            'doble' => '🛏️🛏️',
            'familiar' => '👨‍👩‍👧‍👦',
            'suite' => '👑',
        ];

        return $iconos[strtolower($tipo)] ?? '🏨';
    }

    /**
     * Obtiene la URL de imagen para un tipo de habitación
     */
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
     * Obtiene metadatos de habitación (icono, imagen, etc.)
     */
    public function obtenerMetadatos(string $tipo): array
    {
        return [
            'tipo' => $tipo,
            'icono' => $this->getIcono($tipo),
            'imagen' => $this->getImagen($tipo),
        ];
    }

    /**
     * Cuenta habitaciones disponibles por tipo
     */
    public function contarDisponiblesPorTipo(Carbon $checkIn, Carbon $checkOut): array
    {
        $disponibles = $this->obtenerDisponibles($checkIn, $checkOut);

        $resumen = [];
        foreach ($disponibles as $grupo) {
            $resumen[$grupo['tipo']] = [
                'cantidad' => $grupo['cantidad'],
                'capacidadMaxima' => $grupo['capacidadMaxima'],
            ];
        }

        return $resumen;
    }

    /**
     * Valida si hay suficientes habitaciones disponibles
     */
    public function validarDisponibilidad(array $habitacionesRequeridas, Carbon $checkIn, Carbon $checkOut): bool
    {
        $disponibles = $this->contarDisponiblesPorTipo($checkIn, $checkOut);

        foreach ($habitacionesRequeridas as $req) {
            $tipo = strtolower($req['tipo'] ?? '');
            $cantidad = intval($req['cantidad'] ?? 0);

            if ($cantidad > 0) {
                if (!isset($disponibles[$tipo]) || $disponibles[$tipo]['cantidad'] < $cantidad) {
                    throw new \Exception(
                        "No hay {$cantidad} habitación/es de tipo '{$tipo}' disponibles."
                    );
                }
            }
        }

        return true;
    }
}
