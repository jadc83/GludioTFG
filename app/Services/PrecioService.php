<?php

namespace App\Services;

use Carbon\Carbon;
use App\Models\TipoHabitacion;
use App\Models\Tarifa;
use App\Models\Cupon;
use Yasumi\Yasumi;

class PrecioService
{

    private static ?array $precios = null;
    private static array $proveedorFechas = [];

    /**
     * Obtiene el precio base de un tipo de habitación
     * Carga precios desde base de datos y cachea en memoria
     * Usado por: cálculos de precio en reservas
     * Retorna: precio base como float
     */
    public function getPrecio(string $tipo): float
    {
        $tipo = strtolower(trim($tipo));

        if (self::$precios === null) {
            $mapeo = TipoHabitacion::query()->pluck('precio_base', 'slug')->toArray();
            $preciosFormateados = [];
            foreach ($mapeo as $slug => $precio) {
                $preciosFormateados[strtolower($slug)] = (float) $precio;
            }

            self::$precios = $preciosFormateados;
        }

        return self::$precios[$tipo] ?? 0;
    }

    /**
     * Calcula modificadores de precio según fecha
     * Aplica multiplicadores por temporada alta/media y fines de semana
     * Usado por: precioEntreFechas()
     * Retorna: factor multiplicador como float
     */
    private function getModPrecio(Carbon $fecha): float
    {
        $modificadores = [];

        // Temporada alta: Julio, Agosto, Diciembre 20+
        if ( $fecha->month === 7 || $fecha->month === 8 || ($fecha->month === 12 && $fecha->day >= 20))
        {
            $modificadores[] = 1.5;
        }

        // Temporada media: Marzo 15+, Abril
        if ( ($fecha->month === 3 && $fecha->day >= 15) || $fecha->month === 4 )
        {
            $modificadores[] = 1.2;
        }

        // Fin de semana: Sábado o Domingo
        if ($fecha->isWeekend()) {
            $modificadores[] = 1.25;
        }

        // Festivos españoles (aplicar 1.5x)
        if ($this->esFestivo($fecha)) {
            $modificadores[] = 1.5;
        }

        // Multiplicadores se multiplican entre sí, no se suman
        $modificadorSalida = 1;
        foreach ($modificadores as $modificador) {
            $modificadorSalida *= $modificador;
        }

        return $modificadorSalida;
    }

    /**
     * Calcula precio con modificadores por fecha
     * Aplica multiplicadores de temporada y fin de semana por día
     * Usado por: cálculos detallados de precio
     * Retorna: array con total, promedio, noches y desglose diario
     */
    public function precioMod( string $tipo, Carbon $checkIn, Carbon $checkOut, int $cantidad = 1 ): array
    {
        $precioBase = $this->getPrecio($tipo);

        if ($precioBase <= 0) {
            return [ 'total' => 0, 'precioAvg' => 0, 'desglose' => [], 'error' => 'Tipo de habitación no válido: ' . $tipo ];
        }

        $total = 0;
        $desglose = [];
        $checkinBak = $checkIn->copy();

        while ($checkinBak < $checkOut) {
            $multiplicador = $this->getModPrecio($checkinBak);
            $precioDia = $precioBase * $multiplicador;
            $total += $precioDia;

            $desglose[] = [
                'fecha' => $checkinBak->format('Y-m-d'),
                'dia' => $checkinBak->translatedFormat('l'),
                'precioBase' => $precioBase,
                'multiplicador' => $multiplicador,
                'precioDia' => round($precioDia, 2)
            ];

            $checkinBak->addDay();
        }

        $noches = $checkIn->diffInDays($checkOut);
        $precioTotal = round($total * $cantidad, 2);
        $precioAvg = $noches > 0 ? round($precioTotal / $noches, 2) : 0;

        return [ 'total' => $precioTotal, 'precioAvg' => $precioAvg, 'noches' => $noches, 'desglose' => $desglose ];
    }

