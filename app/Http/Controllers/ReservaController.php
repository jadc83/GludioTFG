<?php

namespace App\Http\Controllers;

use App\Events\ReservaActualizada;
use App\Http\Requests\StoreReservaRequest;
use App\Http\Requests\UpdateReservaRequest;
use App\Models\Reserva;
use App\Services\ReservaService;
use App\Services\HabitacionService;
use App\Services\PrecioService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\ReservaCompletada;
use App\Models\Pago;

class ReservaController extends Controller
{
    protected ReservaService $reservaService;
    protected PrecioService $precioService;
    protected HabitacionService $habitacionService;

    /**
     * Constructor del controlador de reservas
     * Inyecta servicios necesarios para gestión de reservas
     * Servicios: ReservaService, PrecioService, HabitacionService
     */
    public function __construct(ReservaService $reservaService, PrecioService $precioService, HabitacionService $habitacionService)
    {
        $this->reservaService = $reservaService;
        $this->precioService = $precioService;
        $this->habitacionService = $habitacionService;
    }

    /**
     * Envía email de reserva usando clase mailable
     * Maneja envío con email alternativo si falla el principal
     * Usado por: store(), marcarCheckIn(), marcarCheckOut()
     */
    private function sendReservationMail($reserva, $mailable, $fallbackEmail = null)
    {
        try {
            $destino = $reserva->reservable?->email ?? $fallbackEmail;
            if ($destino) {
                Mail::to($destino)->send($mailable);
            }
        } catch (\Throwable $e) {
            Log::warning('No se pudo enviar email de reserva: ' . $e->getMessage());
        }
    }

    /**
     * Respuesta JSON exitosa estandarizada
     * Usado por: múltiples métodos para respuestas consistentes
     */
    private function jsonOk(array $data = [], int $status = 200)
    {
        return response()->json(array_merge(['success' => true], $data), $status);
    }

    /**
     * Respuesta JSON de error estandarizada
     * Usado por: múltiples métodos para respuestas de error consistentes
     */
    private function jsonError(string $message, int $status = 400)
    {
        return response()->json(['success' => false, 'error' => $message], $status);
    }

    /**
     * Lista reservas con filtros y paginación
     * GET /reservas - Panel de administración de reservas
     * Filtros: status, localizador, cliente, habitación
     * Retorna: vista con reservas paginadas
     */
    public function index(Request $request)
    {
        $reservas = Reserva::withReservable()
            ->with(['habitaciones.habitacion', 'bookedBy'])
            ->status($request->status)
            ->localizador($request->localizador)
            ->cliente($request->cliente)
            ->habitacion($request->habitacion)
            ->orderBy('check_in', 'desc')
            ->get();

        $reservasJson = $this->reservaService->formatearReservas($reservas);

        if ($request->wantsJson()) {
            return response()->json($reservasJson);
        }

        return ['reservas' => $reservasJson];
    }

    /**
     * Muestra formulario de creación de reserva
     * GET /reservas/create
     * Retorna: vista del formulario de reserva
     */
    public function create()
    {
        //
    }

