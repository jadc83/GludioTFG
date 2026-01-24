<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Pago;
use App\Models\Refund;
use Illuminate\Support\Facades\Log;
use Stripe\StripeClient;
use App\Models\Reserva;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Events\ReservaCreada;
use App\Events\ReservaBorrada;
use App\Events\ReservaActualizada;
use Barryvdh\DomPDF\Facade\Pdf;

class ReservaService
{
    private PrecioService $precioService;

    public function __construct(?PrecioService $precioService = null)
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
     * Prepara y valida fechas para la vista de edición
     * Devuelve array [Carbon $checkIn, Carbon $checkOut]
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
     * Formatea la reserva para la vista de edición
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
                    'id' => $hr->habitacion->id,
                    'numero' => $hr->habitacion->numero,
                    'tipo' => $hr->habitacion->tipo,
                    'precio_noche' => $hr->precio ? round($hr->precio / max(1, $noches), 2) : null,
                    'capacidad' => $hr->habitacion->capacidad,
                    'precio' => $hr->precio,
                ];
            })->values(),
        ];

        return $reservaData;
    }

    /**
     * Obtiene las habitaciones disponibles y calcula precios para la vista de edición
     * Devuelve una colección mapeada lista para enviar a la vista.
     */
    public function obtenerHabitacionesYPreciosParaEdicion(Reserva $reserva, Carbon $checkIn, Carbon $checkOut)
    {
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
            $precioDinamico = $this->precioService->calcularPrecioEntreFechas($hab->tipo, $checkIn, $checkOut);

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
     * Crea una reserva usando los helpers del servicio.
     * Devuelve la instancia creada (con id).
     */
    public function crearReserva(array $datos, ?User $usuario = null, string $status = 'pendiente'): Reserva
    {
        $datosPreparados = $this->prepararDatosReserva($datos);

        // Verificar disponibilidad
        $this->verificarDisponibilidad($datosPreparados['habitaciones'], $datosPreparados['check_in'], $datosPreparados['check_out']);

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

        // Crear dentro de transacción
        return DB::transaction(function () use ($datosPreparados, $usuario, $status, $reservableType) {
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

            // Disparar evento
            event(new ReservaCreada($reserva));

            return $reserva;
        });
    }

    /**
     * Elimina una reserva y sus relaciones dentro de transacción.
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
        foreach ($habitacionesRequeridas as $habitacion) {
            $tipo = $habitacion['tipo'] ?? null;
            $cantidad = $habitacion['cantidad'] ?? 0;

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
            })->count();
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

    /**
     * Genera y devuelve el objeto PDF para una reserva (no lo descarga)
     */
    public function generarComprobantePdf(Reserva $reserva)
    {
        $checkIn = Carbon::parse($reserva->check_in);
        $checkOut = Carbon::parse($reserva->check_out);
        $noches = max(1, $checkIn->diffInDays($checkOut));

        $data = [
            'reserva' => $reserva,
            'cliente' => $this->formatearCliente($reserva),
            'noches' => $noches,
            'fecha_generacion' => now()->format('d/m/Y H:i'),
        ];

        // Se ha eliminado la generación y descarga del QR para el comprobante PDF.
        // El PDF no incluirá el QR; si se desea mostrar el QR en otras ubicaciones
        // (vistas o emails), gestionarlo allí explícitamente.

        $pdf = Pdf::loadView('pdf.comprobante-reserva', $data);
        // Permitir imágenes remotas y parser HTML5 para asegurar renderizado de imágenes/data-uris
        try {
            $pdf->setOptions([
                'isRemoteEnabled' => true,
                'isHtml5ParserEnabled' => true,
            ]);
        } catch (\Throwable $e) {
            \Log::warning('No se pudieron aplicar opciones a DomPDF: ' . $e->getMessage());
        }

        return $pdf;
    }

    /**
     * Determina si la reserva es elegible para reembolso (48h y pago pagado)
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

    /**
     * Solicita un reembolso para la reserva: busca el pago, aplica fallbacks, crea refund en Stripe y registra en BD.
     * Retorna array con keys: success (bool) y message (string).
     */
    public function solicitarReembolso(Reserva $reserva, $usuario): array
    {
        // Permisos: el usuario debe ser el reservable o el creador
        $esPropietario = false;
        try {
            $esPropietario = (
                ($reserva->reservable_type === get_class($usuario) && $reserva->reservable_id == $usuario->id)
                || $reserva->user_id == $usuario->id
                || $reserva->booked_by_user_id == $usuario->id
            );
        } catch (\Throwable $e) {
            $esPropietario = false;
        }

        if (! $esPropietario) {
            return ['success' => false, 'message' => 'No autorizado para solicitar este reembolso.'];
        }

        if (! $this->puedeReembolsar($reserva)) {
            return ['success' => false, 'message' => 'No se puede solicitar reembolso con menos de 48 horas antes del check-in o reserva no pagada.'];
        }

        // Buscar pago preferente: último completado
        $pago = $reserva->pagos()->where('estado', 'completado')->orderByDesc('pagado_en')->first();
        if (! $pago) {
            $pago = Pago::where('reserva_id', $reserva->id)->whereNotNull('stripe_payment_intent_id')->orderByDesc('pagado_en')->first();
            if ($pago) {
                Log::info("ReservaService fallback: encontrado pago por reserva_id para reembolso: {$pago->id}");
            }
        }

        $payment_intent_id = $pago->stripe_payment_intent_id ?? null;

        if (empty($payment_intent_id) && $pago && !empty($pago->stripe_response)) {
            try {
                $resp = is_array($pago->stripe_response) ? $pago->stripe_response : (array)$pago->stripe_response;
                if (!empty($resp['id'])) {
                    $payment_intent_id = $resp['id'];
                } elseif (!empty($resp['payment_intent'])) {
                    $payment_intent_id = $resp['payment_intent'];
                } elseif (!empty($resp['charges']) && is_array($resp['charges']) && !empty($resp['charges']['data'][0]['payment_intent'])) {
                    $payment_intent_id = $resp['charges']['data'][0]['payment_intent'];
                }
                if ($payment_intent_id) {
                    Log::info("ReservaService: extraído payment_intent desde stripe_response del pago {$pago->id}: {$payment_intent_id}");
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo parsear stripe_response para extraer payment_intent: ' . $e->getMessage());
            }
        }

        // Intentar buscar en Stripe por metadata.localizador si aún no tenemos payment_intent
        if (empty($payment_intent_id)) {
            try {
                $stripeClient = new StripeClient(config('services.stripe.secret'));
                $query = "metadata['localizador']:'{$reserva->localizador}'";
                $search = $stripeClient->paymentIntents->search(['query' => $query, 'limit' => 1]);
                if (!empty($search->data) && count($search->data) > 0) {
                    $pi = $search->data[0];
                    $payment_intent_id = $pi->id ?? null;
                    Log::info("ReservaService: encontrado PaymentIntent en Stripe por metadata.localizador={$reserva->localizador}: {$payment_intent_id}");
                }
            } catch (\Throwable $e) {
                Log::warning('Error buscando PaymentIntent en Stripe por metadata.localizador: ' . $e->getMessage());
            }
        }

        if (! $pago || empty($payment_intent_id)) {
            return ['success' => false, 'message' => 'No se encontró un pago válido para reembolsar.'];
        }

        // Evitar reembolsos dobles
        if (Refund::where('pago_id', $pago->id)->exists()) {
            return ['success' => false, 'message' => 'Este pago ya fue reembolsado.'];
        }

        try {
            $stripe = new StripeClient(config('services.stripe.secret'));
            $refund = $stripe->refunds->create(['payment_intent' => $payment_intent_id]);

            Refund::create([
                'pago_id' => $pago->id,
                'reserva_id' => $reserva->id,
                'stripe_refund_id' => $refund->id ?? null,
                'amount_cents' => $refund->amount ?? null,
                'currency' => $refund->currency ?? null,
                'status' => $refund->status ?? null,
                'stripe_response' => $refund->toArray(),
            ]);

            try { $pago->update(['estado' => 'cancelado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago tras reembolso: ' . $e->getMessage()); }
            try { $reserva->update(['pago' => 'devuelto', 'status' => 'cancelado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de reserva tras reembolso: ' . $e->getMessage()); }

            return ['success' => true, 'message' => 'Reembolso solicitado correctamente.'];
        } catch (\Stripe\Exception\ApiErrorException $e) {
            Log::error('Stripe Refund Error: ' . $e->getMessage());
            $msg = $e->getMessage();
            if (stripos($msg, 'already been refunded') !== false || stripos($msg, 'already refunded') !== false) {
                return ['success' => false, 'message' => 'El cargo ya ha sido reembolsado anteriormente.'];
            }
            return ['success' => false, 'message' => 'Error al solicitar reembolso en Stripe.'];
        } catch (\Throwable $e) {
            Log::error('ReservaService Refund Error: ' . $e->getMessage());
            return ['success' => false, 'message' => 'Error interno al procesar reembolso.'];
        }
    }

    /**
     * Maneja un evento de reembolso/charge.refunded desde Stripe.
     * Acepta el objeto de refund/charge (puede venir como stdClass/array) y crea/actualiza Refund en BD.
     */
    public function handleRefundEvent($refundObj): void
    {
        try {
            // Para 'charge.refunded' el objeto puede ser un Charge con 'refunds' o un Refund directo
            if (is_object($refundObj) && property_exists($refundObj, 'refunds')) {
                $charge = $refundObj;
                $refunds = $charge->refunds ?? null;
                if ($refunds && isset($refunds->data) && count($refunds->data) > 0) {
                    $single = end($refunds->data);
                    $refundData = $single;
                } else {
                    $refundData = null;
                }
            } else {
                $refundData = $refundObj;
            }

            if (empty($refundData)) return;

            // Buscar pago por payment_intent o por charge
            $pago = null;
            if (!empty($refundData->payment_intent)) {
                $pago = Pago::where('stripe_payment_intent_id', $refundData->payment_intent)->first();
            }
            if (!$pago && !empty($refundData->charge)) {
                $pago = Pago::whereJsonContains('stripe_response', ['charge' => $refundData->charge])->first();
            }

            // Si no encontramos por payment_intent/charge, intentar recuperar metadata del payment_intent en Stripe
            if (!$pago && !empty($refundData->payment_intent)) {
                try {
                    $stripeClient = new StripeClient(config('services.stripe.secret'));
                    $pi = $stripeClient->paymentIntents->retrieve($refundData->payment_intent, []);
                    $metadata = $pi->metadata ?? null;
                    if (!empty($metadata) && !empty($metadata->localizador)) {
                        $localizador = $metadata->localizador;
                        $pago = Pago::whereHas('reserva', function ($q) use ($localizador) {
                            $q->where('localizador', $localizador);
                        })->where('estado', 'completado')->orderByDesc('pagado_en')->first();
                    }
                } catch (\Throwable $e) {
                    Log::warning('ReservaService.handleRefundEvent: no se pudo recuperar PaymentIntent desde Stripe: ' . $e->getMessage());
                }
            }

            if ($pago) {
                $existing = Refund::where('stripe_refund_id', $refundData->id)->first();
                if (!$existing) {
                    Refund::create([
                        'pago_id' => $pago->id,
                        'reserva_id' => $pago->reserva_id,
                        'stripe_refund_id' => $refundData->id ?? null,
                        'amount_cents' => $refundData->amount ?? null,
                        'currency' => $refundData->currency ?? null,
                        'status' => $refundData->status ?? null,
                        'reason' => $refundData->reason ?? null,
                        'stripe_response' => is_object($refundData) ? (array)$refundData : $refundData,
                    ]);
                }

                try { $pago->update(['estado' => 'cancelado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de pago desde handleRefundEvent: ' . $e->getMessage()); }
                try { $pago->reserva->update(['pago' => 'devuelto', 'status' => 'cancelado']); } catch (\Throwable $e) { Log::warning('No se pudo actualizar estado de reserva desde handleRefundEvent: ' . $e->getMessage()); }
            }
        } catch (\Throwable $e) {
            Log::error('ReservaService.handleRefundEvent error: ' . $e->getMessage());
        }
    }

    /**
     * Asigna habitaciones a una reserva
     */
    public function asignarHabitaciones(Reserva $reserva, array $habitacionesRequeridas): void
    {
        foreach ($habitacionesRequeridas as $requerida) {
            $tipo = $requerida['tipo'];
            $cantidad = $requerida['cantidad'];

            // Obtener habitaciones disponibles del tipo solicitado
            $habitaciones = Habitacion::where('tipo', $tipo)
                ->where('estado', 'disponible')
                ->whereDoesntHave('reservas', function ($query) use ($reserva) {
                    $query->where('reserva_id', '!=', $reserva->id)
                          ->where('check_in', '<', $reserva->check_out)
                          ->where('check_out', '>', $reserva->check_in);
                })->limit($cantidad)->get();

            if ($habitaciones->count() < $cantidad) {
                throw new \Exception("No hay {$cantidad} habitación/es de tipo '{$tipo}' disponibles para las fechas seleccionadas.");
            }

            // Calcular precio usando el servicio de precios
            $precioPorHabitacion = $this->precioService->calcularPrecioEntreFechas(
                $tipo, Carbon::parse($reserva->check_in), Carbon::parse($reserva->check_out));

            foreach ($habitaciones as $habitacion) {
                HabitacionReserva::create([
                    'reserva_id' => $reserva->id,
                    'habitacion_id' => $habitacion->id,
                    'check_in' => $reserva->check_in,
                    'check_out' => $reserva->check_out,
                    'precio' => $precioPorHabitacion,
                ]);
            }
        }
    }

    /**
     * Verifica si una habitación está disponible en las fechas especificadas
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
     * Formatea una colección de reservas para la respuesta
     */
    public function formatearReservas($reservas): array
    {
        return $reservas->map(function ($reserva) {
            $nombreCliente = 'Sin cliente';
            if ($reserva->reservable) {
                $nombreCliente = $reserva->reservable->name ?? 'Sin cliente';
            }

            return [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'notas' => $reserva->notas,
                'created_at' => $reserva->created_at ? $reserva->created_at->toIso8601String() : null,
                'cliente_name' => $nombreCliente,
                'booked_by_user' => $reserva->bookedBy->name ?? 'Sistema',
                'habitacion_numero' => $reserva->habitaciones->count() ? $reserva->habitaciones->pluck('habitacion.numero')->implode(', ') : 'Sin asignar',
            ];
        })->toArray();
    }

    /**
     * Formatea el cliente de una reserva
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
     * Actualiza una reserva con nuevas habitaciones y fechas
     */
    public function actualizarReserva(Reserva $reserva, array $validated): void
    {
        $checkIn = Carbon::parse($validated['check_in']);
        $checkOut = Carbon::parse($validated['check_out']);
        $habitacionIds = $validated['habitacion_ids'];

        // Verificar disponibilidad
        foreach ($habitacionIds as $id) {
            if (!$this->verificarDisponibilidadHabitacion($id, $checkIn, $checkOut, $reserva->id)) {
                $num = Habitacion::find($id)->numero ?? $id;
                throw new \Exception("La habitación {$num} ya está ocupada en esas fechas.");
            }
        }

        // Actualizar fechas y estados
        $reserva->update(['check_in' => $checkIn,
            'check_out' => $checkOut,
            'status' => $validated['status'],
            'pago' => $validated['pago'],
            'notas' => $validated['notas'] ?? null,
        ]);

        // Eliminar habitaciones antiguas
        $reserva->habitaciones()->delete();

        // Asignar nuevas habitaciones con precios recalculados
        $precioTotal = 0;
        foreach ($habitacionIds as $habitacionId) {
            $habitacion = Habitacion::findOrFail($habitacionId);
            $precioHabitacion = $this->precioService->calcularPrecioEntreFechas(
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

        $reserva->update(['precio_total' => $precioTotal]);

        try {
            event(new ReservaActualizada($reserva));
        } catch (\Throwable $e) {
            // No detener la lógica en caso de fallo al emitir el evento
        }
    }

    /**
     * Obtiene información sobre si una reserva puede extenderse
     */
    public function obtenerInfoExtension(Reserva $reserva): array
    {
        $checkOut = Carbon::parse($reserva->check_out);
        $horasHastaCheckout = now()->diffInHours($checkOut, false);

        // Verificar si se puede extender
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
     * Verifica disponibilidad para extensión de reserva
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
     */
    public function calcularPrecioExtension(Reserva $reserva, Carbon $checkOutActual, Carbon $nuevoCheckOut): float
    {
        $precioExtension = 0;

        foreach ($reserva->habitaciones as $habitacionReserva) {
            $habitacion = $habitacionReserva->habitacion;
            $precioExtension += $this->precioService->calcularPrecioEntreFechas(
                $habitacion->tipo,
                $checkOutActual,
                $nuevoCheckOut
            );
        }

        return $precioExtension;
    }

    /**
     * Aplica la extensión a una reserva
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
     * Extiende una reserva: valida, calcula precio y aplica si se confirma.
     * Retorna información útil para el controlador/cliente.
     * @param string $localizador
     * @param int $numeroDias
     * @param bool $confirmar
     * @return array
     * @throws \Exception
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
                event(new ReservaActualizada($reserva));
            } catch (\Throwable $e) {
                // ignore
            }
            return [ 'success' => true, 'aplicada' => true, 'nuevo_check_out' => $nuevoCheckOut->toDateString(), 'precio_extension' => $precioExtension, 'necesita_pago' => $necesitaPago ];
        }

        return [ 'success' => true, 'aplicada' => false, 'nuevo_check_out' => $nuevoCheckOut->toDateString(), 'precio_extension' => $precioExtension, 'necesita_pago' => $necesitaPago ];
    }

    /**
     * Recalcula los precios de todas las reservas
     */
    public function recalcularPreciosTodasReservas(): int
    {
        $reservas = Reserva::with(['habitaciones.habitacion'])->get();
        $actualizadas = 0;

        foreach ($reservas as $reserva) {
            $precioTotal = 0;

            foreach ($reserva->habitaciones as $habitacionReserva) {
                if ($habitacionReserva->habitacion) {
                    $precioDia = $this->precioService->calcularPrecioEntreFechas(
                        $habitacionReserva->habitacion->tipo,
                        Carbon::parse($habitacionReserva->check_in ?? $reserva->check_in),
                        Carbon::parse($habitacionReserva->check_out ?? $reserva->check_out)
                    );
                    $precioTotal += $precioDia;

                    // Actualizar el precio en la tabla habitacion_reserva
                    $habitacionReserva->update(['precio' => $precioDia]);
                }
            }

            // Actualizar el precio_total en la tabla reserva
            if ($precioTotal > 0) {
                $reserva->update(['precio_total' => $precioTotal]);
                $actualizadas++;
            }
        }

        return $actualizadas;
    }
}