    /**
     * Calcula precio sin aplicar tarifas adicionales
     * Suma precios de múltiples habitaciones sin descuentos/promociones
     * Usado por: ReservaService::calcularPrecioTotal()
     * Retorna: array con total y desglose por habitación
     */
    public function precioSinTarifas( array $habitaciones, Carbon $checkIn, Carbon $checkOut ): array
    {
        $montoTotal = 0;
        $datosHabitaciones = [];
        $numeroNoches = $checkIn->diffInDays($checkOut);

        foreach ($habitaciones as $habitacion) {
            if (empty($habitacion['cantidad']) || $habitacion['cantidad'] <= 0) {
                continue;
            }

            $resultado = $this->precioMod( $habitacion['tipo'] ?? '', $checkIn, $checkOut, (int)$habitacion['cantidad'] );

            if (isset($resultado['error'])) {
                return [ 'error' => $resultado['error'], 'total' => 0 ];
            }

            $montoTotal += $resultado['total'];
            $datosHabitaciones[] = [
                'tipo' => $habitacion['tipo'],
                'cantidad' => (int)$habitacion['cantidad'],
                'precioBase' => $this->getPrecio($habitacion['tipo']),
                'precioTotal' => $resultado['total'],
                'precioAvg' => $resultado['precioAvg']
            ];
        }

        return [ 'total' => round($montoTotal, 2), 'habitaciones' => $datosHabitaciones,
                 'checkIn' => $checkIn->format('Y-m-d'), 'checkOut' => $checkOut->format('Y-m-d'),
                 'numeroNoches' => $numeroNoches
        ];
    }

    /**
     * Calcula precio aplicando tarifas adicionales
     * Aplica descuentos, promociones y otros modificadores
     * Usado por: cálculos finales de precio con promociones
     * Retorna: array con precio final y desglose de tarifas
     */
    public function precioConTarifas(array $habitaciones, Carbon $checkIn, Carbon $checkOut, array $tarifas = []): array
    {
        $resultado = $this->precioSinTarifas($habitaciones, $checkIn, $checkOut);

        if (isset($resultado['error'])) {
            return $resultado;
        }

        $subtotal = $resultado['total'] ?? 0;
        $numeroNoches = $resultado['numeroNoches'];

        $habitacionesTotal = 0;

        foreach ($habitaciones as $habitacion) {
            $habitacionesTotal += (int)($habitacion['cantidad'] ?? 0);
        }

        $tarifasAplicadas = [];
        $cargoTarifas = 0.0;

        if (!empty($tarifas)) {
            $tarifaObjs = Tarifa::whereIn('id', $tarifas)->get();
            foreach ($tarifaObjs as $tarifa) {
                $mod = (float)($tarifa->modificador_precio ?? 0);
                $slug = (string)($tarifa->slug ?? '');
                $cargo = 0.0;

                if (stripos($slug, 'desayuno') !== false) {
                    $cargo = 0.0;
                }
                // Aplicar tarifa por noche por habitación para 'media' o 'pension' (incluye 'pension-completa')
                else if (stripos($slug, 'media') !== false || stripos($slug, 'pension') !== false || stripos($slug, 'media-pension') !== false) {
                    $cargo = round($mod * $numeroNoches * max(0, $habitacionesTotal), 2);
                }
                else {
                    $cargo = round($mod, 2);
                }

                $cargoTarifas += $cargo;
                $tarifasAplicadas[] = [ 'id' => $tarifa->id, 'nombre' => $tarifa->nombre, 'slug' => $slug, 'modificador_precio' => $mod, 'cargo' => $cargo ];
            }
        }

        $total = round(($subtotal + $cargoTarifas), 2);

        $resultado['subtotal_habitaciones'] = round($subtotal, 2);
        $resultado['numeroNoches'] = $numeroNoches;
        $resultado['tarifas_aplicadas'] = $tarifasAplicadas;
        $resultado['precioTarifas'] = round($cargoTarifas, 2);
        $resultado['total'] = $total;

        return $resultado;
    }

    private function esFestivo(Carbon $fecha): bool
    {
        $año = (int)$fecha->format('Y');

        if (!isset(self::$proveedorFechas[$año])) {
            try {
                self::$proveedorFechas[$año] = Yasumi::create('Spain', $año);
            } catch (\Exception $e) {
                self::$proveedorFechas[$año] = null;
                return false;
            }
        }

        $aComprobar = self::$proveedorFechas[$año];

        return $aComprobar->isHoliday($fecha);
    }

