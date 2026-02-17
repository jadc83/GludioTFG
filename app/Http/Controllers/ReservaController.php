<?php

namespace App\Http\Controllers;

use App\Helpers\ErrorHelper;
use App\Http\Requests\StoreReservaRequest;
use App\Http\Requests\UpdateReservaRequest;
use App\Models\Reserva;
use App\Services\ReservaService;
use App\Services\HabitacionService;
use App\Services\PrecioService;
use App\Services\ReservaFormatterService;
use App\Http\Traits\JsonResponse;
use App\Models\Cupon;
use App\Models\CuponAplicado;
use App\Services\PaymentService;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;


class ReservaController extends Controller
{
    use JsonResponse;

    protected ReservaService $reservaService;
    protected PrecioService $precioService;
    protected HabitacionService $habitacionService;
    protected ReservaFormatterService $formatterService;
    protected PaymentService $paymentService;

    public function __construct(
        ReservaService $reservaService,
        PrecioService $precioService,
        HabitacionService $habitacionService,
        ReservaFormatterService $formatterService,
        PaymentService $paymentService
    ) {
        $this->reservaService = $reservaService;
        $this->precioService = $precioService;
        $this->habitacionService = $habitacionService;
        $this->formatterService = $formatterService;
        $this->paymentService = $paymentService;
    }


