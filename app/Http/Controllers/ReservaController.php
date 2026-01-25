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

            // Calcular desglose de precios para incluir en la respuesta
            try {
                $precioService = new \App\Services\PrecioService();
                $checkIn = Carbon::parse($request->input('check_in'));
                $checkOut = Carbon::parse($request->input('check_out'));
                $resultadoPrecio = $precioService->calcularMontoTotalConTarifas($request->input('habitaciones', []), $checkIn, $checkOut, $request->input('tarifas', []));
            } catch (\Throwable $e) {
                Log::warning('No se pudo calcular desglose para respuesta: ' . $e->getMessage());
                $resultadoPrecio = null;
            }

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

            if ($resultadoPrecio && is_array($resultadoPrecio)) {
                $respuesta['subtotal_habitaciones'] = $resultadoPrecio['subtotal_habitaciones'] ?? ($resultadoPrecio['total'] ?? null);
                $respuesta['cargo_tarifas'] = $resultadoPrecio['cargo_tarifas'] ?? 0;
                $respuesta['numero_noches'] = $resultadoPrecio['numeroNoches'] ?? ($request->check_out ? Carbon::parse($request->check_out)->diffInDays(Carbon::parse($request->check_in)) : null);
                $respuesta['tarifas_aplicadas'] = $resultadoPrecio['tarifas_aplicadas'] ?? [];
            }

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
        $reserva->load(['reservable', 'habitaciones.habitacion', 'reembolsos']);
        $reservaService = new ReservaService();
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
                'cliente' => $reservaService->formatearCliente($reserva),
                'check_in' => $reserva->check_in,
                'check_out' => $reserva->check_out,
                'precio_total' => $reserva->precio_total,
                'status' => $reserva->status,
                'pago' => $reserva->pago,
                'reembolsos_total' => ($reserva->reembolsos->sum('amount_cents') ?? 0) / 100,
                'reembolsos' => $reembolsosList,
                'habitaciones' => $reserva->habitaciones->map(function ($hr) {
                    return [
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

            // Detectar cambio de estado a 'cancelado' para enviar correo
            $originalStatus = $reserva->status;
            $motivo = $request->input('motivo') ?? null;

            DB::transaction(function () use ($reservaService, $validated, $reserva) {
                $reservaService->actualizarReserva($reserva, $validated);
            });

            // Refrescar la instancia para obtener los cambios
            $reserva->refresh();

            if ($originalStatus !== 'cancelado' && ($reserva->status === 'cancelado')) {
                // Cargar relaciones igual que en store
                $reserva->load(['reservable', 'habitaciones.habitacion']);

                try {
                    $destino = $reserva->reservable?->email ?? $request->input('email');
                    if ($destino) {
                        Mail::to($destino)->send(new \App\Mail\ReservaCancelada($reserva, $motivo));
                    }
                } catch (\Throwable $e) {
                    Log::warning('No se pudo enviar email de reserva cancelada: ' . $e->getMessage());
                }
            }

            return redirect()->route('panel')->with('success', "Reserva {$reserva->localizador} actualizada correctamente.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Request $request, Reserva $reserva)
    {
        try {
            $reservaService = new ReservaService();
            // Leer motivo opcional enviado desde frontend
            $motivo = $request->input('motivo') ?? null;

            // Cargar relaciones necesarias antes de enviar el correo (evita lazy-loading tras borrar)
            $reserva->loadMissing(['reservable', 'habitaciones.habitacion']);

            try {
                $destino = $reserva->reservable?->email ?? $request->input('email');
                if ($destino) {
                    Mail::to($destino)->send(new \App\Mail\ReservaCancelada($reserva, $motivo));
                }
            } catch (\Throwable $e) {
                Log::warning('No se pudo enviar email de reserva cancelada: ' . $e->getMessage());
            }

            // Ahora borrar la reserva
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
            'tarifas' => 'sometimes|array',
            'tarifas.*' => 'integer|exists:tarifas,id',
            ]);

            try {
                $precioService = new \App\Services\PrecioService();
            $checkIn = Carbon::createFromFormat('Y-m-d', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('Y-m-d', $validated['check_out']);


            // Usar método centralizado que aplica las reglas de tarifas en el backend
            $tarifasSeleccionadas = $validated['tarifas'] ?? [];
            $resultado = $precioService->calcularMontoTotalConTarifas($validated['habitaciones'], $checkIn, $checkOut, is_array($tarifasSeleccionadas) ? $tarifasSeleccionadas : []);

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
                    'reembolsos_total' => ($reserva->reembolsos()->sum('amount_cents') ?? 0) / 100,
                    'habitaciones' => $reserva->habitaciones->map(function ($hr) {
                        return [
                            'numero' => $hr->habitacion?->numero ?? null,
                            'tipo' => $hr->tipo ?? $hr->habitacion?->tipo ?? null,
                            'precio' => $hr->precio,
                        ];
                    })->values(),
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

            $reservaService = new ReservaService();
            $resultado = $reservaService->extenderReserva($localizador, $numeroDias, $confirmar);

            return response()->json($resultado);
        } catch (\Exception $e) {
            return response()->json([ 'success' => false, 'error' => 'Error al extender la reserva: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Modifica las fechas de la estancia (ampliar o reducir) tras comprobar disponibilidad.
     * Espera `check_in` y `check_out` en formato Y-m-d.
     */
    public function modificarEstancia(Request $request, $localizador)
    {
        $validated = $request->validate([
            'check_in' => 'required|date_format:Y-m-d',
            'check_out' => 'required|date_format:Y-m-d|after:check_in',
        ]);

        try {
            $reserva = Reserva::where('localizador', $localizador)->with('habitaciones.habitacion')->firstOrFail();
            $reservaService = new ReservaService();
            $precioService = new PrecioService();

            $checkIn = Carbon::createFromFormat('Y-m-d', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('Y-m-d', $validated['check_out']);

            // Comprobar disponibilidad para cada habitación actualmente asignada (si ya tiene habitación concreta)
            foreach ($reserva->habitaciones as $hr) {
                $habitacionId = $hr->habitacion_id ?? null;
                if ($habitacionId && ! $reservaService->verificarDisponibilidadHabitacion($habitacionId, $checkIn, $checkOut, $reserva->id)) {
                    return response()->json([ 'success' => false, 'message' => "No hay disponibilidad para la habitación " . ($hr->habitacion?->numero ?? $habitacionId) ], 400);
                }
            }

            // Calcular nuevo total y actualizar precios por habitación
            $nuevoTotal = 0;
            foreach ($reserva->habitaciones as $hr) {
                $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
                $precioHabitacion = $precioService->calcularPrecioEntreFechas($tipo, $checkIn, $checkOut);
                $nuevoTotal += $precioHabitacion;
            }

            $viejoTotal = (float) $reserva->precio_total;
            $diff = round(max(0, $nuevoTotal - $viejoTotal), 2);

            // Si hay cargo adicional, requerimos un pago válido (pago_id)
            if ($diff > 0) {
                $pagoId = $request->input('pago_id');
                if (!$pagoId) {
                    return response()->json([ 'success' => false, 'error' => 'pago_requerido', 'required_amount' => $diff, 'message' => 'Se requiere un pago adicional para ampliar la estancia.' ], 402);
                }

                $pago = Pago::find($pagoId);
                if (! $pago || $pago->reserva_id != $reserva->id || $pago->estado !== 'completado' || (float)$pago->monto < $diff) {
                    return response()->json([ 'success' => false, 'error' => 'pago_invalido', 'required_amount' => $diff, 'message' => 'Pago no válido o insuficiente.' ], 402);
                }
            }

            // Ahora que el pago (si aplica) está verificado, actualizar precios por habitación
            foreach ($reserva->habitaciones as $hr) {
                $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
                $precioHabitacion = $precioService->calcularPrecioEntreFechas($tipo, $checkIn, $checkOut);
                try { $hr->update(['precio' => $precioHabitacion]); } catch (\Throwable $e) { Log::warning('No se pudo actualizar precio habitacionReserva: ' . $e->getMessage()); }
            }

            // Actualizar reserva
            $reserva->check_in = $checkIn->toDateString();
            $reserva->check_out = $checkOut->toDateString();
            $reserva->precio_total = round($nuevoTotal, 2);
            $reserva->save();

            try { event(new ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

            return response()->json([ 'success' => true, 'message' => 'Estancia modificada correctamente.', 'reserva' => [ 'check_in' => $reserva->check_in, 'check_out' => $reserva->check_out, 'precio_total' => $reserva->precio_total ] ]);
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
    public function previewModificarEstancia(Request $request, $localizador)
    {
        $validated = $request->validate([
            'check_in' => 'required|date_format:Y-m-d',
            'check_out' => 'required|date_format:Y-m-d|after:check_in',
        ]);

        try {
            $reserva = Reserva::where('localizador', $localizador)->with('habitaciones.habitacion')->firstOrFail();
            $reservaService = new ReservaService();
            $precioService = new PrecioService();

            $checkIn = Carbon::createFromFormat('Y-m-d', $validated['check_in']);
            $checkOut = Carbon::createFromFormat('Y-m-d', $validated['check_out']);

            $disponible = true;
            foreach ($reserva->habitaciones as $hr) {
                $habitacionId = $hr->habitacion_id ?? null;
                if ($habitacionId && ! $reservaService->verificarDisponibilidadHabitacion($habitacionId, $checkIn, $checkOut, $reserva->id)) {
                    $disponible = false;
                    break;
                }
            }

            // Calcular nuevo total estimado
            $nuevoTotal = 0;
            foreach ($reserva->habitaciones as $hr) {
                $tipo = $hr->tipo ?? $hr->habitacion?->tipo ?? null;
                $precioHabitacion = $precioService->calcularPrecioEntreFechas($tipo, $checkIn, $checkOut);
                $nuevoTotal += $precioHabitacion;
            }

            $viejoTotal = (float) $reserva->precio_total;
            $nightsOld = Carbon::parse($reserva->check_in)->diffInDays(Carbon::parse($reserva->check_out));
            $nightsNew = $checkIn->diffInDays($checkOut);

            $perNight = $nightsOld > 0 ? round($viejoTotal / $nightsOld, 2) : 0;

            $estimateRefund = 0.00;
            $estimateCharge = 0.00;

            if ($nuevoTotal < $viejoTotal) {
                // prorrateo menos penalización fija
                $rawRefund = round($viejoTotal - $nuevoTotal, 2);
                $penalizacion = 20.00; // Penalización fija de 20 euros
                $estimateRefund = max(0, round($rawRefund - $penalizacion, 2));
            } else {
                $penalizacion = 0.00;
                $estimateCharge = round(max(0, $nuevoTotal - $viejoTotal), 2);
            }

            return response()->json([
                'success' => true,
                'available' => $disponible,
                'nuevo_total' => round($nuevoTotal, 2),
                'viejo_total' => round($viejoTotal, 2),
                'nights_old' => $nightsOld,
                'nights_new' => $nightsNew,
                'estimate_refund' => $estimateRefund,
                'penalizacion' => $penalizacion,
                'estimate_charge' => $estimateCharge,
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([ 'success' => false, 'message' => 'Reserva no encontrada.' ], 404);
        } catch (\Exception $e) {
            Log::error('Error en previewModificarEstancia: ' . $e->getMessage());
            return response()->json([ 'success' => false, 'message' => 'Error en preview: ' . $e->getMessage() ], 500);
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

            $reservaService = new ReservaService();
            // Intentar asignar habitaciones concretas en check-in (first available)
            $asignaciones = $reservaService->asignarHabitacionEnCheckIn($reserva, Auth::id());

            // Si al menos una asignación falló, devolvemos un mensaje indicando intervención de recepción
            $failed = array_filter($asignaciones, function($a){ return isset($a['assigned']) && $a['assigned'] === false; });
            if (count($failed) > 0) {
                return response()->json([ 'success' => false, 'message' => 'No se pudieron asignar todas las habitaciones en el check-in. Contacte recepción.', 'details' => $asignaciones ], 409);
            }

            // Marcar checked_in y emitir evento
            $reserva->status = 'checked_in';
            $reserva->save();

            try { event(new ReservaActualizada($reserva)); } catch (\Throwable $e) { /* ignore */ }

            // Notificar cliente con número(s) de habitación asignada (si hay email)
            try {
                $destino = $reserva->reservable?->email ?? null;
                if ($destino) {
                    // Build simple message: numbers assigned
                    $numeros = array_values(array_map(function($a){ return $a['assigned'] ? $a['numero'] ?? null : null; }, $asignaciones));
                    $numeros = array_filter($numeros);
                    if (!empty($numeros)) {
                        Mail::to($destino)->send(new \App\Mail\ReservaCompletada($reserva));
                    }
                }
            } catch (\Throwable $e) { Log::warning('No se pudo notificar asignacion en checkin: ' . $e->getMessage()); }

            return response()->json([ 'success' => true, 'message' => 'Check-in realizado', 'reserva' => [ 'localizador' => $reserva->localizador, 'status' => $reserva->status, 'asignaciones' => $asignaciones ] ]);
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