    /**
     * Calcula precio total entre dos fechas para un tipo de habitación
     * Suma precios diarios con modificadores aplicados
     * Usado por: asignación de habitaciones, extensiones
     * Retorna: precio total como float
     */
    public function precioEntreFechas(string $tipo, Carbon $checkIn, Carbon $checkOut): float
    {
        $precioBase = $this->getPrecio($tipo);

        if ($precioBase <= 0) {
            return 0;
        }

        $total = 0;
        $fecha = $checkIn->copy();

        while ($fecha->lt($checkOut)) {
            $modificador = $this->getModPrecio($fecha);
            $total += round($precioBase * $modificador, 2);
            $fecha->addDay();
        }

        return round($total, 2);
    }

    /**
     * Obtiene precios por día en un rango de fechas
     * Calcula precio diario con modificadores para calendario
     * Usado por: visualización de precios en calendario
     * Retorna: array asociativo fecha => precio
     */
    public function diaPrecio(Carbon $inicio, Carbon $fin): array
    {
        $tipos = TipoHabitacion::pluck('slug')->toArray();
        $resultados = [];
        $fecha = $inicio->copy();
        while ($fecha->lte($fin)) {

            $minimo = null;

            foreach ($tipos as $tipo) {
                $precioDia = $this->precioEntreFechas($tipo, $fecha, $fecha->copy()->addDay());
                if ($minimo === null || $precioDia < $minimo) {
                    $minimo = $precioDia;
                }
            }
            $key = $fecha->format('Y-m-d');
            $resultados[$key] = $minimo !== null ? round($minimo, 2) : null;
            $fecha->addDay();
        }

        return $resultados;
    }

    /**
     * Obtiene precios para todos los días de un mes
     * Útil para precargar datos de calendario mensual
     * Usado por: optimización de carga de calendario
     * Retorna: array de precios por día del mes
     */
    public function preciosMes(int $año, int $mes): array
    {
        $inicio = Carbon::createFromDate($año, $mes, 1)->startOfMonth();
        $fin = $inicio->copy()->endOfMonth();
        return $this->diaPrecio($inicio, $fin);
    }

    /**
     * Calcula precio completo incluyendo base, modificadores, tarifas y cupón
     * Método unificado que reemplaza múltiples cálculos separados
     * Usado por: ReservaService::prepararDatosReserva()
     * Retorna: array con precio_total, descuento_aplicado, tarifa_ids
     */
    public function calcularPrecioCompleto(array $habitaciones, Carbon $checkIn, Carbon $checkOut, array $tarifas = [], ?int $cuponId = null): array
    {
        // Calcular precio base con modificadores
        $resultadoBase = $this->precioSinTarifas($habitaciones, $checkIn, $checkOut);
        if (isset($resultadoBase['error'])) {
            return $resultadoBase;
        }

        $precioTotal = $resultadoBase['total'];

        // Aplicar tarifas adicionales
        $tarifaIds = [];
        foreach ($tarifas as $tarifaId) {
            $tarifa = Tarifa::find($tarifaId);
            if ($tarifa) {
                $precioTotal += $tarifa->modificador_precio ?? 0;
                $tarifaIds[] = $tarifaId;
            }
        }

        // Aplicar cupón si existe
        $descuentoAplicado = 0;
        if ($cuponId) {
            $cupon = Cupon::find($cuponId);
            if ($cupon && $cupon->activo && now()->between($cupon->fecha_inicio, $cupon->fecha_fin)) {
                $descuentoAplicado = $cupon->tipo === 'porcentaje'
                    ? ($precioTotal * $cupon->valor / 100)
                    : $cupon->valor;
                $descuentoAplicado = min($descuentoAplicado, $precioTotal);
            }
        }

        return [
            'precio_total' => round($precioTotal, 2),
            'descuento_aplicado' => round($descuentoAplicado, 2),
            'tarifa_ids' => $tarifaIds,
            'desglose' => $resultadoBase
        ];
    }

}