    /**
     * Lista reservas con filtros y paginación
     * GET /reservas - Panel de administración de reservas
     * Filtros: status, localizador, cliente, habitación
     * Devuelve: vista con reservas paginadas
     *
     * @param \Illuminate\Http\Request $request
     * @return array<string,mixed>|\Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        $query = Reserva::withReservable()
            ->with(['habitaciones.habitacion', 'bookedBy', 'pagos'])
            ->status($request->status)
            ->localizador($request->localizador)
            ->cliente($request->cliente)
            ->habitacion($request->habitacion);

        if (($request->input('trashed') ?? '') === 'with') {
            $query = $query->withTrashed();
        } elseif (($request->input('trashed') ?? '') === 'only') {
            $query = $query->onlyTrashed();
        }

        $reservas = $query->orderBy('check_in', 'desc')->get();

        $reservasJson = $this->formatterService->formatearReservas($reservas);

        if ($request->wantsJson()) {
            return response()->json($reservasJson);
        }

        return ['reservas' => $reservasJson];
    }



    /**
     * Crea nueva reserva desde formulario
     * POST /reservas - Procesa datos del formulario de reserva
     * Valida datos, crea reserva y envía email de confirmación
     * Devuelve: redirección con mensaje de éxito
     *
     * @param \App\Http\Requests\StoreReservaRequest $request
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function store(StoreReservaRequest $request)
    {

        try {

            try {
                if ($request->has('numero_doocumento') && !$request->has('numero_documento')) {
                    Log::warning('ReservaController::store - normalizing misspelled numero_doocumento', ['original' => $request->input('numero_doocumento')]);
                    $request->merge(['numero_documento' => $request->input('numero_doocumento')]);
                }
            } catch (\Throwable $e) {
                Log::warning('ReservaController::store - normalization failed: ' . $e->getMessage());
            }

            try {
                Log::info('ReservaController::store - incoming payload summary', [
                    'metodo_pago' => $request->input('metodo_pago'),
                    'habitaciones_present' => $request->has('habitaciones'),
                    'habitaciones' => $request->input('habitaciones'),
                ]);
            } catch (\Throwable $e) {
                Log::warning('ReservaController::store - could not log incoming payload: ' . $e->getMessage());
            }

            $action = app(\App\Actions\Reservas\CreateReservaAction::class);
            $result = $action->handle($request->all(), Auth::user(), $request->status ?? 'pendiente');

            $mensaje = isset($result['reserva']) ? "Reserva {$result['reserva']->localizador} creada (Total: €{$result['reserva']->precio_total})" : 'Reserva creada';
            if (!is_string($mensaje)) {
                $mensaje = is_scalar($mensaje) ? (string)$mensaje : json_encode($mensaje);
            }

            $respuesta = [
                'success' => true,
                'localizador' => $result['localizador'] ?? null,
                'reserva_id' => $result['reserva_id'] ?? null,
                'message' => $mensaje,
            ];

            try {
                $reservaModel = $result['reserva'] ?? null;
                if ($reservaModel) {
                    $reservaModel->loadMissing(['reservable', 'habitaciones.habitacion', 'tarifa', 'tarifas', 'refundRequests']);
                    $respuesta['reserva'] = $this->formatterService->formatearReservaParaEdicion($reservaModel);
                }
            } catch (\Throwable $__e) {
                Log::warning('ReservaController::store - could not format reserva for response: ' . $__e->getMessage());
            }

            try {
                if (($request->input('metodo_pago') ?? '') === 'recepcion') {
                    Log::info('Reserva creada (recepcion) payload', [
                        'payload' => $request->only(['name', 'email', 'telefono', 'numero_documento', 'nacionalidad', 'direccion', 'habitaciones', 'metodo_pago']),
                        'resultado' => $respuesta,
                    ]);
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo loggear payload recepcion: ' . $e->getMessage());
            }

            if ($request->wantsJson()) {
                return response()->json($respuesta);
            }

            try {
                if (($request->input('metodo_pago') ?? '') === 'recepcion') {
                    return redirect()->route('reserva.show', $respuesta['localizador'])
                        ->with('success', $mensaje)
                        ->with('reserva_id', $respuesta['reserva_id'])
                        ->with('localizador', $respuesta['localizador']);
                }
            } catch (\Throwable $e) {
                Log::warning('ReservaController::store - fallo redirigiendo recepcion: ' . $e->getMessage());
            }

            try {
                Log::info('ReservaController::store - about to redirect back with success', [
                    'mensaje' => $mensaje,
                    'request' => $request->only(['metodo_pago', 'name', 'email', 'numero_documento', 'reservable_id']),
                    'session' => session()->all(),
                    'flash' => session()->get('flash', null),
                ]);
            } catch (\Throwable $e) {
                Log::warning('ReservaController::store - could not log session: ' . $e->getMessage());
            }

            return redirect()->back()
                ->with('success', $mensaje)
                ->with('reserva_id', $respuesta['reserva_id'])
                ->with('localizador', $respuesta['localizador']);

        } catch (\Exception $e) {
            Log::error('Error en ReservaController::store', [
                'mensaje' => $e->getMessage(),
                'archivo' => $e->getFile(),
                'linea' => $e->getLine(),
            ]);

            $decodificado = json_decode($e->getMessage(), true);
            if (is_array($decodificado) && isset($decodificado['codigo'])) {
                if ($request->wantsJson()) {
                    return response()->json([
                        'success' => false,
                        'error' => 'cliente_existe_sin_confirmacion',
                        'cliente_existente' => $decodificado['cliente_existente'],
                    ], 409);
                }
            }

            $mensajeAmigable = ErrorHelper::obtenerMensajeAmigable($e);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => $mensajeAmigable], 400);
            }

            try {
                Log::info('ReservaController::store - returning back with errors', [
                    'mensajeAmigable' => $mensajeAmigable,
                    'request' => $request->all(),
                    'session' => session()->all(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('ReservaController::store - could not log session on error: ' . $e->getMessage());
            }

            return back()->withErrors(['error' => $mensajeAmigable]);
        }
    }

    /**
     * Crea una reserva y, opcionalmente, inicia un Checkout de Stripe en la misma operación
     *
     * @param \App\Http\Requests\StoreReservaRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function storeConCheckout(StoreReservaRequest $request)
    {
        try {
            $action = app(\App\Actions\Reservas\CreateReservaAction::class);
            $result = $action->handle($request->all(), Auth::user(), $request->status ?? 'pendiente');

            $reservaId = $result['reserva_id'] ?? null;
            if (!$reservaId) {
                return response()->json(['success' => false, 'error' => 'No se pudo crear la reserva'], 400);
            }

            $reserva = \App\Models\Reserva::find($reservaId);
            $monto = $request->input('monto', $reserva->precio_total ?? 0);

            if (($request->input('metodo_pago') ?? '') === 'recepcion') {
                Log::info('storeConCheckout: metodo_pago=recepcion; omitiendo creación de Checkout', ['reserva_id' => $reserva->id]);

                try {
                    $reserva->loadMissing(['reservable', 'habitaciones.habitacion', 'tarifa', 'tarifas', 'refundRequests']);
                    $reservaFormateada = $this->formatterService->formatearReservaParaEdicion($reserva);
                } catch (\Throwable $__e) {
                    $reservaFormateada = null;
                }

                return response()->json([
                    'success' => true,
                    'sessionUrl' => null,
                    'reserva_id' => $reserva->id,
                    'localizador' => $reserva->localizador,
                    'reserva' => $reservaFormateada,
                ]);
            }

            $checkout = $this->paymentService->crearCheckoutSessionParaReserva($reserva, (float)$monto);

            try {
                if ($request->has('cupon_id')) {
                    $incomingMonto = (float) $request->input('monto', $reserva->precio_total);
                    $totalOriginal = (float) $reserva->precio_total;
                    $descuento = max(0, round($totalOriginal - $incomingMonto, 2));

                    $reserva->update([
                        'cupon_id' => $request->input('cupon_id'),
                        'descuento_aplicado' => $descuento,
                        'precio_total' => $incomingMonto,
                    ]);

                    try {
                        $ultimoPago = $reserva->pagos()->whereNotNull('stripe_checkout_session_id')->orderByDesc('created_at')->first();
                        if ($ultimoPago && !empty($ultimoPago->stripe_response['session']['id'] ?? null)) {
                            $sessionId = $ultimoPago->stripe_response['session']['id'];
                        }
                    } catch (\Throwable $e) {
                        Log::warning('No se pudo actualizar session existente tras aplicar cupón: ' . $e->getMessage());
                    }

                    try {
                        CuponAplicado::create([
                            'reserva_id' => $reserva->id,
                            'cupon_id' => $request->input('cupon_id'),
                            'codigo' => Cupon::find($request->input('cupon_id'))->codigo ?? '',
                            'descuento_aplicado' => $descuento,
                            'usuario_email' => $request->input('email') ?? $reserva->reservable?->email ?? null,
                            'ip_address' => $request->ip(),
                        ]);
                        Cupon::find($request->input('cupon_id'))->increment('usos_realizados');
                    } catch (\Throwable $e) {
                        Log::warning('No se pudo registrar CuponAplicado tras checkout: ' . $e->getMessage());
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('Error al persistir cupón tras checkout: ' . $e->getMessage());
            }

            if (!empty($checkout['success']) && !empty($checkout['sessionUrl'])) {
                try {
                    $reserva->loadMissing(['reservable', 'habitaciones.habitacion', 'tarifa', 'tarifas', 'refundRequests']);
                    $reservaFormateada = $this->formatterService->formatearReservaParaEdicion($reserva);
                } catch (\Throwable $__e) {
                    $reservaFormateada = null;
                }

                return response()->json([
                    'success' => true,
                    'sessionUrl' => $checkout['sessionUrl'],
                    'reserva_id' => $reserva->id,
                    'localizador' => $reserva->localizador,
                    'reserva' => $reservaFormateada,
                ]);
            } else {
                return response()->json(['success' => false, 'error' => $checkout['error'] ?? 'Error creating checkout session'], 400);
            }
        } catch (\Exception $e) {
            Log::error('Error en ReservaController::storeConCheckout', ['mensaje' => $e->getMessage(), 'archivo' => $e->getFile(), 'linea' => $e->getLine()]);
            return response()->json(['success' => false, 'error' => 'Error creando reserva o checkout'], 400);
        }
    }

    /**
     * Obtiene habitaciones disponibles para fechas específicas
     * GET /api/habitaciones-disponibles - Endpoint AJAX para calendario
     * Parámetros: check_in, check_out
     * Devuelve: JSON con habitaciones disponibles por tipo
     *
     * @param \Illuminate\Http\Request $request
     * @return \Illuminate\Http\JsonResponse|array<string,mixed>
     */
    public function habitacionesDisponibles(Request $request)
    {
        try {
            $action = app(\App\Actions\Reservas\HabitacionesDisponiblesAction::class);
            $resultado = $action->handle($request->all());

            if (!empty($resultado['error'])) {
                return $this->error($resultado['error'], 400);
            }

            return $this->success(['data' => $resultado['data'] ?? []]);
        } catch (\Exception $e) {
            Log::error('Error en habitacionesDisponibles: ' . $e->getMessage());
            return $this->error('Error al cargar habitaciones disponibles', 500);
        }
    }


