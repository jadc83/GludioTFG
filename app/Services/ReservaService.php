<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Reserva;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;

class ReservaService
{
    private PrecioService $precioService;

    public function __construct(PrecioService $precioService = null)
    {
        $this->precioService = $precioService ?? new PrecioService();
    }

    /**
     * Prepara y valida los datos de una reserva antes de crear
     */
    public function prepararDatosReserva(array $datos): array
    {
        // Validar fechas
        $checkIn = Carbon::parse($datos['check_in'] ?? null);
        $checkOut = Carbon::parse($datos['check_out'] ?? null);

        if (!$checkIn || !$checkOut) {
            throw new \Exception('Fechas inválidas proporcionadas.');
        }

        if ($checkOut->lte($checkIn)) {
            throw new \Exception('La fecha de salida debe ser posterior a la de entrada.');
        }

        // Validar y procesar habitaciones
        $habitaciones = $this->validarHabitaciones($datos['habitaciones'] ?? []);

        if (empty($habitaciones)) {
            throw new \Exception('Debe seleccionar al menos una habitación.');
        }

        // Calcular precio total
        $precioTotal = $this->calcularPrecioTotal($habitaciones, $checkIn, $checkOut);

        return [
            'nombre' => $datos['name'] ?? null,
            'email' => $datos['email'] ?? null,
            'telefono' => $datos['telefono'] ?? null,
            'tipo_documento' => $datos['tipo_documento'] ?? 'dni',
            'numero_documento' => $datos['numero_documento'] ?? null,
            'nacionalidad' => $datos['nacionalidad'] ?? '',
            'direccion' => $datos['direccion'] ?? null,
            'check_in' => $checkIn,
            'check_out' => $checkOut,
            'habitaciones' => $habitaciones,
            'precio_total' => $precioTotal,
            'reservable_id' => $datos['reservable_id'] ?? null,
            'tipo_usuario' => $datos['tipo_usuario'] ?? 'cliente',
            'booked_by_user_id' => $datos['booked_by_user_id'] ?? null,
        ];
    }

    /**
     * Valida la selección de habitaciones
     */
    private function validarHabitaciones(array $habitaciones): array
    {
        $validadas = [];
        $tiposValidos = ['doble', 'familiar', 'suite'];

        foreach ($habitaciones as $hab) {
            $tipo = strtolower(trim($hab['tipo'] ?? ''));
            $cantidad = intval($hab['cantidad'] ?? 0);

            if (!in_array($tipo, $tiposValidos, true)) {
                throw new \Exception("Tipo de habitación no válido: {$tipo}");
            }

            if ($cantidad <= 0) {
                continue;
            }

            $personas = intval($hab['personas_por_habitacion'] ?? 1);
            if ($personas < 1) {
                throw new \Exception("Número de personas inválido para habitación {$tipo}");
            }

            $validadas[] = [
                'tipo' => $tipo,
                'cantidad' => $cantidad,
                'personas_por_habitacion' => $personas,
            ];
        }

        return $validadas;
    }

    /**
     * Calcula el precio total de la reserva
     */
    private function calcularPrecioTotal(array $habitaciones, Carbon $checkIn, Carbon $checkOut): float
    {
        $resultado = $this->precioService->calcularMontoTotal($habitaciones, $checkIn, $checkOut);

        if (isset($resultado['error'])) {
            throw new \Exception($resultado['error']);
        }

        return $resultado['total'] ?? 0;
    }

    /**
     * Genera un localizador único para la reserva
     */
    public function generarLocalizador(): string
    {
        do {
            $localizador = 'G' . strtoupper(Str::random(6));
        } while (Reserva::where('localizador', $localizador)->exists());

        return $localizador;
    }

    /**
     * Obtiene o crea el cliente para la reserva
     */
    public function obtenerOCrearCliente(array $datos): string
    {
        // Si hay un cliente/usuario especificado, usarlo
        if (!empty($datos['reservable_id'])) {
            return $datos['reservable_id'];
        }

        // Buscar cliente existente por DNI
        if (!empty($datos['numero_documento'])) {
            $clienteExistente = Cliente::where('numero_documento', $datos['numero_documento'])->first();

            if ($clienteExistente) {
                // Caso 1: Datos coinciden exactamente → reutilizar
                if ($this->datosCoinciden($clienteExistente, $datos)) {
                    return $clienteExistente->id;
                }

                // Caso 2: DNI existe, datos diferentes
                // Lanzar excepción especial para que frontend pueda pedir confirmación
                throw new \Exception(
                    json_encode([
                        'codigo' => 'cliente_existe_sin_confirmacion',
                        'cliente_existente' => [
                            'id' => $clienteExistente->id,
                            'name' => $clienteExistente->name,
                            'email' => $clienteExistente->email,
                            'numero_documento' => $clienteExistente->numero_documento,
                        ],
                    ])
                );
            }
        }

        // Buscar cliente existente por email
        if (!empty($datos['email'])) {
            $clienteExistente = Cliente::where('email', $datos['email'])->first();

            if ($clienteExistente) {
                return $clienteExistente->id;
            }
        }

        // Crear nuevo cliente
        return $this->crearCliente($datos);
    }

