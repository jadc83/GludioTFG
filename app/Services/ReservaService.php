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
    // El método de cambio de fechas se eliminó: el sistema antiguo de extensión y el servicio
    // especializado `ReservaExtensionService` gestionan ahora las extensiones de estancia.
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
     *
     * @param array<string,mixed> $datos
     * @return array<string,mixed>
     */
    public function prepararDatosReserva(array $datos): array
    {
        \Illuminate\Support\Facades\Log::info('prepararDatosReserva - datos recibidos:', [
            'cupon_id' => $datos['cupon_id'] ?? 'NULL',
            'tarifas' => $datos['tarifas'] ?? [],
            'name' => $datos['name'] ?? 'NULL',
            'email' => $datos['email'] ?? 'NULL'
        ]);

        $checkIn = Carbon::parse($datos['check_in']);
        $checkOut = Carbon::parse($datos['check_out']);
        $habitaciones = $datos['habitaciones'];

        // Calcular precio completo usando el método unificado
        $tarifas = $datos['tarifas'] ?? [];
        $cuponId = $datos['cupon_id'] ?? null;

        $resultadoPrecio = $this->servicioPrecio->calcularPrecioCompleto(
            $habitaciones,
            $checkIn,
            $checkOut,
            $tarifas,
            $cuponId
        );

        if (isset($resultadoPrecio['error'])) {
            throw new \Exception('Error calculando precio: ' . ($resultadoPrecio['error'] ?? 'desconocido'));
        }

        $precioTotal = $resultadoPrecio['precio_total'] ?? 0;
        $descuentoAplicado = $resultadoPrecio['descuento_aplicado'] ?? 0;
        $tarifaIds = $resultadoPrecio['tarifa_ids'] ?? [];

        $estadoPago = $datos['pago'] ?? 'pendiente';
        $metodoPago = $datos['metodo_pago'] ?? null;

        // Preparar estructura de retorno esperada por crearReserva()
        $datosReturn = [
            'name' => $datos['name'] ?? null,
            'email' => $datos['email'] ?? null,
            'telefono' => $datos['telefono'] ?? null,
            'numero_documento' => $datos['numero_documento'] ?? null,
            'tipo_documento' => $datos['tipo_documento'] ?? null,
            'nacionalidad' => $datos['nacionalidad'] ?? null,
            'direccion' => $datos['direccion'] ?? null,
            'check_in' => $checkIn->toDateString(),
            'check_out' => $checkOut->toDateString(),
            'habitaciones' => $habitaciones,
            'precio_total' => $precioTotal,
            'tarifa_ids' => $tarifaIds,
            'cupon_id' => $cuponId,
            'descuento_aplicado' => $descuentoAplicado,
            'reservable_id' => $datos['reservable_id'] ?? null,
            'reservable_type' => $datos['reservable_type'] ?? null,
            'tipo_usuario' => $datos['tipo_usuario'] ?? 'cliente',
            'booked_by_user_id' => $datos['booked_by_user_id'] ?? null,
            'pago' => $estadoPago,
            'payment_intent_id' => $datos['payment_intent_id'] ?? null,
            'pago_monto' => $datos['pago_monto'] ?? null,
            'metodo_pago' => $metodoPago,
            'notas' => $datos['notas'] ?? null,
        ];

        \Illuminate\Support\Facades\Log::info('prepararDatosReserva completado', [
            'email' => $datosReturn['email'],
            'precio_total' => $datosReturn['precio_total'],
            'tarifa_ids_count' => count($tarifaIds)
        ]);

        return $datosReturn;
    }

    /**
     * Prepara fechas para edición de reserva existente
     * Valida que las nuevas fechas sean coherentes
     * Usado por: acciones de modificación de reserva
     *
     * @param array<string,mixed> $requestDates
     * @param \App\Models\Reserva $reserva
     * @return array{0:\Carbon\Carbon,1:\Carbon\Carbon}
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
     *
     * @param \App\Models\Reserva $reserva
     * @param \Carbon\Carbon $checkIn
     * @param \Carbon\Carbon $checkOut
     * @return array<string,mixed>
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
     *
     * @param \App\Models\Reserva $reserva
     * @param \Carbon\Carbon $checkIn
     * @param \Carbon\Carbon $checkOut
     * @return \Illuminate\Support\Collection<int, array<string,mixed>>
     */
    public function obtenerHabitacionesYPreciosParaEdicion(Reserva $reserva, Carbon $checkIn, Carbon $checkOut): \Illuminate\Support\Collection
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

        // Obtener TODAS las habitaciones disponibles en las fechas seleccionadas
        $habitaciones = Habitacion::select('id', 'numero', 'tipo', 'capacidad', 'estado')
            ->where('estado', 'disponible')
            ->whereDoesntHave('reservas', function ($subQ) use ($reserva, $checkInStr, $checkOutStr) {
                $subQ->where('reserva_id', '!=', $reserva->id)
                    ->where('check_in', '<', $checkOutStr)
                    ->where('check_out', '>', $checkInStr);
            })
            ->whereNotIn('id', $habitacionesActualesIds) // Excluir habitaciones ya asignadas a esta reserva
            ->orderBy('numero')
            ->get();

        $noches = max(1, $checkIn->diffInDays($checkOut));

        return $habitaciones->map(function ($hab) use ($checkIn, $checkOut, $noches) {
            $precioDinamico = $this->servicioPrecio->precioEntreFechas($hab->tipo, $checkIn, $checkOut);

            return [
                'id' => $hab->id,
                'numero' => $hab->numero,
                'tipo' => $hab->tipo,
                'precio_noche' => round($precioDinamico / $noches, 2),
                'precio_total' => $precioDinamico,
                'capacidad' => $hab->capacidad,
                'estado' => $hab->estado,
            ];
        });
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
     * @param array<string,mixed> $datos
     * @param User|null $usuario
     * @param string $status
     * @return Reserva
     */
    public function crearReserva(array $datos, ?User $usuario = null, string $status = 'pendiente'): Reserva
    {
        $datosPreparados = $this->prepararDatosReserva($datos);

        // Resolver reservable (usuario o cliente)
        if (!empty($datosPreparados['reservable_type']) && !empty($datosPreparados['reservable_id'])) {
            $reservableType = $datosPreparados['reservable_type'];
        } elseif (($datosPreparados['tipo_usuario'] ?? '') === 'usuario' && $usuario) {
            $datosPreparados['reservable_id'] = $usuario->id;
            $reservableType = User::class;
        } else {
            // Crear o buscar cliente
            $clienteId = $this->obtenerOCrearCliente($datosPreparados);
            $datosPreparados['reservable_id'] = $clienteId;
            $reservableType = Cliente::class;
            $datosPreparados['tipo_usuario'] = 'cliente';
        }

        $reserva = DB::transaction(function () use ($datosPreparados, $usuario, $status, $reservableType) {
            // Verificar disponibilidad dentro de la transacción
            // Asegurar que pasamos objetos Carbon (prepararDatosReserva retornó strings)
            $checkInCarbon = Carbon::parse($datosPreparados['check_in']);
            $checkOutCarbon = Carbon::parse($datosPreparados['check_out']);
            $this->verificarDisponibilidadMultiple($datosPreparados['habitaciones'], $checkInCarbon, $checkOutCarbon);

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
                'cupon_id' => $datosPreparados['cupon_id'] ?? null,
                'descuento_aplicado' => $datosPreparados['descuento_aplicado'] ?? 0,
            ]);

            // Guardar relaciones con tarifas múltiples
            if (!empty($datosPreparados['tarifa_ids'])) {
                $reserva->tarifas()->attach($datosPreparados['tarifa_ids']);
            }

            \Illuminate\Support\Facades\Log::info('Reserva creada', [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'precio_total' => $reserva->precio_total
            ]);

            // Asignar habitaciones
            $this->asignarHabitaciones($reserva, $datosPreparados['habitaciones']);

            // Si se proporcionó un payment_intent_id al crear la reserva, registrar un Pago ligado
            try {
                $paymentIntentId = $datosPreparados['payment_intent_id'] ?? null;
                $pagoMonto = $datosPreparados['pago_monto'] ?? ($reserva->precio_total ?? null);
                if ($paymentIntentId) {
                    // Crear registro de Pago si no existe uno similar
                    $existing = \App\Models\Pago::where('reserva_id', $reserva->id)
                        ->where('stripe_payment_intent_id', $paymentIntentId)
                        ->first();
                    if (! $existing) {
                        $pagoData = [
                            'reserva_id' => $reserva->id,
                            'stripe_payment_intent_id' => $paymentIntentId,
                            'monto' => $pagoMonto ?? $reserva->precio_total,
                            'moneda' => 'eur',
                            'estado' => ($datosPreparados['pago'] ?? 'pendiente') === 'pagado' ? 'completado' : 'procesando',
                            'descripcion' => 'Pago asociado al crear reserva ' . $reserva->localizador,
                            'stripe_response' => ['id' => $paymentIntentId],
                        ];
                        \App\Models\Pago::create($pagoData);
                    }
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('No se pudo crear Pago automático al crear reserva: ' . $e->getMessage());
            }

            // Registrar cupón aplicado en auditoría
            if ($datosPreparados['cupon_id'] ?? null) {
                \App\Models\CuponAplicado::create([
                    'reserva_id' => $reserva->id,
                    'cupon_id' => $datosPreparados['cupon_id'],
                    'codigo' => \App\Models\Cupon::find($datosPreparados['cupon_id'])->codigo ?? '',
                    'descuento_aplicado' => $datosPreparados['descuento_aplicado'] ?? 0,
                    'usuario_email' => $datosPreparados['email'] ?? '',
                    'ip_address' => request()->ip(),
                ]);

                // Incrementar contador de usos
                \App\Models\Cupon::find($datosPreparados['cupon_id'])->increment('usos_realizados');
            }

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
     * @param array<string,mixed> $datos
     * @return string
     */
    /**
     * @param array<string,mixed> $datos
     * @return string
     */
    public function obtenerOCrearCliente(array $datos): string
    {
        \Illuminate\Support\Facades\Log::info('obtenerOCrearCliente - datos recibidos:', [
            'nombre' => $datos['nombre'] ?? 'NULL',
            'email' => $datos['email'] ?? 'NULL',
            'reservable_id' => $datos['reservable_id'] ?? 'NULL'
        ]);

        // Si hay un cliente/usuario especificado, usarlo
        if (!empty($datos['reservable_id'])) {
            \Illuminate\Support\Facades\Log::info('obtenerOCrearCliente - usando reservable_id existente:', ['id' => $datos['reservable_id']]);
            return $datos['reservable_id'];
        }

        // Buscar cliente existente por email primero
        if (!empty($datos['email'])) {
            $clienteExistente = Cliente::where('email', $datos['email'])->first();
            if ($clienteExistente) {
                return $clienteExistente->id;
            }
        }

        // Buscar cliente existente por DNI si no encontró por email
        if (!empty($datos['numero_documento'])) {
            $clienteExistente = Cliente::where('numero_documento', $datos['numero_documento'])->first();
            if ($clienteExistente) {
                return $clienteExistente->id;
            }
        }

        // Crear nuevo cliente
        return $this->crearCliente($datos);
    }


    /**
     * Crea un nuevo cliente
     * Procesa dirección y crea registro en base de datos
     * Usado por: obtenerOCrearCliente()
     * @param array<string,mixed> $datos
     * @return string
     */
    /**
     * @param array<string,mixed> $datos
     * @return string
     */
    private function crearCliente(array $datos): string
    {
        \Illuminate\Support\Facades\Log::info('crearCliente - creando nuevo cliente:', [
            'nombre' => $datos['nombre'] ?? 'NULL',
            'email' => $datos['email'] ?? 'NULL'
        ]);

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

        \Illuminate\Support\Facades\Log::info('crearCliente - cliente creado:', [
            'id' => $cliente->id,
            'name' => $cliente->name
        ]);

        return $cliente->id;
    }

    /**
     * Verifica disponibilidad de habitaciones para un rango de fechas
     * Itera sobre cada tipo de habitación requerido y verifica disponibilidad
     * Usado por: crearReserva(), actualizarReserva()
     * Retorna: true si todas están disponibles, lanza excepción si no
     */
    /**
     * @param array<int,array{tipo:string,cantidad:int}> $habitacionesRequeridas
     * @param Carbon $checkIn
     * @param Carbon $checkOut
     * @return bool
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
    /**
     * Genera el PDF de la reserva delegando en PdfService
     * @param \App\Models\Reserva $reserva
     * @return \Barryvdh\DomPDF\PDF
     */
    public function generarPdf(Reserva $reserva): \Barryvdh\DomPDF\PDF
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
            $check_in = Carbon::parse($reserva->check_in);
            $check_out = Carbon::parse($reserva->check_out);

            $this->verificarDisponibilidad($tipo, $check_in, $check_out, $cantidad, function () use ($reserva, $tipo, $cantidad, $check_in, $check_out) {

                $precioPorHabitacion = $this->servicioPrecio->precioEntreFechas( $tipo, $check_in, $check_out);

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
    public function asignarHabitacionEnCheckIn(Reserva $reserva, $_actorId = null): array
    {
        $asignadas = [];

        DB::transaction(function () use ($reserva, &$asignadas) {
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
     * Asigna habitaciones específicas manualmente a una reserva existente
     * Verifica disponibilidad, elimina asignaciones anteriores y crea nuevas
     * Usado por: edición manual de reservas desde panel de control
     * Parámetros: reserva existente, array de IDs de habitaciones
     * Retorna: array con resultado de la operación
     */
    public function asignarHabitacionManual(Reserva $reserva, array $habitacionIds): array
    {
        $checkIn = Carbon::parse($reserva->check_in);
        $checkOut = Carbon::parse($reserva->check_out);

        // Verificar disponibilidad de las habitaciones seleccionadas (las que no son null)
        foreach ($habitacionIds as $habitacionId) {
            if ($habitacionId !== null && !$this->verificarDisponibilidadHabitacion($habitacionId, $checkIn, $checkOut, $reserva->id)) {
                $habitacion = Habitacion::find($habitacionId);
                $numero = $habitacion ? $habitacion->numero : $habitacionId;
                throw new \Exception("La habitación {$numero} no está disponible en las fechas seleccionadas.");
            }
        }

        $precioAntes = $reserva->precio_total ?? 0;

        DB::transaction(function () use ($reserva, $habitacionIds) {
            // Obtener los slots existentes (HabitacionReserva) ordenados para asignar por orden
            $slots = $reserva->habitaciones()->orderBy('id')->get();

            foreach ($habitacionIds as $idx => $habitacionId) {
                if (isset($slots[$idx])) {
                    $slot = $slots[$idx];

                    if ($habitacionId === null) {
                        $slot->update(['habitacion_id' => null]);
                    } else {
                        $habitacion = Habitacion::findOrFail($habitacionId);

                        // Actualizar el slot con la habitación física
                        // Mantener el precio que ya tenía el slot originalmente
                        $slot->update([
                            'habitacion_id' => $habitacionId,
                            'tipo' => $habitacion->tipo // Opcional: actualizar tipo si la física difiere del slot
                        ]);
                    }
                }
            }
        });

        // Refrescar reserva y recalcular precio_total si es necesario
        $reserva->refresh();
        $precioDespues = $reserva->precio_total ?? (float) $reserva->habitaciones->sum('precio');

        $diferencia = $precioDespues - $precioAntes;

        $result = [
            'success' => true,
            'message' => 'Habitaciones actualizadas correctamente',
            'habitaciones_asignadas' => count(array_filter($habitacionIds)),
            'precio_total' => $precioDespues,
            'precio_antes' => $precioAntes,
            'diferencia' => $diferencia,
        ];

        // Si hay diferencia de precio y la reserva está pagada, indicar que necesita pago o reembolso
        if ($diferencia != 0 && strtolower($reserva->pago) === 'pagado') {
            if ($diferencia > 0) {
                $result['requiere_pago'] = true;
                $result['monto_pago'] = $diferencia;
            } else {
                $result['requiere_reembolso'] = true;
                $result['monto_reembolso'] = abs($diferencia);
            }
        }

        return $result;
    }

    /**
     * Desasigna habitaciones específicas de una reserva existente
     * Elimina asignaciones de habitaciones físicas pero mantiene el registro de habitación requerida
     * Usado por: edición manual de reservas desde panel de control
     * Parámetros: reserva existente, array de IDs de habitaciones a desasignar
     * Retorna: array con resultado de la operación
     */
    public function desasignarHabitaciones(Reserva $reserva, array $habitacionIds): array
    {
        $desasignadas = 0;

        DB::transaction(function () use ($reserva, $habitacionIds, &$desasignadas) {
            foreach ($habitacionIds as $habitacionId) {
                // Buscar la asignación específica de esta habitación
                $asignacion = HabitacionReserva::where('reserva_id', $reserva->id)
                    ->where('habitacion_id', $habitacionId)
                    ->first();

                if ($asignacion) {
                    // Solo desasignar la habitación física, mantener el registro con habitacion_id = null
                    $asignacion->update(['habitacion_id' => null]);
                    $desasignadas++;
                }
            }

            // NO actualizar precio_total al desasignar porque el precio total
            // incluye tarifas y otros modificadores que no están en los precios de habitaciones
            // La desasignación solo libera la habitación física pero mantiene el precio de la reserva
        });

        return [
            'success' => true,
            'message' => 'Habitaciones desasignadas correctamente',
            'habitaciones_desasignadas' => $desasignadas,
            'precio_total' => $reserva->fresh()->precio_total
        ];
    }

    /**
     * Formatea una colección de reservas para respuesta API
     * Incluye cliente, habitaciones, precios y estadísticas
     * Usado por: controladores de listado de reservas
     * Retorna: array formateado de reservas
     */

    public function formatearReservas(\Illuminate\Support\Collection $reservas): array
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
                'descuento_aplicado' => $reserva->descuento_aplicado ?? 0,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => $reembolsosTotal,
                'notas' => $reserva->notas,
                'created_at' => $reserva->created_at ? $reserva->created_at->toIso8601String() : null,
                'cliente_name' => $nombreCliente,
                'booked_by_user' => $reserva->bookedBy->name ?? 'Sistema',
                // Exponer pagos resumidos y último pago para UI (evita N+1 ya que los controllers hacen eager-load)
                'pagos' => $reserva->pagos->map(function($p) { return [
                    'id' => $p->id,
                    'monto' => (float) ($p->monto ?? 0),
                    'estado' => $p->estado,
                    'created_at' => $p->created_at?->toIso8601String() ?? null,
                ]; })->values()->toArray(),
                'ultimo_pago_monto' => $reserva->pagos->count() ? (float) $reserva->pagos->last()->monto : null,
                'habitacion_numero' => (function() use ($reserva) {
                    $nums = $reserva->habitaciones->map(function($hr) { return $hr->habitacion?->numero ?? null; })->filter()->values();
                    return $nums->count() ? $nums->implode(', ') : 's/a';
                })(),
            ];
        })->toArray();
    }


    /**
     * Formatea información del cliente de una reserva
     * Determina si es usuario registrado o cliente invitado
     * Usado por: formatearReservas(), detalles de reserva
     * Retorna: array con tipo y nombre del cliente
     * @param \App\Models\Reserva $reserva
     * @return array<string, mixed>
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
     * Formatea lista de reembolsos con tipos (parcial/completo)
     * Calcula los tipos según el monto acumulado vs total de la reserva
     * Usado por: controlador show(), detalles de reserva
     * Retorna: array de reembolsos formateados
     */
    public function formatearReembolsos(Reserva $reserva): array
    {
        $reservaTotal = $reserva->precio_total ?? 0;
        $cumulative = 0;

        return $reserva->reembolsos->sortBy('created_at')->values()->map(function ($r) use ($reservaTotal, &$cumulative) {
            $amount = ($r->amount_cents ?? 0) / 100;
            $cumulative += $amount;

            // Determinar si es reembolso parcial o completo
            $tipo = 'parcial';
            if ($reservaTotal > 0 && $cumulative >= $reservaTotal) {
                $tipo = 'completo';
            }

            return [
                'id' => $r->id,
                'monto' => round($amount, 2),
                'status' => $r->status,
                'reason' => $r->reason ?? null,
                'created_at' => $r->created_at?->format('Y-m-d H:i:s') ?? null,
                'tipo' => $tipo,
            ];
        })->values()->toArray();
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
        // `habitacion_ids` puede no enviarse en actualizaciones que solo cambian fechas
        $habitacionIds = $validated['habitacion_ids'] ?? [];

        if (!empty($habitacionIds)) {
            foreach ($habitacionIds as $id) {
                if ($id === null) continue;
                if (!$this->verificarDisponibilidadHabitacion($id, $checkIn, $checkOut, $reserva->id)) {
                    $num = Habitacion::find($id)->numero ?? $id;
                    throw new \Exception("La habitación {$num} ya está ocupada en esas fechas.");
                }
            }
        }

        $oldCheckIn = $reserva->check_in;
        $oldCheckOut = $reserva->check_out;

        $reserva->update(['check_in' => $checkIn,
            'check_out' => $checkOut,
            'status' => $validated['status'],
            'pago' => $validated['pago'],
            'notas' => $validated['notas'] ?? null,
        ]);

        // Determinar nuevo precioTotal:
        // - Si se envían `habitacion_ids` usamos la asignación manual que devuelve el precio calculado
        // - Si no se envían, recalculamos el precio para las habitaciones ya asociadas a la reserva
        $precioTotal = $reserva->precio_total ?? 0;
        if (!empty($habitacionIds)) {
            $asignacionResult = $this->asignarHabitacionManual($reserva, $habitacionIds);
            $precioTotal = $asignacionResult['precio_total'] ?? ($reserva->precio_total ?? $precioTotal);

            // Log asignación manual result for debugging price differences
            try {
                Log::info('actualizarReserva - asignarHabitacionManual result', [
                    'reserva_id' => $reserva->id,
                    'asignacionResult' => $asignacionResult,
                    'precio_total_after_asignacion' => $precioTotal,
                ]);
            } catch (\Throwable $_) {}
        } else {
            // Recalcular precio usando los tipos y cantidades actuales de la reserva
            try {
                $tiposMap = [];
                foreach ($reserva->habitaciones as $hr) {
                    $tipo = $hr->tipo ?? ($hr->habitacion?->tipo ?? null);
                    if (!$tipo) continue;
                    if (!isset($tiposMap[$tipo])) $tiposMap[$tipo] = 0;
                    $tiposMap[$tipo]++;
                }

                $habitacionesParaCalculo = [];
                foreach ($tiposMap as $tipo => $cantidad) {
                    $habitacionesParaCalculo[] = ['tipo' => $tipo, 'cantidad' => $cantidad];
                }

                    if (!empty($habitacionesParaCalculo)) {
                    // Evitar ambigüedad en columnas cuando se hace join: preferimos usar la relación ya cargada
                    // o calificar la columna con el nombre de la tabla.
                    if ($reserva->relationLoaded('tarifas')) {
                        $tarifaIds = $reserva->tarifas->pluck('id')->toArray();
                    } else {
                        $tarifaIds = $reserva->tarifas()->pluck('tarifas.id')->toArray();
                    }
                    $resultadoPrecio = $this->servicioPrecio->calcularPrecioCompleto($habitacionesParaCalculo, $checkIn, $checkOut, $tarifaIds, $reserva->cupon_id ?? null);
                    if (isset($resultadoPrecio['precio_total'])) {
                        $precioTotal = $resultadoPrecio['precio_total'];
                    }

                    // Log calculated price details for comparison with preview
                    try {
                        Log::info('actualizarReserva - precio recalculado', [
                            'reserva_id' => $reserva->id,
                            'check_in' => $checkIn->format('Y-m-d'),
                            'check_out' => $checkOut->format('Y-m-d'),
                            'tiposMap' => $tiposMap,
                            'habitacionesParaCalculo' => $habitacionesParaCalculo,
                            'tarifaIds' => $tarifaIds,
                            'resultadoPrecio' => $resultadoPrecio,
                            'precioTotal_computed' => $precioTotal,
                            'precioTotal_before' => $reserva->precio_total ?? null,
                        ]);
                    } catch (\Throwable $_) {}
                }
            } catch (\Throwable $e) {
                Log::warning('Error recalculando precio en actualizarReserva: ' . $e->getMessage(), ['reserva_id' => $reserva->id]);
            }
        }

        $totalViejo = (float) $reserva->precio_total;
        $diffSigned = round($precioTotal - $totalViejo, 2);
        $refundInfo = null;

        $reserva->update(['precio_total' => $precioTotal]);

        // Crear una solicitud de reembolso SOLO si cambian las fechas y cambia el importe total
        $datesChanged = ($oldCheckIn != $checkIn->format('Y-m-d')) || ($oldCheckOut != $checkOut->format('Y-m-d'));
        $priceChanged = ($totalViejo != $precioTotal);

        if ($datesChanged && $priceChanged) {
            $refundInfo = [
                'queued' => true,
                'amount' => round(abs($precioTotal - $totalViejo), 2),
            ];

            // Crear RefundRequest tras el commit de la transacción para asegurar que el precio ya está persistido
            DB::afterCommit(function() use ($reserva, $checkIn, $checkOut, $precioTotal, $totalViejo) {
                try {
                    // Obtener pagos completados para determinar el importe total pagado
                    $pagosCompletados = $reserva->pagos()->whereIn('estado', ['pagado', 'completado'])->get();
                    $totalPagado = (float) $pagosCompletados->sum(function ($p) { return (float) ($p->monto ?? 0); });
                    $pagoId = $pagosCompletados->first()?->id ?? null;

                    // Si no hay pagos detectados, como fallback pedimos el importe antiguo
                    $requestedAmount = $totalPagado > 0 ? $totalPagado : (float)$totalViejo;

                    $userForRefund = $reserva->user ?? $reserva->reservable ?? \Illuminate\Support\Facades\Auth::user();

                    // Crear la solicitud de reembolso (pendiente) con información del nuevo total y fechas
                    $rr = \App\Models\RefundRequest::create([
                        'reserva_id' => $reserva->id,
                        'pago_id' => $pagoId,
                        'requested_amount_cents' => (int)round($requestedAmount * 100),
                        'status' => 'pending',
                        'user_id' => $userForRefund?->id ?? null,
                        'reason_code' => 'cambio_fechas',
                        'notes' => 'Solicitud generada automáticamente tras cambio de fechas',
                        'pending_check_in' => $checkIn->format('Y-m-d'),
                        'pending_check_out' => $checkOut->format('Y-m-d'),
                        'pending_nuevo_total' => $precioTotal,
                    ]);

                    // Emitir notificación para equipos/admins
                    try {
                        \Notification::route('mail', config('app.admin_email'))->notify(new \App\Notifications\RefundRequestCreatedNotification($rr));
                    } catch (\Throwable $_) {}

                    Log::info('RefundRequest creado tras cambio de fechas', ['reserva_id' => $reserva->id, 'refund_request_id' => $rr->id, 'requested_amount' => $requestedAmount]);
                } catch (\Throwable $e) {
                    Log::error('Error creando RefundRequest en afterCommit: ' . $e->getMessage(), ['reserva_id' => $reserva->id]);
                }
            });
        }

        // Asegurar que el evento solo se despache tras un commit exitoso
        try {
            DB::afterCommit(function() use ($reserva, $meta) {
                try {
                    event(new ReservaActualizada($reserva, $meta ?? null));
                } catch (\Throwable $e) {
                    Log::warning('Emitir ReservaActualizada failed (afterCommit): ' . $e->getMessage());
                }
            });
        } catch (\Throwable $e) {
            // Registrar advertencia pero no bloquear la operación
            Log::warning('Registrar afterCommit failed: ' . $e->getMessage());
        }

        return ['refund' => $refundInfo];
    }

    // Métodos de extensión eliminados.
    /**
     * Nota: las funciones relacionadas con la extensión de reservas fueron retiradas.
     */
}


