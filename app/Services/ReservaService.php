<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use Illuminate\Support\Facades\Log;
use App\Models\Reserva;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Events\ReservaCreada;
use App\Events\ReservaBorrada;
use App\Events\ReservaActualizada;

class ReservaService
{
    private PrecioService $servicioPrecio;
    private \App\Services\PaymentService $servicioPago;
    private \App\Services\PdfService $servicioPDF;

    /**
     * Constructor del servicio de reservas
     * Inyecta dependencias de servicios de precio, pago y PDF
     * Usado por: Inyección de dependencias automática
     */
    public function __construct(?PrecioService $servicioPrecio = null, ?\App\Services\PaymentService $servicioPago = null, ?\App\Services\PdfService $servicioPDF = null)
    {
        $this->servicioPrecio = $servicioPrecio ?? new PrecioService();
        $this->servicioPago = $servicioPago ?? new \App\Services\PaymentService();
        $this->servicioPDF = $servicioPDF ?? new \App\Services\PdfService();
    }

    /**
     * Prepara y valida los datos de una reserva antes de crearla
     * Valida fechas, habitaciones y calcula precios totales
     * Usado por: crearReserva(), acciones de reserva
     * Retorna: array con datos preparados y validados
     */
    public function prepararDatosReserva(array $datos): array
    {
        $checkIn = Carbon::parse($datos['check_in'] ?? null);
        $checkOut = Carbon::parse($datos['check_out'] ?? null);

        if (!$checkIn || !$checkOut) {
            throw new \Exception('Fechas inválidas proporcionadas.');
        }

        if ($checkOut->lte($checkIn)) {
            throw new \Exception('La fecha de salida debe ser posterior a la de entrada.');
        }

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
     * Prepara fechas para edición de reserva existente
     * Valida que las nuevas fechas sean coherentes
     * Usado por: acciones de modificación de reserva
     * Retorna: array con checkIn y checkOut validados
     */
    public function prepararFechasParaEdicion(array $requestDates, Reserva $reserva): array
    {
        $checkIn = isset($requestDates['check_in']) ? Carbon::parse($requestDates['check_in']) : Carbon::parse($reserva->check_in);
        $checkOut = isset($requestDates['check_out']) ? Carbon::parse($requestDates['check_out']) : Carbon::parse($reserva->check_out);

        if (!$checkIn || !$checkOut) {
            throw new \Exception('Fechas inválidas para edición.');
        }

        if ($checkOut->lte($checkIn)) {
            throw new \Exception('La fecha de salida debe ser posterior a la de entrada.');
        }

        return [$checkIn, $checkOut];
    }

    /**
     * Formatea datos de reserva para interfaz de edición
     * Incluye habitaciones, precios y estadísticas
     * Usado por: controladores de edición de reserva
     * Retorna: array con todos los datos formateados para edición
     */
    public function formatearReservaParaEdicion(Reserva $reserva, Carbon $checkIn, Carbon $checkOut): array
    {
        $noches = max(1, $checkIn->diffInDays($checkOut));

        $reservaData = [
            'id' => $reserva->id,
            'localizador' => $reserva->localizador,
            'check_in' => Carbon::parse($reserva->check_in)->format('Y-m-d'),
            'check_out' => Carbon::parse($reserva->check_out)->format('Y-m-d'),
            'precio_total' => $reserva->precio_total,
            'status' => $reserva->status,
            'pago' => $reserva->pago,
            'notas' => $reserva->notas,
            'cliente' => [
                'id' => $reserva->reservable->id ?? null,
                'name' => $reserva->reservable->name ?? 'N/A',
                'email' => $reserva->reservable->email ?? null,
                'telefono' => $reserva->reservable->telefono ?? null,
                'numero_documento' => $reserva->reservable->numero_documento ?? null,
                'tipo_documento' => $reserva->reservable->tipo_documento ?? null,
            ],
            'habitaciones' => $reserva->habitaciones->map(function ($hr) use ($noches) {
                return [
                    'id' => $hr->habitacion?->id ?? $hr->id,
                    'numero' => $hr->habitacion?->numero ?? null,
                    'tipo' => $hr->tipo ?? $hr->habitacion?->tipo ?? null,
                    'precio_noche' => $hr->precio ? round($hr->precio / max(1, $noches), 2) : null,
                    'capacidad' => $hr->habitacion?->capacidad ?? null,
                    'precio' => $hr->precio,
                ];
            })->values(),
        ];

        return $reservaData;
    }

    /**
     * Obtiene las habitaciones disponibles y calcula precios para la vista de edición
     * Devuelve una colección mapeada lista para enviar a la vista.
     * Usado por: formatearReservaParaEdicion()
     * Retorna: colección de habitaciones con precios calculados
     */
    public function obtenerHabitacionesYPreciosParaEdicion(Reserva $reserva, Carbon $checkIn, Carbon $checkOut)
    {
        // Aceptar también strings por seguridad: coerción a Carbon
        if (!($checkIn instanceof Carbon)) {
            $checkIn = Carbon::parse($checkIn);
        }
        if (!($checkOut instanceof Carbon)) {
            $checkOut = Carbon::parse($checkOut);
        }

        $habitacionesActualesIds = $reserva->habitaciones->pluck('habitacion.id')->filter()->values()->toArray();

        $checkInStr = $checkIn->toDateString();
        $checkOutStr = $checkOut->toDateString();

        $habitaciones = Habitacion::select('id', 'numero', 'tipo', 'capacidad', 'estado')
            ->where(function ($query) use ($reserva, $habitacionesActualesIds, $checkInStr, $checkOutStr) {
                $query->whereIn('id', $habitacionesActualesIds)
                    ->orWhere(function ($q) use ($reserva, $checkInStr, $checkOutStr) {
                        $q->where('estado', 'disponible')
                            ->whereDoesntHave('reservas', function ($subQ) use ($reserva, $checkInStr, $checkOutStr) {
                                $subQ->where('reserva_id', '!=', $reserva->id)
                                    ->where('check_in', '<', $checkOutStr)
                                    ->where('check_out', '>', $checkInStr);
                            });
                    });
            })
            ->orderBy('numero')
            ->get();

        $noches = max(1, $checkIn->diffInDays($checkOut));

        return $habitaciones->map(function ($hab) use ($habitacionesActualesIds, $checkIn, $checkOut, $noches) {
            $precioDinamico = $this->servicioPrecio->precioEntreFechas($hab->tipo, $checkIn, $checkOut);

            return [
                'id' => $hab->id,
                'numero' => $hab->numero,
                'tipo' => $hab->tipo,
                'precio_noche' => round($precioDinamico / $noches, 2),
                'precio_total' => $precioDinamico,
                'capacidad' => $hab->capacidad,
                'estado' => $hab->estado,
                'es_actual' => in_array($hab->id, $habitacionesActualesIds),
            ];
        });
    }

    /**
     * Valida la selección de habitaciones
     */
    /**
     * Valida y normaliza la configuración de habitaciones
     * Verifica tipos válidos y cantidades positivas
     * Usado por: prepararDatosReserva()
     * Retorna: array de habitaciones validadas
     */
    private function validarHabitaciones(array $habitaciones): array
    {
        $validadas = [];
        $tiposValidos = ['doble', 'familiar', 'suite'];

        foreach ($habitaciones as $habitacion) {
            $tipo = strtolower(trim($habitacion['tipo'] ?? ''));
            $cantidad = intval($habitacion['cantidad'] ?? 0);

            if (!in_array($tipo, $tiposValidos, true)) {
                throw new \Exception("Tipo de habitación no válido: {$tipo}");
            }

            if ($cantidad <= 0) {
                continue;
            }

            $personas = intval($habitacion['personas_por_habitacion'] ?? 1);
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
     * Usa el servicio de precios para calcular sin tarifas adicionales
     * Usado por: prepararDatosReserva()
     * Retorna: precio total como float
     */
    private function calcularPrecioTotal(array $habitaciones, Carbon $checkIn, Carbon $checkOut): float
    {
        $resultado = $this->servicioPrecio->precioSinTarifas($habitaciones, $checkIn, $checkOut);

        if (isset($resultado['error'])) {
            throw new \Exception($resultado['error']);
        }

        return $resultado['total'] ?? 0;
    }

    /**
     * Genera un localizador único para la reserva
     * Formato: G + 6 caracteres aleatorios en mayúsculas
     * Usado por: crearReserva()
     * Retorna: string único de 7 caracteres
     */
    public function generarLocalizador(): string
    {
        do {
            $localizador = 'G' . strtoupper(Str::random(6));
        } while (Reserva::where('localizador', $localizador)->exists());

        return $localizador;
    }

    /**
     * Crea una reserva usando los helpers del servicio.
     * Prepara datos, verifica disponibilidad, crea reserva y asigna habitaciones
     * Usado por: controladores de reserva, acciones de creación
     * Retorna: instancia de Reserva creada con ID
     */
    public function crearReserva(array $datos, ?User $usuario = null, string $status = 'pendiente'): Reserva
    {
        $datosPreparados = $this->prepararDatosReserva($datos);

        // Verificar disponibilidad
        $this->verificarDisponibilidadMultiple($datosPreparados['habitaciones'], $datosPreparados['check_in'], $datosPreparados['check_out']);

        // Resolver reservable (usuario o cliente)
        if (($datosPreparados['tipo_usuario'] ?? '') === 'usuario' && $usuario) {
            $datosPreparados['reservable_id'] = $usuario->id;
            $reservableType = User::class;
        } else {
            $clienteId = $this->obtenerOCrearCliente($datosPreparados);
            $datosPreparados['reservable_id'] = $clienteId;
            $reservableType = Cliente::class;
            $datosPreparados['tipo_usuario'] = 'cliente';
        }

        $reserva = DB::transaction(function () use ($datosPreparados, $usuario, $status, $reservableType) {
            $localizador = $this->generarLocalizador();

            $reserva = Reserva::create([
                'localizador' => $localizador,
                'reservable_id' => $datosPreparados['reservable_id'],
                'reservable_type' => $reservableType,
                'booked_by_user_id' => $usuario->id ?? null,
                'check_in' => $datosPreparados['check_in'],
                'check_out' => $datosPreparados['check_out'],
                'precio_total' => $datosPreparados['precio_total'],
                'status' => $status,
                'pago' => $datosPreparados['pago'] ?? 'pendiente',
                'notas' => $datosPreparados['notas'] ?? 'Reserva creada',
            ]);

            // Asignar habitaciones
            $this->asignarHabitaciones($reserva, $datosPreparados['habitaciones']);

            return $reserva;
        });

        // Disparar evento fuera de la transacción para evitar que fallos posteriores
        // (por ejemplo inserciones en tabla notifications) hagan abortar la transacción.
        try {
            event(new ReservaCreada($reserva));
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Error dispatching ReservaCreada outside transaction: ' . $e->getMessage());
        }

        return $reserva;
    }

    /**
     * Elimina una reserva y sus relaciones dentro de transacción.
     * Borra habitaciones asociadas y dispara evento de eliminación
     * Usado por: controladores de eliminación de reserva
     * Retorna: void
     */
    public function eliminarReserva(Reserva $reserva): void
    {
        DB::transaction(function () use ($reserva) {
            $reserva->habitaciones()->delete();
            $reserva->delete();
            event(new ReservaBorrada($reserva));
        });
    }

    /**
     * Obtiene o crea el cliente para la reserva
     * Busca por DNI, reutiliza si coincide, crea nuevo si no existe
     * Usado por: crearReserva()
     * Retorna: ID del cliente (string)
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
     * Compara nombre, email y teléfono (case insensitive para nombre)
     * Usado por: obtenerOCrearCliente()
     * Retorna: boolean indicando si coinciden
     */
    private function datosCoinciden(Cliente $cliente, array $datos): bool
    {
        return strcasecmp(trim($cliente->name), trim($datos['nombre'] ?? '')) === 0 &&
               $cliente->email === ($datos['email'] ?? null) &&
               $cliente->telefono === ($datos['telefono'] ?? null);
    }

    /**
     * Crea un nuevo cliente
     * Procesa dirección y crea registro en base de datos
     * Usado por: obtenerOCrearCliente()
     * Retorna: ID del cliente creado
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
     * Itera sobre cada tipo de habitación requerido y verifica disponibilidad
     * Usado por: crearReserva(), actualizarReserva()
     * Retorna: true si todas están disponibles, lanza excepción si no
     */
    public function verificarDisponibilidadMultiple(array $habitacionesRequeridas, Carbon $checkIn, Carbon $checkOut): bool
    {
        foreach ($habitacionesRequeridas as $habitacion) {
            $tipo = $habitacion['tipo'] ?? null;
            $cantidad = $habitacion['cantidad'] ?? 0;

            if ($cantidad <= 0) continue;

            // Reutiliza helper con lock para verificar disponibilidad por tipo
            $this->verificarDisponibilidad($tipo, $checkIn, $checkOut, $cantidad);
        }

        return true;
    }

    /**
     * Cuenta cuántas habitaciones de un tipo están disponibles (tiene en cuenta placeholders)
     * Usa HabitacionService para cálculo preciso considerando reservas existentes y placeholders
     * Usado por: verificarDisponibilidad()
     * Retorna: número entero de habitaciones disponibles
     */
    private function contarHabitacionesDisponibles(string $tipo, Carbon $checkIn, Carbon $checkOut): int
    {
        $habitacionService = new \App\Services\HabitacionService();
        $resumen = $habitacionService->contarDisponiblesPorTipo($checkIn, $checkOut, true);

        $cantidad = $resumen[$tipo]['cantidad'] ?? 0;
        try {
            \Illuminate\Support\Facades\Log::debug('Disponibilidad debug', [
                'tipo' => $tipo,
                'check_in' => $checkIn->toDateString(),
                'check_out' => $checkOut->toDateString(),
                'resumen' => $resumen,
                'cantidad' => $cantidad,
            ]);
        } catch (\Throwable $e) {
            // no bloquear por logging
        }

        return $cantidad;
    }

    /**
     * Ejecuta una transacción con lock sobre habitaciones de un tipo y verifica disponibilidad.
     * Si se proporciona $cb (callable), se ejecuta dentro de la transacción después de la comprobación.
     */
    private function verificarDisponibilidad(string $tipo, Carbon $checkIn, Carbon $checkOut, int $cantidad, ?callable $cb = null): void
    {
        DB::transaction(function () use ($tipo, $checkIn, $checkOut, $cantidad, $cb) {
            Habitacion::where('tipo', $tipo)->lockForUpdate()->get();

            $disponibles = $this->contarHabitacionesDisponibles($tipo, $checkIn, $checkOut);

            if ($disponibles < $cantidad) {
                try {
                    \Illuminate\Support\Facades\Log::error('Verificación de disponibilidad fallida', [
                        'tipo' => $tipo,
                        'requiere' => $cantidad,
                        'disponibles' => $disponibles,
                        'check_in' => $checkIn->toDateString(),
                        'check_out' => $checkOut->toDateString(),
                    ]);
                } catch (\Throwable $e) {
                    // ignore logging error
                }
                throw new \Exception("No hay {$cantidad} habitación/es de tipo '{$tipo}' disponibles para las fechas seleccionadas.");
            }

            if (is_callable($cb)) {
                $cb();
            }
        });
    }


    /**
     * Genera y devuelve el objeto PDF para una reserva delegando a PdfService
     * Usado por: controladores que necesitan generar PDFs de reserva
     * Retorna: objeto PDF generado
     */
    public function generarPdf(Reserva $reserva)
    {
        return $this->servicioPDF->generarPdf($reserva);
    }

    /**
     * Determina si la reserva es elegible para reembolso (48h y pago pagado)
     * Verifica que falten más de 48h para check-in y que el pago esté completado
     * Usado por: controladores de reembolso, interfaces de usuario
     * Retorna: boolean indicando si puede reembolsarse
     */
    public function puedeReembolsar(Reserva $reserva): bool
    {
        try {
            $checkIn = Carbon::parse($reserva->check_in);
            $deadline = $checkIn->copy()->subHours(48);
            if (Carbon::now()->greaterThan($deadline)) {
                return false;
            }

            if (strtolower($reserva->pago) !== 'pagado') {
                return false;
            }

            return true;
        } catch (\Throwable $e) {
            Log::warning('Error evaluando puedeReembolsar: ' . $e->getMessage());
            return false;
        }
    }

    public function solicitarReembolso(Reserva $reserva, $usuario, ?float $monto = null): array
    {
        return $this->servicioPago->solicitarReembolso($reserva, $usuario, $monto);
    }

    /**
     * Delegación a PaymentService para manejar eventos de reembolso desde Stripe.
     * Procesa webhooks de reembolso y actualiza estado de pagos
     * Usado por: controladores de webhooks de Stripe
     * Retorna: void
     */
    public function handleRefundEvent($refundObj): void
    {
        $this->servicioPago->manejarEventoReembolso($refundObj);
    }

    /**
     * Asigna habitaciones a una reserva creando placeholders
     * Verifica disponibilidad y crea registros HabitacionReserva con habitacion_id = null
     * Usado por: crearReserva() durante el proceso de reserva
     * Retorna: void
     */
    public function asignarHabitaciones(Reserva $reserva, array $habitacionesRequeridas): void
    {
        foreach ($habitacionesRequeridas as $requerida) {
            $tipo = $requerida['tipo'];
            $cantidad = $requerida['cantidad'];

            $this->verificarDisponibilidad($tipo, Carbon::parse($reserva->check_in), Carbon::parse($reserva->check_out), $cantidad, function () use ($reserva, $tipo, $cantidad) {
                $precioPorHabitacion = $this->servicioPrecio->precioEntreFechas(
                    $tipo, Carbon::parse($reserva->check_in), Carbon::parse($reserva->check_out));

                if (!is_numeric($precioPorHabitacion)) {

                    $precioPorHabitacion = 0;
                }

                for ($i = 0; $i < $cantidad; $i++) {
                    try {
                        $created = HabitacionReserva::create([
                            'reserva_id' => $reserva->id,
                            'habitacion_id' => null,
                            'tipo' => $tipo,
                            'check_in' => $reserva->check_in,
                            'check_out' => $reserva->check_out,
                            'precio' => $precioPorHabitacion,
                        ]);
                        Log::debug('Placeholder HabitacionReserva creado', ['id' => $created->id, 'reserva_id' => $created->reserva_id, 'precio' => $created->precio]);
                    } catch (\Throwable $e) {
                        Log::error('Error creando placeholder HabitacionReserva', ['reserva_id' => $reserva->id, 'tipo' => $tipo, 'precio' => $precioPorHabitacion, 'error' => $e->getMessage()]);
                        throw $e;
                    }
                }
            });
        }
    }

    /**
     * Asigna habitaciones físicas durante el check-in
     * Busca habitaciones disponibles y las asigna a placeholders existentes
     * Usado por: MarcarCheckInAction, procesos de check-in
     * Retorna: array con resultados de cada asignación
     */
    public function asignarHabitacionEnCheckIn(Reserva $reserva, $actorId = null): array
    {
        $asignadas = [];

        DB::transaction(function () use ($reserva, &$asignadas, $actorId) {
            $checkIn = Carbon::parse($reserva->check_in);
            $checkOut = Carbon::parse($reserva->check_out);

            $placeholders = HabitacionReserva::where('reserva_id', $reserva->id)->whereNull('habitacion_id')->get();

            foreach ($placeholders as $ph) {
                $candidate = Habitacion::where('tipo', $ph->tipo)
                    ->where('estado', 'disponible')
                    ->whereDoesntHave('reservas', function ($q) use ($checkIn, $checkOut, $reserva) {
                        $q->where('check_in', '<', $checkOut)->where('check_out', '>', $checkIn)->where('reserva_id', '!=', $reserva->id);
                    })
                    ->lockForUpdate()
                    ->first();

                if (! $candidate) {
                    $asignadas[] = ['placeholder_id' => $ph->id, 'assigned' => false, 'reason' => 'no_available'];
                    continue;
                }

                $ph->habitacion_id = $candidate->id;
                if (!is_numeric($ph->precio) || $ph->precio === null) {
                    $precioFallback = $this->servicioPrecio->precioEntreFechas($candidate->tipo ?? ($ph->tipo ?? ''), Carbon::parse($reserva->check_in), Carbon::parse($reserva->check_out));
                    $ph->precio = is_numeric($precioFallback) ? $precioFallback : 0;
                }
                $ph->save();

                $asignadas[] = ['placeholder_id' => $ph->id, 'assigned' => true, 'habitacion_id' => $candidate->id, 'numero' => $candidate->numero];
            }
        });

        return $asignadas;
    }

    /**
     * Verifica si una habitación específica está disponible en un rango de fechas
     * Excluye una reserva específica si se proporciona (para modificaciones)
     * Usado por: modificaciones de reserva, extensiones
     * Retorna: boolean indicando disponibilidad
     */
    public function verificarDisponibilidadHabitacion(int $habitacionId, Carbon $checkIn, Carbon $checkOut, ?int $excluirReservaId = null): bool
    {
        $query = HabitacionReserva::where('habitacion_id', $habitacionId)
            ->where('check_in', '<', $checkOut)
            ->where('check_out', '>', $checkIn);

        if ($excluirReservaId) {
            $query->where('reserva_id', '!=', $excluirReservaId);
        }

        return !$query->exists();
    }

    /**
     * Formatea una colección de reservas para respuesta API
     * Incluye cliente, habitaciones, precios y estadísticas
     * Usado por: controladores de listado de reservas
     * Retorna: array formateado de reservas
     */
    public function formatearReservas($reservas): array
    {
        return $reservas->map(function ($reserva) {
            $nombreCliente = 'Sin cliente';
            if ($reserva->reservable) {
                $nombreCliente = $reserva->reservable->name ?? 'Sin cliente';
            }

            $reembolsosTotal = $reserva->reembolsos ? ($reserva->reembolsos->sum('amount_cents') ?: 0) / 100 : 0;

            return [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => $reembolsosTotal,
                'notas' => $reserva->notas,
                'created_at' => $reserva->created_at ? $reserva->created_at->toIso8601String() : null,
                'cliente_name' => $nombreCliente,
                'booked_by_user' => $reserva->bookedBy->name ?? 'Sistema',
                'habitacion_numero' => (function() use ($reserva) {
                    $nums = $reserva->habitaciones->map(function($hr) { return $hr->habitacion?->numero ?? null; })->filter()->values();
                    return $nums->count() ? $nums->implode(', ') : 'Sin asignar';
                })(),
            ];
        })->toArray();
    }


    /**
     * Formatea información del cliente de una reserva
     * Determina si es usuario registrado o cliente invitado
     * Usado por: formatearReservas(), detalles de reserva
     * Retorna: array con tipo y nombre del cliente
     */
    public function formatearCliente($reserva): array
    {
        if ($reserva->reservable_type === 'App\\Models\\User') {
            return [
                'tipo' => 'usuario',
                'nombre' => $reserva->reservable?->name ?? 'Usuario no disponible',
            ];
        }
        return [
            'tipo' => 'cliente',
            'nombre' => $reserva->reservable?->name ?? 'Cliente no disponible',
        ];
    }

    /**
     * Actualiza una reserva existente con nuevos datos
     * Verifica disponibilidad de habitaciones, actualiza fechas y reasigna habitaciones
     * Usado por: controladores de actualización de reserva
     * Retorna: array con reserva actualizada y precio total
     */
    public function actualizarReserva(Reserva $reserva, array $validated, ?array $meta = null): array
    {
        $checkIn = Carbon::parse($validated['check_in']);
        $checkOut = Carbon::parse($validated['check_out']);
        $habitacionIds = $validated['habitacion_ids'];

        foreach ($habitacionIds as $id) {
            if (!$this->verificarDisponibilidadHabitacion($id, $checkIn, $checkOut, $reserva->id)) {
                $num = Habitacion::find($id)->numero ?? $id;
                throw new \Exception("La habitación {$num} ya está ocupada en esas fechas.");
            }
        }

        $reserva->update(['check_in' => $checkIn,
            'check_out' => $checkOut,
            'status' => $validated['status'],
            'pago' => $validated['pago'],
            'notas' => $validated['notas'] ?? null,
        ]);

        $reserva->habitaciones()->delete();

        $precioTotal = 0;
        foreach ($habitacionIds as $habitacionId) {
            $habitacion = Habitacion::findOrFail($habitacionId);
            $precioHabitacion = $this->servicioPrecio->precioEntreFechas(
                $habitacion->tipo,
                $checkIn,
                $checkOut
            );

            HabitacionReserva::create([
                'reserva_id' => $reserva->id,
                'habitacion_id' => $habitacionId,
                'precio' => $precioHabitacion,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
            ]);
            $precioTotal += $precioHabitacion;
        }

        $totalViejo = (float) $reserva->precio_total;
        $diffSigned = round($precioTotal - $totalViejo, 2);
        $refundInfo = null;
        $pagosCompletados = $reserva->pagos()->whereIn('estado', ['pagado', 'completado', 'procesando'])->get();
        $montoPagado = $pagosCompletados->sum(function ($p) { return (float) ($p->monto ?? 0); });

        if ($diffSigned < 0 && $montoPagado > 0) {
            $refundAmount = round(abs($diffSigned), 2);
            $userForRefund = $reserva->user ?? $reserva->reservable ?? \Illuminate\Support\Facades\Auth::user();
            $refundResult = $this->servicioPago->solicitarReembolso($reserva, $userForRefund, $refundAmount, true);
            if (!($refundResult['success'] ?? false)) {
                throw new \Exception('No se pudo procesar el reembolso: ' . ($refundResult['message'] ?? 'Error en reembolso'));
            }

            $refundInfo = [
                'amount' => $refundResult['refund_amount'] ?? $refundAmount,
                'refund_id' => $refundResult['refund_id'] ?? null,
                'message' => $refundResult['message'] ?? null
            ];
        } else {
            if ($diffSigned < 0) {
                Log::info('No se procesó reembolso porque no hay pagos detectados', ['reserva_id' => $reserva->id, 'monto_pagado' => $montoPagado, 'pago' => $reserva->pago]);
            }
        }

        $reserva->update(['precio_total' => $precioTotal]);

        try {
            event(new ReservaActualizada($reserva, $meta ?? null));
        } catch (\Throwable $e) {

        }

        return ['refund' => $refundInfo];
    }

    /**
     * Obtiene información sobre la posibilidad de extender una reserva
     * Verifica tiempo hasta checkout y estado de la reserva
     * Usado por: interfaces de extensión de reserva
     * Retorna: array con información de extensión disponible
     */
    public function obtenerInfoExtension(Reserva $reserva): array
    {
        $checkOut = Carbon::parse($reserva->check_out);
        $horasHastaCheckout = now()->diffInHours($checkOut, false);
        $puedeExtender = $horasHastaCheckout < 24 && $reserva->status !== 'cancelada';

        $razon = null;
        if (!$puedeExtender) {
            if ($reserva->status === 'cancelada') {
                $razon = 'No se pueden extender reservas canceladas';
            } else {
                $razon = 'Solo puedes extender 24 horas antes del checkout';
            }
        }

        return [
            'puede_extender' => $puedeExtender,
            'horas_hasta_checkout' => max(0, (int)$horasHastaCheckout),
            'max_dias' => 3,
            'razon' => $razon,
            'check_out_actual' => $checkOut->format('Y-m-d'),
        ];
    }

    /**
     * Verifica disponibilidad de habitaciones para extensión de reserva
     * Comprueba que las habitaciones asignadas estén libres en el período de extensión
     * Usado por: procesos de extensión de reserva
     * Retorna: array con números de habitaciones no disponibles
     */
    public function verificarDisponibilidadExtension(Reserva $reserva, Carbon $checkOutActual, Carbon $nuevoCheckOut): array
    {
        $habitacionesNoDisponibles = [];
        $checkOutDate = $checkOutActual->format('Y-m-d');
        $nuevoCheckOutDate = $nuevoCheckOut->format('Y-m-d');

        foreach ($reserva->habitaciones as $habitacionReserva) {
            $habitacion = $habitacionReserva->habitacion;

            $conflictivas = HabitacionReserva::where('habitacion_id', $habitacion->id)
                ->where('reserva_id', '!=', $reserva->id)
                ->whereRaw("check_in < ? AND check_out > ?", [$nuevoCheckOutDate, $checkOutDate])
                ->count();

            if ($conflictivas > 0) {
                $habitacionesNoDisponibles[] = $habitacion->numero;
            }
        }

        return $habitacionesNoDisponibles;
    }

    /**
     * Calcula el precio de extensión de una reserva
     * Suma precios de todas las habitaciones por el período de extensión
     * Usado por: procesos de extensión de reserva
     * Retorna: precio total de la extensión (float)
     */
    public function calcularPrecioExtension(Reserva $reserva, Carbon $checkOutActual, Carbon $nuevoCheckOut): float
    {
        $precioExtension = 0;

        foreach ($reserva->habitaciones as $habitacionReserva) {
            $habitacion = $habitacionReserva->habitacion;
            $precioExtension += $this->servicioPrecio->precioEntreFechas(
                $habitacion->tipo,
                $checkOutActual,
                $nuevoCheckOut
            );
        }

        return $precioExtension;
    }

    /**
     * Aplica la extensión a una reserva
     * Actualiza fechas de checkout y recalcula precio total
     * Usado por: acciones de extensión de reserva
     * Retorna: void
     */
    public function aplicarExtension(Reserva $reserva, Carbon $nuevoCheckOut, float $precioExtension): void
    {
        $reserva->check_out = $nuevoCheckOut;
        $reserva->precio_total += $precioExtension;
        $reserva->save();

        // Actualizar las fechas en las relaciones HabitacionReserva
        foreach ($reserva->habitaciones as $habitacionReserva) {
            $habitacionReserva->check_out = $nuevoCheckOut;
            $habitacionReserva->save();
        }
    }

    /**
     * Extiende una reserva: valida, calcula precio y aplica si se confirma
     * Verifica disponibilidad, calcula precio y aplica extensión si se confirma
     * Usado por: acciones de extensión de reserva desde panel de control
     * Retorna: array con resultado de la extensión
     */
    public function extenderReserva(string $localizador, int $numeroDias, bool $confirmar = false): array
    {
        $reserva = Reserva::with(['habitaciones.habitacion', 'pagos'])->where('localizador', $localizador)->first();
        if (!$reserva) {
            throw new \Exception('Reserva no encontrada');
        }

        $checkOut = Carbon::parse($reserva->check_out);
        $horas = now()->diffInHours($checkOut);

        if ($horas >= 24) {
            throw new \Exception('La extensión solo está disponible 24 horas antes del checkout');
        }

        if ($reserva->status === 'cancelada') {
            throw new \Exception('No se puede extender una reserva cancelada');
        }

        if ($numeroDias < 1 || $numeroDias > 3) {
            throw new \Exception('Debes seleccionar entre 1 y 3 días de extensión');
        }

        $nuevoCheckOut = $checkOut->copy()->addDays($numeroDias);

        // Verificar disponibilidad
        $habitacionesNoDisponibles = $this->verificarDisponibilidadExtension($reserva, $checkOut, $nuevoCheckOut);
        if (!empty($habitacionesNoDisponibles)) {
            return [ 'success' => false, 'error' => 'Las habitaciones no están disponibles para la extensión seleccionada', 'habitaciones_no_disponibles' => $habitacionesNoDisponibles ];
        }

        $precioExtension = $this->calcularPrecioExtension($reserva, $checkOut, $nuevoCheckOut);
        $necesitaPago = $reserva->pago === 'pagado';

        if ($confirmar) {
            $this->aplicarExtension($reserva, $nuevoCheckOut, $precioExtension);
            try {
                event(new ReservaActualizada($reserva, null));
            } catch (\Throwable $e) {
                // ignore
            }
            return [ 'success' => true, 'aplicada' => true, 'nuevo_check_out' => $nuevoCheckOut->toDateString(), 'precio_extension' => $precioExtension, 'necesita_pago' => $necesitaPago ];
        }

        return [ 'success' => true, 'aplicada' => false, 'nuevo_check_out' => $nuevoCheckOut->toDateString(), 'precio_extension' => $precioExtension, 'necesita_pago' => $necesitaPago ];
    }


}