    /**
     * Muestra detalle de reserva para edición/visualización
     *
     * @param \App\Models\Reserva $reserva
     * @return \Inertia\Response|array<string,mixed>
     */
    public function show(Reserva $reserva)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        $reserva->load(['reservable', 'habitaciones.habitacion', 'reembolsos', 'tarifa', 'tarifas', 'refundRequests']);

        try {
            try {
                \Illuminate\Support\Facades\Log::debug('ReservaController::show - tarifa check', ['reserva_id' => $reserva->id, 'tarifa_id' => $reserva->tarifa_id, 'tarifa_loaded' => (bool) $reserva->tarifa]);
            } catch (\Throwable $__e) {}

            $reservaData = $this->formatterService->formatearReservaParaEdicion($reserva);

            if (empty($reservaData['tarifa']) && !empty($reserva->tarifa_id)) {
                try {
                    $tarifaModel = \App\Models\Tarifa::withTrashed()->find($reserva->tarifa_id);
                    if ($tarifaModel) {
                        $reservaData['tarifa'] = [
                            'id' => $tarifaModel->id ?? null,
                            'name' => $tarifaModel->nombre ?? ($tarifaModel->name ?? ($tarifaModel->descripcion ?? null)),
                            'price' => $tarifaModel->modificador_precio ?? ($tarifaModel->price ?? null),
                        ];
                        \Illuminate\Support\Facades\Log::info('ReservaController::show - tarifa recovered via withTrashed', ['reserva_id' => $reserva->id, 'tarifa_id' => $tarifaModel->id]);
                    }
                } catch (\Throwable $__e) {
                    \Illuminate\Support\Facades\Log::warning('ReservaController::show - fallo recuperando tarifa withTrashed: ' . $__e->getMessage());
                }
            }
        } catch (\Throwable $e) {
            $reservaData = [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => ($reserva->reembolsos->sum('amount_cents') ?? 0) / 100,
            ];
        }

