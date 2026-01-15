<?php

namespace App\Http\Controllers;

use App\Events\ReservaCreada;
use App\Events\ReservaActualizada;
use App\Http\Requests\StoreReservaRequest;
use App\Http\Requests\UpdateReservaRequest;
use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Reserva;
use App\Models\User;
use App\Services\ReservaService;
use App\Services\HabitacionService;
use App\Services\PrecioService;
use App\Helpers\ErrorHelper;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;

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
            // Preparar y validar datos
            $datosValidados = $reservaService->prepararDatosReserva($request->all());

            // Verificar disponibilidad
            $reservaService->verificarDisponibilidad(
                $datosValidados['habitaciones'],
                $datosValidados['check_in'],
                $datosValidados['check_out']
            );

            // Obtener o crear cliente (si no hay usuario logeado)
            if ($datosValidados['tipo_usuario'] === 'usuario') {
                // Usar el usuario logeado
                $datosValidados['reservable_id'] = Auth::id();
            } else {
                // Obtener o crear cliente
                $clienteId = $reservaService->obtenerOCrearCliente($datosValidados);
                $datosValidados['reservable_id'] = $clienteId;
                $datosValidados['tipo_usuario'] = 'cliente';
            }

            return DB::transaction(function () use ($reservaService, $datosValidados, $request) {
                // Generar localizador único
                $localizador = $reservaService->generarLocalizador();

                // Crear reserva
                $reservableType = $datosValidados['tipo_usuario'] === 'usuario' ? User::class : Cliente::class;
                $reserva = Reserva::create([
                    'localizador' => $localizador,
                    'reservable_id' => $datosValidados['reservable_id'],
                    'reservable_type' => $reservableType,
                    'booked_by_user_id' => Auth::user()->id ?? null,
                    'check_in' => $datosValidados['check_in'],
                    'check_out' => $datosValidados['check_out'],
                    'precio_total' => $datosValidados['precio_total'],
                    'status' => $request->status ?? 'pendiente',
                    'pago' => $request->pago ?? 'pendiente',
                    'notas' => $request->notas ?? "Reserva creada",
                ]);

                // Asignar habitaciones
                $reservaService->asignarHabitaciones($reserva, $datosValidados['habitaciones']);

                event(new ReservaCreada($reserva));

                $respuesta = [
                    'success' => true,
                    'message' => "Reserva {$localizador} creada (Total: €{$datosValidados['precio_total']})",
                    'localizador' => $localizador,
                    'reserva_id' => $reserva->id
                ];

                if ($request->wantsJson()) {
                    return response()->json($respuesta);
                }

                return redirect()->back()
                    ->with('success', $respuesta['message'])
                    ->with('reserva_id', $reserva->id)
                    ->with('localizador', $localizador);
            });
        } catch (\Exception $e) {
            Log::error('Error en ReservaController::store', [
                'mensaje' => $e->getMessage(),
                'archivo' => $e->getFile(),
                'linea' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);

            // Intentar parsear si es JSON (para cliente_existe_sin_confirmacion)
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

    public function buscar(Request $request)
    {
        $query = $request->query('query');

        $users = User::where(function ($q) use ($query) {
            $q->where('name', 'LIKE', "%{$query}%")
                ->orWhere('email', 'LIKE', "%{$query}%")
                ->orWhere('numero_documento', 'LIKE', "%{$query}%");
        })->select('id', 'name', 'email', 'numero_documento', 'telefono', 'nacionalidad')->limit(10)->get();

        return response()->json($users);
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

            // Obtener disponibles del servicio (agrupados por tipo y con precios)
            $disponibles = $habitacionService->obtenerDisponibles($entrada, $salida);

            // Si no hay disponibles, devolver array vacío
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

        return inertia('DetalleReserva', [
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
    }

    public function edit(Request $request, Reserva $reserva)
    {
        $reserva->load(['reservable', 'habitaciones.habitacion.fotos']);

        $checkIn = Carbon::parse($request->check_in ?? $reserva->check_in);
        $checkOut = Carbon::parse($request->check_out ?? $reserva->check_out);

        $reservaData = [
            'id' => $reserva->id,
            'localizador' => $reserva->localizador,
            'check_in' => $reserva->check_in,
            'check_out' => $reserva->check_out,
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
            'habitaciones' => $reserva->habitaciones->map(function ($hr) {
                return [
                    'id' => $hr->habitacion->id,
                    'numero' => $hr->habitacion->numero,
                    'tipo' => $hr->habitacion->tipo,
                    'precio_noche' => $hr->habitacion->precio_noche,
                    'capacidad' => $hr->habitacion->capacidad,
                    'precio' => $hr->precio,
                ];
            })->values()
        ];

        $habitacionesActualesIds = $reserva->habitaciones->pluck('habitacion.id')->toArray();
        $habitacionesDisponibles = Habitacion::select('id', 'numero', 'tipo', 'precio_noche', 'capacidad', 'estado')
            ->where(function ($query) use ($reserva, $habitacionesActualesIds, $checkIn, $checkOut) {
                $query->whereIn('id', $habitacionesActualesIds)
                    ->orWhere(function ($q) use ($reserva, $checkIn, $checkOut) {
                        $q->where('estado', 'disponible')
                            ->whereDoesntHave('reservas', function ($subQ) use ($reserva, $checkIn, $checkOut) {
                                $subQ->where('reserva_id', '!=', $reserva->id)
                                    ->where('check_in', '<', $checkOut)
                                    ->where('check_out', '>', $checkIn);
                            });
                    });
            })
            ->orderBy('numero')
            ->get()
            ->map(function ($hab) use ($habitacionesActualesIds, $checkIn, $checkOut) {
                // Usar servicio de precios
                $precioService = new PrecioService();
                $precioDinamico = $precioService->calcularPrecioEntreFechas($hab->tipo, $checkIn, $checkOut);

                return [
                    'id' => $hab->id,
                    'numero' => $hab->numero,
                    'tipo' => $hab->tipo,
                    'precio_noche' => $hab->precio_noche,
                    'precio_total' => $precioDinamico,
                    'capacidad' => $hab->capacidad,
                    'estado' => $hab->estado,
                    'es_actual' => in_array($hab->id, $habitacionesActualesIds)
                ];
            });

        return inertia('EditReserva', [
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

            try {
                event(new ReservaActualizada($reserva));
            } catch (\Throwable $e) {
                Log::warning('No se pudo emitir ReservaActualizada: ' . $e->getMessage());
            }

            return redirect()->route('panel')->with('success', "Reserva {$reserva->localizador} actualizada correctamente.");
        } catch (\Exception $e) {
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }

    public function destroy(Reserva $reserva)
    {
        try {
            DB::transaction(function () use ($reserva) {
                $reserva->habitaciones()->delete();
                $reserva->delete();
            });

            return redirect()->back()->with('success', 'Reserva eliminada con éxito');
        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'No se pudo eliminar la reserva: ' . $e->getMessage()]);
        }
    }

    /**
     * Calcula el precio dinámico para una reserva
     * POST /reservas/calcular-precio
     */
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
                return response()->json([
                    'success' => false,
                    'error' => $resultado['error'],
                ], 422);
            }

            return response()->json([
                'success' => true,
                'data' => $resultado,
            ]);
        } catch (\Exception $e) {
            Log::error('Error en calcularPrecio', [
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error al calcular precio: ' . $e->getMessage(),
            ], 500);
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

    /**
     * Descarga un comprobante de reserva en PDF
     */
    public function descargarComprobante($localizador)
    {
        try {
            $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
                ->where('localizador', $localizador)
                ->firstOrFail();

            $reservaService = new ReservaService();

            // Calcular noches
            $checkIn = Carbon::parse($reserva->check_in);
            $checkOut = Carbon::parse($reserva->check_out);
            $noches = max(1, abs($checkOut->diffInDays($checkIn)));

            // Preparar datos para el PDF
            $data = [
                'reserva' => $reserva,
                'cliente' => $reservaService->formatearCliente($reserva),
                'noches' => $noches,
                'fecha_generacion' => now()->format('d/m/Y H:i'),
            ];

            // Generar PDF
            $pdf = Pdf::loadView('pdf.comprobante-reserva', $data);

            // Descargar PDF
            return $pdf->download("Comprobante_{$localizador}.pdf");
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'No se encontró la reserva o error al generar PDF: ' . $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Obtiene información sobre si una reserva puede extenderse
     * GET /reservas/{localizador}/info-extension
     */
    public function infoExtension($localizador)
    {
        try {
            $reserva = Reserva::where('localizador', $localizador)->firstOrFail();
            $reservaService = new ReservaService();

            $info = $reservaService->obtenerInfoExtension($reserva);

            return response()->json([
                'success' => true,
                ...$info,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 404);
        }
    }

    /**
     * Extiende una reserva con nuevos días adicionales
     * POST /reservas/{localizador}/extender
     */
    public function extenderReserva(Request $request, $localizador)
    {
        try {
            $reserva = Reserva::with(['habitaciones.habitacion', 'pagos'])
                ->where('localizador', $localizador)
                ->firstOrFail();

            $reservaService = new ReservaService();

            // Verificar que la reserva se puede extender
            $checkOut = Carbon::parse($reserva->check_out);
            $horasHastaCheckout = now()->diffInHours($checkOut);

            if ($horasHastaCheckout >= 24) {
                return response()->json([
                    'success' => false,
                    'error' => 'La extensión solo está disponible 24 horas antes del checkout',
                ], 422);
            }

            if ($reserva->status === 'cancelada') {
                return response()->json([
                    'success' => false,
                    'error' => 'No se puede extender una reserva cancelada',
                ], 422);
            }

            // Obtener número de días a extender
            $numeroDias = (int) $request->input('numero_dias');

            if ($numeroDias < 1 || $numeroDias > 3) {
                return response()->json([
                    'success' => false,
                    'error' => 'Debes seleccionar entre 1 y 3 días de extensión',
                ], 422);
            }

            // Calcular nuevo checkout
            $nuevoCheckOut = $checkOut->copy()->addDays($numeroDias);

            // Verificar disponibilidad de habitaciones
            $habitacionesNoDisponibles = $reservaService->verificarDisponibilidadExtension(
                $reserva,
                $checkOut,
                $nuevoCheckOut
            );

            if (!empty($habitacionesNoDisponibles)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Las habitaciones no están disponibles para la extensión seleccionada',
                ], 422);
            }

            // Calcular precio de la extensión
            $precioExtension = $reservaService->calcularPrecioExtension($reserva, $checkOut, $nuevoCheckOut);

            // Verificar si necesita pago
            $necesitaPago = $reserva->pago === 'pagado';

            // Si es confirmación, aplicar extensión
            if ($request->input('confirmar')) {
                $reservaService->aplicarExtension($reserva, $nuevoCheckOut, $precioExtension);

                return response()->json([
                    'success' => true,
                    'message' => 'Reserva extendida correctamente',
                    'nuevo_check_out' => $nuevoCheckOut->toDateString(),
                    'precio_extension' => $precioExtension,
                    'necesita_pago' => $necesitaPago,
                ]);
            }

            // Retornar información de extensión (sin aplicar aún)
            return response()->json([
                'success' => true,
                'message' => 'Extensión calculada',
                'nuevo_check_out' => $nuevoCheckOut->toDateString(),
                'precio_extension' => $precioExtension,
                'necesita_pago' => $necesitaPago,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al extender la reserva: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Recalcula los precios de todas las reservas basándose en sus habitaciones
     * Esta es una operación de mantenimiento para arreglar precios históricos incorrectos
     */
    public function recalcularPreciosReservas()
    {
        try {
            $reservaService = new ReservaService();
            $actualizadas = $reservaService->recalcularPreciosTodasReservas();

            return response()->json([
                'success' => true,
                'message' => "Se recalcularon los precios de {$actualizadas} reservas.",
                'actualizadas' => $actualizadas,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error al recalcular precios: ' . $e->getMessage(),
            ], 500);
        }
    }
}