    /**
     * Crea nueva reserva desde formulario
     * POST /reservas - Procesa datos del formulario de reserva
     * Valida datos, crea reserva y envía email de confirmación
     * Retorna: redirección con mensaje de éxito
     */
    public function store(StoreReservaRequest $request)
    {

        try {
            $action = app(\App\Actions\Reservas\CreateReservaAction::class);
            $result = $action->handle($request->all(), Auth::user(), $request->status ?? 'pendiente');

            $respuesta = [
                'success' => true,
                'localizador' => $result['localizador'] ?? null,
                'reserva_id' => $result['reserva_id'] ?? null,
                'message' => isset($result['reserva']) ? "Reserva {$result['reserva']->localizador} creada (Total: €{$result['reserva']->precio_total})" : 'Reserva creada',
            ];

            if ($request->wantsJson()) {
                return response()->json($respuesta);
            }

            return redirect()->back()
                ->with('success', $respuesta['message'])
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

            $mensajeAmigable = \App\Helpers\ErrorHelper::obtenerMensajeAmigable($e);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => $mensajeAmigable], 400);
            }

            return back()->withErrors(['error' => $mensajeAmigable]);
        }
    }

    /**
     * Obtiene habitaciones disponibles para fechas específicas
     * GET /api/habitaciones-disponibles - Endpoint AJAX para calendario
     * Parámetros: check_in, check_out
     * Retorna: JSON con habitaciones disponibles por tipo
     */
    public function habitacionesDisponibles(Request $request)
    {
        try {
            $action = app(\App\Actions\Reservas\HabitacionesDisponiblesAction::class);
            $resultado = $action->handle($request->all());
            if (!empty($resultado['error'])) {
                return response()->json(['error' => $resultado['error']], 400);
            }
            return response()->json($resultado['data'] ?? []);
        } catch (\Exception $e) {
            Log::error('Error en habitacionesDisponibles: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cargar habitaciones'], 400);
        }
    }


    public function show(Reserva $reserva)
    {
        $reserva->load(['reservable', 'habitaciones.habitacion', 'reembolsos']);
        // Preparar lista de reembolsos con tipo (parcial/completo) para la vista
        // Calcular tipo de cada reembolso
        $reservaTotal = $reserva->precio_total ?? 0;
        $cumulative = 0;
        $reembolsosList = $reserva->reembolsos->sortBy('created_at')->values()->map(function ($r) use ($reserva, &$cumulative, $reservaTotal) {
            $amount = ($r->amount_cents ?? 0) / 100;
            $cumulative += $amount;
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
        })->values();

        return inertia('Reservas/DetalleReserva', [
            'reserva' => [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'cliente' => $this->reservaService->formatearCliente($reserva),
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => ($reserva->reembolsos->sum('amount_cents') ?? 0) / 100,
                'reembolsos' => $reembolsosList,
                'habitaciones' => $reserva->habitaciones->map(function ($hr) {
                    return [
                        'id' => $hr->id,
                        'numero' => $hr->habitacion?->numero ?? null,
                        'tipo' => $hr->tipo ?? $hr->habitacion?->tipo ?? null,
                        'precio' => $hr->precio,
                    ];
                })->values()
            ]]);
    }

    public function edit(Request $request, Reserva $reserva)
    {
        $reserva->load(['reservable', 'habitaciones.habitacion.fotos']);

        [$checkIn, $checkOut] = $this->reservaService->prepararFechasParaEdicion($request->all(), $reserva);

        $reservaData = $this->reservaService->formatearReservaParaEdicion($reserva, $checkIn, $checkOut);
        $habitacionesDisponibles = $this->reservaService->obtenerHabitacionesYPreciosParaEdicion($reserva, $checkIn, $checkOut);

        return inertia('Reservas/editarReserva', [
            'reserva' => $reservaData,
            'habitaciones' => $habitacionesDisponibles
        ]);
}

    public function update(UpdateReservaRequest $request, Reserva $reserva)
    {
        $validated = $request->validated();

        try {
            // Detectar cambio de estado a 'cancelado' para enviar correo
            $originalStatus = $reserva->status;
            $motivo = $request->input('motivo') ?? null;

            $meta = null;
            if ($originalStatus !== 'cancelado' && (($validated['status'] ?? '') === 'cancelado')) {
                $meta = ['motivo' => $motivo, 'type' => 'cancelado'];
            }

            $result = DB::transaction(function () use ($validated, $reserva, $meta) {
                return $this->reservaService->actualizarReserva($reserva, $validated, $meta);
            });

            // Refrescar la instancia para obtener los cambios
            $reserva->refresh();

            $msg = "Reserva {$reserva->localizador} actualizada correctamente.";
            if (!empty($result['refund']) && !empty($result['refund']['amount'])) {
                $msg .= " Se ha solicitado un reembolso parcial de €" . number_format($result['refund']['amount'], 2) . ".";
            }

            // Si la petición espera JSON, devolver información estructurada (incluyendo refund si existe)
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $msg,
                    'refund' => $result['refund'] ?? null,
                    'payment' => $result['payment'] ?? null,
                ]);
            }

            $redirect = redirect()->route('panel')->with('success', $msg);
            if (!empty($result['refund'])) {
                $redirect = $redirect->with('refund_info', $result['refund']);
            }
            if (!empty($result['payment'])) {
                $redirect = $redirect->with('payment_info', $result['payment']);
            }

            return $redirect;
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Request $request, Reserva $reserva)
    {
        try {
            // Leer motivo opcional enviado desde frontend
            $motivo = $request->input('motivo') ?? null;

            // Cargar relaciones necesarias antes de borrar (evita lazy-loading en el listener)
            $reserva->loadMissing(['reservable', 'habitaciones.habitacion']);

            // Ahora borrar la reserva (el método `eliminarReserva` dispara el evento `ReservaBorrada` que se encargará del email en background)
            $this->reservaService->eliminarReserva($reserva);

            return redirect()->back()->with('success', 'Reserva eliminada con éxito');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar la reserva: ' . $e->getMessage()]);
        }
    }

    /**
     * Asigna habitaciones específicas manualmente a una reserva existente
     * Usado para edición manual desde panel de control
     */
    public function asignarHabitaciones(Request $request, Reserva $reserva)
    {
        $request->validate([
            'habitacion_ids' => 'required|array|min:1',
            'habitacion_ids.*' => 'required|integer|exists:habitaciones,id'
        ]);

        try {
            $result = $this->reservaService->asignarHabitacionManual($reserva, $request->habitacion_ids);

            // Refrescar la instancia para obtener los cambios
            $reserva->refresh();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result
                ]);
            }

            return redirect()->back()->with('success', $result['message']);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /**
     * Desasigna habitaciones específicas de una reserva existente
     * Usado para quitar asignaciones manuales desde panel de control
     */
    public function desasignarHabitaciones(Request $request, Reserva $reserva)
    {
        $request->validate([
            'habitacion_ids' => 'required|array|min:1',
            'habitacion_ids.*' => 'required|integer|exists:habitaciones,id'
        ]);

        try {
            $result = $this->reservaService->desasignarHabitaciones($reserva, $request->habitacion_ids);

            // Refrescar la instancia para obtener los cambios
            $reserva->refresh();

            if ($request->wantsJson()) {
                return response()->json([
                    'success' => true,
                    'message' => $result['message'],
                    'data' => $result
                ]);
            }

            return redirect()->back()->with('success', $result['message']);
        } catch (\Exception $e) {
            if ($request->wantsJson()) {
                return response()->json([
                    'success' => false,
                    'error' => $e->getMessage()
                ], 422);
            }

            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    /* Calcula el precio dinámico para una reserva */
    public function calcularPrecio(\App\Http\Requests\CalcularPrecioRequest $request)
    {
        try {
            $action = app(\App\Actions\Reservas\CalcularPrecioAction::class);
            $resultado = $action->handle($request->validated());

            if (isset($resultado['error'])) {
                return response()->json([ 'success' => false, 'error' => $resultado['error']], 422);
            }

            return response()->json([ 'success' => true, 'data' => $resultado ]);
        } catch (\Exception $e) {
            Log::error('Error en calcularPrecio', [ 'error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine() ]);
            return response()->json([  'success' => false, 'error' => 'Error al calcular precio: ' . $e->getMessage() ], 500);
        }
    }


    /**
     * Busca una reserva por localizador
     */
    public function buscarPorLocalizador($localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\BuscarPorLocalizadorAction::class);
            $resultado = $action->handle($localizador);
            if (! ($resultado['success'] ?? false)) {
                return response()->json($resultado, 404);
            }
            return response()->json($resultado);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al buscar reserva: ' . $e->getMessage(),
                ], 500);
        }
    }

    /* Descarga un comprobante de reserva en PDF */
    public function descargarComprobante($localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\DescargarComprobanteAction::class);
            $pdf = $action->handle($localizador);
            return $pdf->download("Comprobante_{$localizador}.pdf");
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'No se encontró la reserva o error al generar PDF: ' . $e->getMessage(),
                ], 404);
        }
    }

    /* Obtiene información sobre si una reserva puede extenderse */
    public function infoExtension($localizador)
    {
        try {
            $reserva = Reserva::where('localizador', $localizador)->firstOrFail();
            $reservaService = new ReservaService();
            $info = $reservaService->obtenerInfoExtension($reserva);
            return response()->json(array_merge(['success' => true], is_array($info) ? $info : []));

            } catch (\Exception $e) {
            return response()->json([ 'success' => false, 'error' => $e->getMessage()], 404);
            }
    }

    /* Extiende una reserva con nuevos días adicionales */
    public function extenderReserva(Request $request, $localizador)
    {
        try {
            $numeroDias = (int) $request->input('numero_dias');
            $confirmar = (bool) $request->input('confirmar');

            $action = app(\App\Actions\Reservas\ExtenderReservaAction::class);
            $resultado = $action->handle($localizador, $numeroDias, $confirmar);

            return response()->json($resultado);
        } catch (\Exception $e) {
            return response()->json([ 'success' => false, 'error' => 'Error al extender la reserva: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Modifica las fechas de la estancia (ampliar o reducir) tras comprobar disponibilidad.
     * Espera `check_in` y `check_out` en formato Y-m-d.
     */
    public function modificarEstancia(\App\Http\Requests\ModificarEstanciaRequest $request, $localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\ModificarEstanciaAction::class);
            $resultado = $action->handle($localizador, $request->validated());
            if (isset($resultado['error'])) {
                return response()->json($resultado, 402);
            }
            if (isset($resultado['success']) && $resultado['success'] === false) {
                return response()->json($resultado, 400);
            }

            return response()->json($resultado);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([ 'success' => false, 'message' => 'Reserva no encontrada.' ], 404);
        } catch (\Exception $e) {
            Log::error('Error en modificarEstancia: ' . $e->getMessage());
            return response()->json([ 'success' => false, 'message' => 'Error al modificar la estancia: ' . $e->getMessage() ], 500);
        }
    }

    /**
     * Preview de modificación de estancia: comprueba disponibilidad y estima precio/ajuste.
     * Retorna: available (bool), nuevo_total, viejo_total, nights_old, nights_new, estimate_refund, estimate_charge
     */
    public function previewModificarEstancia(\App\Http\Requests\ModificarEstanciaRequest $request, $localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\PreviewModificarEstanciaAction::class);
            $resultado = $action->handle($localizador, $request->validated());
            return response()->json($resultado);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([ 'success' => false, 'message' => 'Reserva no encontrada.' ], 404);
        } catch (\Exception $e) {
            Log::error('Error en previewModificarEstancia: ' . $e->getMessage());
            return response()->json([ 'success' => false, 'message' => 'Error en preview: ' . $e->getMessage() ], 500);
        }
    }

    /**
     * Obtiene precios y ocupación por día para calendario
     * GET /reservas/precios-por-dia - Endpoint para componente calendario
     * Parámetros: inicio, fin (fechas en formato YYYY-MM-DD)
     * Retorna: JSON con precios y ocupación diaria
     */
    public function preciosPorDia(Request $request)
    {
        try {
            $params = $request->query();
            $action = app(\App\Actions\Reservas\PreciosPorDiaAction::class);
            $resultado = $action->handle($params);
            if (!($resultado['success'] ?? false)) {
                return response()->json($resultado, 400);
            }
            return response()->json($resultado);
        } catch (\Exception $e) {
            Log::error('Error en preciosPorDia: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error calculando precios'], 500);
        }
    }

    /* Devuelve precios para un mes concreto */
    public function preciosMes($yyyy, $mm)
    {
        try {
            $action = app(\App\Actions\Reservas\PreciosMesAction::class);
            $resultado = $action->handle((int)$yyyy, (int)$mm);
            if (!($resultado['success'] ?? false)) {
                return response()->json($resultado, 400);
            }
            return response()->json($resultado);
        } catch (\Exception $e) {
            Log::error('Error en preciosMes: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error calculando precios por mes'], 500);
        }
    }

    /**
     * Marca una reserva como check-in (se usa desde el escáner)
     */
    /**
     * Realiza check-in de una reserva
     * POST /reservas/{localizador}/check-in - Procesa check-in desde panel
     * Asigna habitaciones físicas y cambia estado a checked_in
     * Retorna: JSON con resultado del check-in
     */
    public function marcarCheckIn(Request $request, $localizador)
    {
        try {
            $action = app(\App\Actions\Reservas\MarcarCheckInAction::class);
            $resultado = $action->handle($localizador);
            $statusCode = ($resultado['success'] ?? false) ? 200 : 409;
            return response()->json($resultado, $statusCode);
        } catch (\Exception $e) {
            Log::error('Error en marcarCheckIn: ' . $e->getMessage());
            return $this->jsonError('No se pudo marcar check-in: ' . $e->getMessage(), 400);
        }
    }

}