    /**
     * Valida si los datos coinciden con un cliente existente
     */
    private function datosCoinciden(Cliente $cliente, array $datos): bool
    {
        return strcasecmp(trim($cliente->name), trim($datos['nombre'] ?? '')) === 0 &&
               $cliente->email === ($datos['email'] ?? null) &&
               $cliente->telefono === ($datos['telefono'] ?? null);
    }

    /**
     * Crea un nuevo cliente
     */
    private function crearCliente(array $datos): string
    {
        // Procesar dirección - puede venir como array o string
        $direccion = $datos['direccion'] ?? 'Sin dirección';
        if (is_array($direccion)) {
            $partes = array_filter([
                $direccion['calle'] ?? null,
                $direccion['codigo_postal'] ?? null,
                $direccion['ciudad'] ?? null,
                $direccion['pais'] ?? null,
            ]);
            $direccion = !empty($partes) ? implode(', ', $partes) : 'Sin dirección';
        }

        $cliente = Cliente::create([
            'name' => $datos['nombre'] ?? 'Sin nombre',
            'email' => $datos['email'] ?? null,
            'telefono' => $datos['telefono'] ?? null,
            'tipo_documento' => $datos['tipo_documento'] ?? 'dni',
            'numero_documento' => $datos['numero_documento'] ?? null,
            'nacionalidad' => $datos['nacionalidad'] ?? '',
            'direccion' => $direccion,
        ]);

        return $cliente->id;
    }

    /**
     * Verifica disponibilidad de habitaciones para un rango de fechas
     */
    public function verificarDisponibilidad(array $habitacionesRequeridas, Carbon $checkIn, Carbon $checkOut): bool
    {
        foreach ($habitacionesRequeridas as $hab) {
            $tipo = $hab['tipo'] ?? null;
            $cantidad = $hab['cantidad'] ?? 0;

            if ($cantidad <= 0) continue;

            $disponibles = $this->contarHabitacionesDisponibles($tipo, $checkIn, $checkOut);

            if ($disponibles < $cantidad) {
                throw new \Exception(
                    "No hay {$cantidad} habitación/es de tipo '{$tipo}' disponibles para las fechas seleccionadas."
                );
            }
        }

        return true;
    }

    /**
     * Cuenta cuántas habitaciones de un tipo están disponibles
     */
    private function contarHabitacionesDisponibles(string $tipo, Carbon $checkIn, Carbon $checkOut): int
    {
        return Habitacion::where('tipo', $tipo)
            ->whereDoesntHave('reservas', function ($query) use ($checkIn, $checkOut) {
                // Hay conflicto si: check_in_nueva < check_out_existente AND check_out_nueva > check_in_existente
                $query->where('check_in', '<', $checkOut)
                      ->where('check_out', '>', $checkIn);
            })
            ->count();
    }

    /**
     * Calcula la cantidad de noches de una reserva
     */
    public function calcularNoches($checkIn, $checkOut): int
    {
        return DateService::calcularNoches($checkIn, $checkOut);
    }

    /**
     * Calcula el precio promedio por noche
     * Se usa para mostrar en desglose de factura
     */
    public function calcularPrecioPromedioPorNoche($precioTotal, $noches, $habitaciones): float
    {
        if ($noches <= 0 || $habitaciones <= 0) {
            return 0;
        }

        return round($precioTotal / $noches / $habitaciones, 2);
    }

    /**
     * Obtiene el resumen de una reserva para mostrar en pantalla
     * Unifica datos de múltiples tablas en un solo objeto
     */
    public function obtenerResumenReserva(Reserva $reserva): array
    {
        $noches = $this->calcularNoches($reserva->check_in, $reserva->check_out);
        $cantidadHabitaciones = $reserva->habitacionReservas->count();

        return [
            'id' => $reserva->id,
            'localizador' => $reserva->localizador,
            'check_in' => DateService::formatear($reserva->check_in),
            'check_out' => DateService::formatear($reserva->check_out),
            'noches' => $noches,
            'habitaciones' => $cantidadHabitaciones,
            'precio_total' => $reserva->precio_total,
            'precio_por_noche' => $this->calcularPrecioPromedioPorNoche($reserva->precio_total, $noches, $cantidadHabitaciones),
            'estado' => $reserva->estado,
            'cliente' => $reserva->cliente ? UserService::normalizarDatos($reserva->cliente) : null,
            'tipo_usuario' => $reserva->booked_by_user ? 'usuario' : 'cliente',
        ];
    }
}

