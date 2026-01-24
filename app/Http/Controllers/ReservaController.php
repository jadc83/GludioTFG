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

class ReservaController extends Controller
{
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

        $reservaService = new ReservaService();
        $reservasJson = $reservaService->formatearReservas($reservas);

        if ($request->wantsJson()) {
            return response()->json($reservasJson);
        }

        return ['reservas' => $reservasJson];
    }

    public function create()
    {
        //
    }

    public function store(StoreReservaRequest $request)
    {
        $reservaService = new ReservaService();

        Log::info('Crear Reserva - Datos recibidos:', $request->all());

        try {
            $usuario = Auth::user();
            $reserva = $reservaService->crearReserva($request->all(), $usuario, $request->status ?? 'pendiente');
            $reserva->load(['reservable', 'habitaciones.habitacion']);

            try {
                $destino = $reserva->reservable?->email ?? $request->input('email');
                if ($destino) {
                    Mail::to($destino)->send(new ReservaCompletada($reserva));
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo enviar email de reserva creada: ' . $e->getMessage());
            }

            $respuesta = [ 'success' => true,  'localizador' => $reserva->localizador, 'reserva_id' => $reserva->id,
                'message' => "Reserva {$reserva->localizador} creada (Total: €{$reserva->precio_total})",
            ];

            if ($request->wantsJson()) {
                return response()->json($respuesta);
            }

            return redirect()->back()
                ->with('success', $respuesta['message'])
                ->with('reserva_id', $reserva->id)
                ->with('localizador', $reserva->localizador);

        } catch (\Exception $e) {
            Log::error('Error en ReservaController::store', [
                'mensaje' => $e->getMessage(),
                'archivo' => $e->getFile(),
                'linea' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
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

    public function habitacionesDisponibles(Request $request)
    {
        $habitacionService = new HabitacionService();

        try {
            $entrada = Carbon::parse($request->check_in);
            $salida = Carbon::parse($request->check_out);

            if (!$entrada || !$salida) {
                return response()->json(['error' => 'Fechas inválidas'], 400);
            }

            $disponibles = $habitacionService->obtenerDisponibles($entrada, $salida);

            if (empty($disponibles)) {
                return response()->json([]);
            }

            return response()->json($disponibles);

        } catch (\Exception $e) {
            Log::error('Error en habitacionesDisponibles: ' . $e->getMessage());
            return response()->json(['error' => 'Error al cargar habitaciones'], 400);
        }
    }


    public function show(Reserva $reserva)
    {
        $reserva->load(['reservable', 'habitaciones.habitacion']);
        $reservaService = new ReservaService();

        return inertia('Reservas/DetalleReserva', [
            'reserva' => [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'cliente' => $reservaService->formatearCliente($reserva),
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'habitaciones' => $reserva->habitaciones->map(function ($hr) {
                    return [ 'numero' => $hr->habitacion->numero, 'tipo' => $hr->habitacion->tipo, 'precio' => $hr->precio ]; }) ]]);
    }

    public function edit(Request $request, Reserva $reserva)
    {
        $reserva->load(['reservable', 'habitaciones.habitacion.fotos']);

        $reservaService = new ReservaService();
        [$checkIn, $checkOut] = $reservaService->prepararFechasParaEdicion($request->all(), $reserva);

        $reservaData = $reservaService->formatearReservaParaEdicion($reserva, $checkIn, $checkOut);
        $habitacionesDisponibles = $reservaService->obtenerHabitacionesYPreciosParaEdicion($reserva, $checkIn, $checkOut);

        return inertia('Reservas/EditReserva', [
            'reserva' => $reservaData,
            'habitaciones' => $habitacionesDisponibles
        ]);
}

    public function update(UpdateReservaRequest $request, Reserva $reserva)
    {
        $validated = $request->validated();

        try {
            $reservaService = new ReservaService();

            DB::transaction(function () use ($reservaService, $validated, $reserva) {
                $reservaService->actualizarReserva($reserva, $validated);
            });
            // La emisión del evento ReservaActualizada ahora la maneja ReservaService

            return redirect()->route('panel')->with('success', "Reserva {$reserva->localizador} actualizada correctamente.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Reserva $reserva)
    {
        try {
            $reservaService = new ReservaService();
            $reservaService->eliminarReserva($reserva);

            return redirect()->back()->with('success', 'Reserva eliminada con éxito');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar la reserva: ' . $e->getMessage()]);
        }
    }

    /* Calcula el precio dinámico para una reserva */
    public function calcularPrecio(Request $request)
    {
        $validated = $request->validate([
            'check_in' => 'required|date_format:Y-m-d',
            'check_out' => 'required|date_format:Y-m-d|after:check_in',
            'habitaciones' => 'required|array|min:1',
            'habitaciones.*.tipo' => 'required|string|in:doble,familiar,suite',
            'habitaciones.*.cantidad' => 'required|integer|min:1',
            ]);

            try {
                $precioService = new \App\Services\PrecioService();
            $checkIn = Carbon::createFromFormat('Y-m-d', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('Y-m-d', $validated['check_out']);

            $resultado = $precioService->calcularMontoTotal( $validated['habitaciones'], $checkIn, $checkOut);

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
            $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
                ->where('localizador', $localizador)
                ->first();

            if (!$reserva) {
                return response()->json([
                    'success' => false,
                    'error' => 'No se encontró reserva con ese localizador',
                ], 404);
            }

            $reservaService = new ReservaService();

            return response()->json([
                'success' => true,
                'reserva' => [
                    'id' => $reserva->id,
                    'localizador' => $reserva->localizador,
                    'cliente' => $reservaService->formatearCliente($reserva),
                    'check_in' => $reserva->check_in,
                    'check_out' => $reserva->check_out,
                    'precio_total' => $reserva->precio_total,
                    'status' => $reserva->status,
                    'pago' => $reserva->pago,
                    'habitaciones' => $reserva->habitaciones->map(function ($hr) {
                        return [
                            'numero' => $hr->habitacion->numero,
                            'tipo' => $hr->habitacion->tipo,
                            'precio' => $hr->precio,
                        ];
                    }),
                ]
            ]);
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
            $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
                ->where('localizador', $localizador)
                ->firstOrFail();
            $reservaService = new ReservaService();

            $pdf = $reservaService->generarComprobantePdf($reserva);
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
            return response()->json([ 'success' => true, ...$info ]);

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

            $reservaService = new ReservaService();
            $resultado = $reservaService->extenderReserva($localizador, $numeroDias, $confirmar);

            return response()->json($resultado);
        } catch (\Exception $e) {
            return response()->json([ 'success' => false, 'error' => 'Error al extender la reserva: ' . $e->getMessage()], 500);
        }
    }

    public function preciosPorDia(Request $request)
    {
        try {
            $inicio = $request->query('inicio');
            $fin = $request->query('fin');
            $fechaInicio = $inicio ? Carbon::createFromFormat('Y-m-d', $inicio) : Carbon::today();
            $fechaFin = $fin ? Carbon::createFromFormat('Y-m-d', $fin) : Carbon::today()->addDays(90);

            if ($fechaFin->lt($fechaInicio)) {
                return response()->json(['success' => false, 'error' => 'Rango de fechas inválido'], 400);
            }

            $precioService = new PrecioService();
            $resultados = $precioService->preciosPorRango($fechaInicio, $fechaFin);

            return response()->json(['success' => true, 'data' => $resultados]);
        } catch (\Exception $e) {
            Log::error('Error en preciosPorDia: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error calculando precios'], 500);
        }
    }

    /* Devuelve precios para un mes concreto */
    public function preciosMes($yyyy, $mm)
    {
        try {
            $anio = (int) $yyyy;
            $mes = (int) $mm;

            if (!checkdate($mes, 1, $anio)) {
                return response()->json(['success' => false, 'error' => 'Fecha inválida'], 400);
            }

            $precioService = new PrecioService();
            $resultados = $precioService->preciosMes($anio, $mes);

            return response()->json(['success' => true, 'data' => $resultados]);
        } catch (\Exception $e) {
            Log::error('Error en preciosMes: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Error calculando precios por mes'], 500);
        }
    }

    /**
     * Marca una reserva como check-in (se usa desde el escáner)
     */
    public function marcarCheckIn(Request $request, $localizador)
    {
        try {
            $reserva = Reserva::where('localizador', $localizador)->firstOrFail();

            // Actualizar estado a 'checked_in'
            $reserva->status = 'checked_in';
            $reserva->save();

            try { event(new ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

            return response()->json([ 'success' => true, 'message' => 'Check-in realizado', 'reserva' => [ 'localizador' => $reserva->localizador, 'status' => $reserva->status ] ]);
        } catch (\Exception $e) {
            Log::error('Error en marcarCheckIn: ' . $e->getMessage());
            return response()->json([ 'success' => false, 'error' => 'No se pudo marcar check-in: ' . $e->getMessage() ], 400);
        }
    }

    /**
     * Marca una reserva como check-out (se usa desde el escáner)
     */
    public function marcarCheckOut(Request $request, $localizador)
    {
        try {
            $reserva = Reserva::where('localizador', $localizador)->firstOrFail();

            $now = Carbon::now();
            $checkOut = Carbon::parse($reserva->check_out);

            // Validar que el check-out se realice antes o en la fecha de salida
            if ($now->startOfDay()->gt($checkOut->endOfDay())) {
                return response()->json([ 'success' => false, 'error' => 'No se puede hacer check-out: la fecha de salida ya ha pasado.' ], 400);
            }

            // Solo permitir marcar checked_out si actualmente está checked_in
            if ($reserva->status !== 'checked_in') {
                return response()->json([ 'success' => false, 'error' => 'La reserva no está marcada como check-in.' ], 400);
            }

            $reserva->status = 'checked_out';
            $reserva->save();

            try { event(new ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

                return response()->json([ 'success' => true, 'message' => 'Check-out realizado', 'reserva' => [ 'localizador' => $reserva->localizador, 'status' => $reserva->status ] ]);
        } catch (\Exception $e) {

                Log::error('Error en marcarCheckOut: ' . $e->getMessage());
                return response()->json([ 'success' => false, 'error' => 'No se pudo marcar check-out: ' . $e->getMessage() ], 400);
        }
    }

}