        return inertia('Reservas/EditReserva', [
            'reserva' => $reservaData,
        ]);
    }

    /**
     * Vista de edición en panel
     *
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\Reserva $reserva
     * @return \Inertia\Response
     */
    public function edit(Request $request, Reserva $reserva)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        $reserva->load(['reservable', 'habitaciones.habitacion.fotos', 'tarifa', 'tarifas', 'refundRequests']);

        [$checkIn, $checkOut] = $this->reservaService->prepararFechasParaEdicion($request->all(), $reserva);

        $reservaData = $this->formatterService->formatearReservaParaEdicion($reserva, $checkIn, $checkOut);
        $habitacionesDisponibles = $this->formatterService->obtenerHabitacionesYPreciosParaEdicion($reserva, $checkIn, $checkOut);

        return inertia('Reservas/EditReserva', [
            'reserva' => $reservaData,
            'habitaciones' => $habitacionesDisponibles
        ]);
    }

    /**
     * Actualiza una reserva en el panel (datos y estado)
     *
     * @param \App\Http\Requests\UpdateReservaRequest $request
     * @param \App\Models\Reserva $reserva
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function update(UpdateReservaRequest $request, Reserva $reserva)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        try {
            Log::info('ReservaController::update called', [
                'user_id' => Auth::id(),
                'reserva_id' => $reserva->id ?? null,
                'raw_input' => $request->all(),
                'route' => $request->path(),
            ]);
        } catch (\Throwable $_) {}

        $validated = $request->validated();

        try {
            try {
                if (!empty($validated['payment_intent_id'])) {
                    Log::info('ReservaController::update - payment_intent_id presente en payload', ['reserva_id' => $reserva->id, 'payment_intent_id' => $validated['payment_intent_id'], 'pago_monto' => $validated['pago_monto'] ?? null, 'user_id' => Auth::id()]);
                }
            } catch (\Throwable $e) { Log::warning('ReservaController::update - fallo logging payment_intent_id: ' . $e->getMessage()); }

            $originalStatus = $reserva->status;
            $motivo = $request->input('motivo') ?? null;

            $meta = null;
            if ($originalStatus !== 'cancelado' && (($validated['status'] ?? '') === 'cancelado')) {
                $meta = ['motivo' => $motivo, 'type' => 'cancelado'];
            }

            $result = DB::transaction(function () use ($validated, $reserva, $meta) {
                return $this->reservaService->actualizarReserva($reserva, $validated, $meta);
            });

            $reserva->refresh();

            $msg = "Reserva {$reserva->localizador} actualizada correctamente.";
            if (!empty($result['refund']) && !empty($result['refund']['amount'])) {
                $msg .= " Se ha solicitado un reembolso parcial de €" . number_format($result['refund']['amount'], 2) . ".";
            }

            $reserva->refresh();

            try {
                $reserva->loadMissing(['reservable', 'habitaciones.habitacion', 'bookedBy', 'tarifas', 'pagos', 'reembolsos']);
            } catch (\Throwable $__e) {

            }

            try {
                $reservaFormateada = $this->formatterService->formatearReservaParaEdicion($reserva, Carbon::parse($reserva->check_in), Carbon::parse($reserva->check_out));
                try {
                    Log::info('ReservaController::update - returning formatted reserva', ['reserva_formateada' => $reservaFormateada, 'reserva_id' => $reserva->id]);
                } catch (\Throwable $__log_e) {}
            } catch (\Throwable $e) {
                $reservaFormateada = ['id' => $reserva->id, 'precio_total' => $reserva->precio_total ?? null, 'check_in' => $reserva->check_in ?? null, 'check_out' => $reserva->check_out ?? null];
            }

            // Devolver siempre JSON para simplificar el flujo AJAX y evitar redirecciones
            return response()->json([
                'success' => true,
                'message' => $msg,
                'refund' => $result['refund'] ?? null,
                'payment' => $result['payment'] ?? null,
                'reserva' => $reservaFormateada,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en ReservaController::update', [
                'mensaje' => $e->getMessage(),
                'class' => \get_class($e),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'stack' => $e->getTraceAsString(),
                'reserva_id' => $reserva->id ?? null,
                'user_id' => Auth::id(),
                'payload' => $request->all(),
            ]);

            $msg = $e->getMessage();
            return response()->json(['success' => false, 'error' => $msg], 400);
        }
    }

    /**
     * Elimina una reserva (panel)
     *
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\Reserva $reserva
     * @return \Illuminate\Http\RedirectResponse|\Illuminate\Http\JsonResponse
     */
    public function destroy(Request $request, Reserva $reserva)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        $this->authorize('delete', $reserva);

        try {
            $motivo = $request->input('motivo') ?? null;

            if (in_array(strtolower($reserva->status), ['checked_in', 'checked_out'], true)) {
                return back()->withErrors(['error' => 'No se puede eliminar una reserva en estado "checked_in" o "checked_out".']);
            }

            $reserva->loadMissing(['reservable', 'habitaciones.habitacion']);
            $this->reservaService->eliminarReserva($reserva);

            return redirect()->back()->with('success', 'Reserva eliminada con éxito');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar la reserva: ' . $e->getMessage()]);
        }
    }

    /**
     * Asigna habitaciones a una reserva
     *
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\Reserva $reserva
     * @return array<string,mixed>|\Illuminate\Http\JsonResponse
     */
    public function asignarHabitaciones(Request $request, Reserva $reserva)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();

        $user = Auth::user();
        if (! $user) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'No autenticado'], 401);
            }
            abort(403, 'Acceso denegado');
        }
        $roles = [];
        if ($user) {
            if (method_exists($user, 'getRoleNames')) {
                try {
                    $roles = $user->getRoleNames()->toArray();
                } catch (\Throwable $__e) {
                    $roles = [];
                }
            } elseif (isset($user->roles) && is_iterable($user->roles)) {
                try {
                    if ($user->roles instanceof \Illuminate\Support\Collection) {
                        $roles = $user->roles->map(fn($r) => $r->name ?? (string) $r)->filter()->values()->toArray();
                    } elseif (is_array($user->roles)) {
                        $roles = array_values($user->roles);
                    }
                } catch (\Throwable $__e) {
                    $roles = [];
                }
            }
        }
        $isAdmin = in_array('admin', $roles) || in_array('super-admin', $roles) || ($user->is_admin ?? false);
        $dept = strtolower($user->empleado?->departamento?->name ?? '');
        $hasEncOrOper = in_array('encargado', $roles) || in_array('operario', $roles);
        if (!($isAdmin || ($dept === 'recepcion' && $hasEncOrOper))) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Acceso denegado'], 403);
            }
            abort(403, 'Acceso denegado');
        }
        $request->validate([
            'habitacion_ids' => 'required|array|min:1',
            'habitacion_ids.*' => 'nullable|integer|exists:habitaciones,id'
        ]);

        $isJson = $request->expectsJson() || $request->header('Accept') === 'application/json';

        try {
            $result = $this->reservaService->asignarHabitacionManual($reserva, $request->habitacion_ids);

            $reserva->refresh();
            $reserva->load(['habitaciones.habitacion', 'reservable']);

            try {
                $reservaFormateada = $this->formatterService->formatearReservaParaEdicion($reserva);
            } catch (\Exception $formatError) {
                if ($isJson) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Error al formatear la respuesta: ' . $formatError->getMessage()
                    ], 422);
                }
                throw $formatError;
            }

            if ($isJson) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result,
                    'reserva' => $reservaFormateada
                ]);
            }

            return redirect()->back()->with('success', $result['message']);
        } catch (\Exception $e) {
            if ($isJson) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Desasigna habitaciones de una reserva
     *
     * @param \Illuminate\Http\Request $request
     * @param \App\Models\Reserva $reserva
     * @return array<string,mixed>|\Illuminate\Http\JsonResponse
     */
    public function desasignarHabitaciones(Request $request, Reserva $reserva)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();

        $user = Auth::user();
        if (! $user) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'No autenticado'], 401);
            }
            abort(403, 'Acceso denegado');
        }
        $roles = [];
        if ($user) {
            if (method_exists($user, 'getRoleNames')) {
                try {
                    $roles = $user->getRoleNames()->toArray();
                } catch (\Throwable $__e) {
                    $roles = [];
                }
            } elseif (isset($user->roles) && is_iterable($user->roles)) {
                try {
                    if ($user->roles instanceof \Illuminate\Support\Collection) {
                        $roles = $user->roles->map(fn($r) => $r->name ?? (string) $r)->filter()->values()->toArray();
                    } elseif (is_array($user->roles)) {
                        $roles = array_values($user->roles);
                    }
                } catch (\Throwable $__e) {
                    $roles = [];
                }
            }
        }
        $isAdmin = in_array('admin', $roles) || in_array('super-admin', $roles) || ($user->is_admin ?? false);
        $dept = strtolower($user->empleado?->departamento?->name ?? '');
        $hasEncOrOper = in_array('encargado', $roles) || in_array('operario', $roles);
        if (!($isAdmin || ($dept === 'recepcion' && $hasEncOrOper))) {
            if ($request->expectsJson()) {
                return response()->json(['success' => false, 'message' => 'Acceso denegado'], 403);
            }
            abort(403, 'Acceso denegado');
        }
        $request->validate([
            'habitacion_ids' => 'required|array|min:1',
            'habitacion_ids.*' => 'required|integer|exists:habitaciones,id'
        ]);

        $isJson = $request->expectsJson() || $request->header('Accept') === 'application/json';

        try {
            $result = $this->reservaService->desasignarHabitaciones($reserva, $request->habitacion_ids);
            $reserva->refresh();
            $reserva->load(['habitaciones.habitacion', 'reservable']);

            try {
                $reservaFormateada = $this->formatterService->formatearReservaParaEdicion($reserva);
            } catch (\Exception $formatError) {
                if ($isJson) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Error al formatear la respuesta: ' . $formatError->getMessage()
                    ], 422);
                }
                throw $formatError;
            }

            if ($isJson) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result,
                    'reserva' => $reservaFormateada
                ]);
            }

            return redirect()->back()->with('success', $result['message']);
        } catch (\Exception $e) {
            if ($isJson) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Calcula precio para un conjunto de habitaciones y fechas
     *
     * @param \App\Http\Requests\CalcularPrecioRequest $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function calcularPrecio(\App\Http\Requests\CalcularPrecioRequest $request)
    {
        try {
            \Illuminate\Support\Facades\Log::info('calcularPrecio - incoming request', ['method' => request()->method(), 'payload' => $request->all(), 'headers' => [
                'x-requested-with' => $request->header('X-Requested-With'),
                'content-type' => $request->header('Content-Type'),
                'accept' => $request->header('Accept'),
            ]]);
            $action = app(\App\Actions\Reservas\CalcularPrecioAction::class);
            $resultado = $action->handle($request->validated());

            if (isset($resultado['error'])) {
                return $this->error($resultado['error'], 422);
            }

            return $this->success(['data' => $resultado], 200);
        } catch (\Exception $e) {
            Log::error('Error en calcularPrecio', ['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()]);
            return $this->error('Error al calcular precio: ' . $e->getMessage(), 500);
        }
    }


    /**
     * Busca una reserva por localizador
     * @param string $localizador
     * @return \Illuminate\Http\JsonResponse
     */
    public function buscarPorLocalizador(string $localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\BuscarPorLocalizadorAction::class);
            $resultado = $action->handle($localizador);

            if (!($resultado['success'] ?? false)) {
                return $this->error($resultado['error'] ?? 'Reserva no encontrada', 404);
            }

            return $this->success($resultado);
        } catch (\Exception $e) {
            return $this->error('Error al buscar reserva: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Lista estados disponibles y filtros para reservas
     *
     * @param \Illuminate\Http\Request $request
     * @return array<string,mixed>
     */
    public function estados(\Illuminate\Http\Request $request)
    {
        $localizadores = $request->query('localizadores');
        if (! $localizadores) {
            return response()->json(['success' => false, 'error' => 'Falta parámetro localizadores'], 400);
        }

        $keys = array_filter(array_map('trim', explode(',', $localizadores)));
        $reservas = \App\Models\Reserva::whereIn('localizador', $keys)->get(['localizador', 'pago']);

        $data = [];
        foreach ($reservas as $r) {
            $data[$r->localizador] = $r->pago;
        }

        return response()->json(['success' => true, 'data' => $data]);
    }

    /* Descarga un comprobante de reserva en PDF */
    /** @param string $localizador @return \Symfony\Component\HttpFoundation\BinaryFileResponse */
    /**
     * Descarga comprobante (PDF) de reserva
     *
     * @param string $localizador
     * @return \Symfony\Component\HttpFoundation\StreamedResponse|\Illuminate\Http\Response
     */
    public function descargarComprobante(string $localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\DescargarComprobanteAction::class);
            $pdf = $action->handle($localizador);
            return $pdf->download("Comprobante_{$localizador}.pdf");
        } catch (\Exception $e) {
            return $this->error('No se encontró la reserva o error al generar PDF: ' . $e->getMessage(), 404);
        }
    }

    /**
     * Devuelve precios por día para un periodo solicitado
     *
     * @param \Illuminate\Http\Request $request
     * @return array<string,mixed>|\Illuminate\Http\JsonResponse
     */
    public function preciosPorDia(Request $request)
    {
        try {
            $params = $request->query();
            $action = app(\App\Actions\Reservas\PreciosPorDiaAction::class);
            $resultado = $action->handle($params);

            if (!($resultado['success'] ?? false)) {
                return $this->error($resultado['error'] ?? 'Error calculando precios', 400);
            }

            return $this->success($resultado);
        } catch (\Exception $e) {
            Log::error('Error en preciosPorDia: ' . $e->getMessage());
            return $this->error('Error calculando precios', 500);
        }
    }

    /* Devuelve precios para un mes concreto */
    /** @param int|string $yyyy @param int|string $mm @return \Illuminate\Http\JsonResponse */
    /**
     * Devuelve precios agregados por mes
     *
     * @param int|string $yyyy
     * @param int|string $mm
     * @return array<string,mixed>
     */
    public function preciosMes(int|string $yyyy, int|string $mm)
    {
        try {
            $action = app(\App\Actions\Reservas\PreciosMesAction::class);
            $resultado = $action->handle((int)$yyyy, (int)$mm);

            if (!($resultado['success'] ?? false)) {
                return $this->error($resultado['error'] ?? 'Error calculando precios por mes', 400);
            }

            return $this->success($resultado);
        } catch (\Exception $e) {
            Log::error('Error en preciosMes: ' . $e->getMessage());
            return $this->error('Error calculando precios por mes', 500);
        }
    }

    /**
     * Realiza check-in de una reserva
     * POST /reservas/{localizador}/check-in - Procesa check-in desde panel
    * Asigna habitaciones físicas y cambia estado a checked_in
     * Devuelve: JSON con resultado del check-in
     * @param \Illuminate\Http\Request $request
     * @param string $localizador
     * @return \Illuminate\Http\JsonResponse
     */
    public function marcarCheckIn(Request $request, string $localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\MarcarCheckInAction::class);
            $resultado = $action->handle($localizador);

            if (!($resultado['success'] ?? false)) {
                return $this->error($resultado['message'] ?? 'No se pudo marcar check-in', 409);
            }

            return $this->success($resultado);
        } catch (\Exception $e) {
            Log::error('Error en marcarCheckIn: ' . $e->getMessage());
            return $this->error('No se pudo marcar check-in: ' . $e->getMessage(), 400);
        }
    }

}
