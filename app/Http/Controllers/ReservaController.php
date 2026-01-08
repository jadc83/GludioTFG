<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReservaRequest;
use App\Http\Requests\UpdateReservaRequest;
use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Reserva;
use App\Models\User;
use App\Services\ReservaService;
use App\Services\HabitacionService;
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

        $reservasJson = self::formatear($reservas);

        if ($request->wantsJson()) {
            return response()->json($reservasJson);
        }

        return ['reservas' => $reservasJson];
    }

    public static function formatear($reservas)
    {
        return $reservas->map(function ($reserva) {
            // Obtener el nombre del cliente/usuario
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
        });
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
                $this->asignarHabitaciones($reserva, $datosValidados['habitaciones']);

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

            $mensajeAmigable = $this->obtenerMensajeErrorAmigable($e);

            if ($request->wantsJson()) {
                return response()->json(['success' => false, 'error' => $mensajeAmigable], 400);
            }

            return back()->withErrors(['error' => $mensajeAmigable]);
        }
    }

    /**
     * Asigna habitaciones a una reserva
     */
    private function asignarHabitaciones(Reserva $reserva, array $habitacionesRequeridas): void
    {
        foreach ($habitacionesRequeridas as $req) {
            $tipo = $req['tipo'];
            $cantidad = $req['cantidad'];

            // Obtener habitaciones disponibles del tipo solicitado
            $habitaciones = Habitacion::where('tipo', $tipo)
                ->where('estado', 'disponible')
                ->whereDoesntHave('reservas', function ($query) use ($reserva) {
                    // Excluir conflictos con otras reservas en el mismo período
                    $query->where('reserva_id', '!=', $reserva->id)
                          ->where('check_in', '<', $reserva->check_out)
                          ->where('check_out', '>', $reserva->check_in);
                })
                ->limit($cantidad)
                ->get();

            if ($habitaciones->count() < $cantidad) {
                throw new \Exception("No hay {$cantidad} habitación/es de tipo '{$tipo}' disponibles para las fechas seleccionadas.");
            }

            // Calcular precio usando precios base fijos (nunca precio_noche de BD)
            $precioPorHabitacion = $this->calcularPrecioConPreciosBase(
                $tipo,
                $reserva->check_in,
                $reserva->check_out
            );

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
     * Calcula el precio de una habitación usando precios base fijos (como el frontend)
     */
    private function calcularPrecioConPreciosBase($tipo, $checkIn, $checkOut): float
    {
        $preciosBase = [ 'doble' => 75, 'familiar' => 125, 'suite' => 200 ];

        $tipo = strtolower(trim($tipo));
        $precioBase = $preciosBase[$tipo] ?? 0;

        if ($precioBase <= 0) {
            return 0;
        }

        $total = 0;
        $fecha = Carbon::parse($checkIn)->copy();
        $fechaFin = Carbon::parse($checkOut);

        while ($fecha->lt($fechaFin)) {
            $multiplicador = 1.0;

            $mes = $fecha->month;
            $dia = $fecha->day;

            // Temporada alta: Julio, Agosto, Diciembre 20+
            if ($mes === 7 || $mes === 8 || ($mes === 12 && $dia >= 20)) {
                $multiplicador *= 1.5;
            }

            // Temporada media: Marzo 15+, Abril
            if (($mes === 3 && $dia >= 15) || $mes === 4) {
                $multiplicador *= 1.2;
            }

            // Fin de semana: Sábado o Domingo
            if ($fecha->isWeekend()) {
                $multiplicador *= 1.25;
            }

            // Festivos españoles
            $fechaFormato = $fecha->format('m-d');
            $festivos = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-25'];
            if (in_array($fechaFormato, $festivos)) {
                $multiplicador *= 1.5;
            }

            $total += round($precioBase * $multiplicador, 2);
            $fecha->addDay();
        }

        return round($total, 2);
    }

    /**
     * Convierte errores técnicos en mensajes amigables para el usuario
     */
    private function obtenerMensajeErrorAmigable(\Exception $e): string
    {
        $mensaje = $e->getMessage();

        // Validar errores de unicidad
        if (str_contains($mensaje, 'llave duplicada') || str_contains($mensaje, 'UNIQUE')) {
            if (str_contains($mensaje, 'email')) {
                return 'El correo electrónico ya está registrado en el sistema.';
            }
            if (str_contains($mensaje, 'numero_documento')) {
                return 'El número de documento ya está registrado en el sistema.';
            }
            return 'Los datos ingresados ya existen en el sistema.';
        }

        // Errores de validación personalizados
        if (str_contains($mensaje, 'no coinciden')) {
            return 'Los datos proporcionados no coinciden con nuestros registros.';
        }

        // Errores de base de datos
        if (str_contains($mensaje, 'violates foreign key')) {
            return 'Hay un problema con los datos relacionados. Por favor, intenta de nuevo.';
        }

        // Error genérico
        return 'Ocurrió un error al procesar tu reserva. Por favor, intenta nuevamente.';
    }

    private function obtenerModificadorPrecio($fecha): float
{
    $mes = $fecha->month;
    $dia = $fecha->day;

    $base = match (true) {
        ($mes === 7 || $mes === 8) || ($mes === 12 && $dia >= 18) => 1.5,
        ($mes === 3 || $mes === 4) && $dia >= 15 && $dia <= 31 => 1.2,
        default => 1.0,
    };

    $finSemana = $fecha->isWeekend() ? 1.25 : 1.0;

    $festivos = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-25'];
    $festivo = in_array($fecha->format('m-d'), $festivos, true) ? 1.5 : 1.0;

    return $base * $finSemana * $festivo;
}

    private function calcularPrecioEntreFechas($habitacion, $checkIn, $checkOut): float
    {
        $total = 0;
        $fecha = Carbon::parse($checkIn)->copy();
        $fechaFin = Carbon::parse($checkOut);

        while ($fecha->lt($fechaFin)) {
            $precioDia = $habitacion->precio_noche * $this->obtenerModificadorPrecio($fecha);
            $total += round($precioDia, 2);
            $fecha->addDay();
        }

        return $total;
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

        return inertia('DetalleReserva', [
            'reserva' => [
                'id' => $reserva->id,
                'localizador' => $reserva->localizador,
                'cliente' => $this->formatearCliente($reserva),
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
                // Usar precios base fijos, nunca precio_noche de BD
                $precioDinamico = $this->calcularPrecioConPreciosBase($hab->tipo, $checkIn, $checkOut);

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
            return DB::transaction(function () use ($validated, $reserva) {
                $checkIn = $validated['check_in'];
                $checkOut = $validated['check_out'];
                $habitacionIds = $validated['habitacion_ids'];

                foreach ($habitacionIds as $id) {
                    $ocupada = HabitacionReserva::where('habitacion_id', $id)
                        ->where('reserva_id', '!=', $reserva->id)
                        ->where(function ($q) use ($checkIn, $checkOut) {
                            $q->where('check_in', '<', $checkOut)
                              ->where('check_out', '>', $checkIn);
                        })->exists();

                    if ($ocupada) {
                        $num = Habitacion::find($id)->numero ?? $id;
                        throw new \Exception("La habitación {$num} ya está ocupada en esas fechas.");
                    }
                }

                $reserva->update([
                    'check_in' => $checkIn,
                    'check_out' => $checkOut,
                    'status' => $validated['status'],
                    'pago' => $validated['pago'],
                    'notas' => $validated['notas'] ?? null,
                ]);

                $reserva->habitaciones()->delete();
                $precioTotal = 0;

                foreach ($habitacionIds as $habitacionId) {
                    $habitacion = Habitacion::findOrFail($habitacionId);
                    // Usar precios base fijos, nunca precio_noche de BD
                    $precioHabitacion = $this->calcularPrecioConPreciosBase(
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

                return redirect()->route('panel')->with('success', "✅ Reserva {$reserva->localizador} actualizada correctamente.");
            });
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

            return response()->json([
                'success' => true,
                'reserva' => [
                    'id' => $reserva->id,
                    'localizador' => $reserva->localizador,
                    'cliente' => $this->formatearCliente($reserva),
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
     * Formatea el cliente de una reserva
     */
    private function formatearCliente($reserva)
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
     * Descarga un comprobante de reserva en PDF
     */
    public function descargarComprobante($localizador)
    {
        try {
            $reserva = Reserva::with(['reservable', 'habitaciones.habitacion', 'pagos'])
                ->where('localizador', $localizador)
                ->firstOrFail();

            // Calcular noches
            $checkIn = Carbon::parse($reserva->check_in);
            $checkOut = Carbon::parse($reserva->check_out);
            $noches = max(1, abs($checkOut->diffInDays($checkIn)));

            // Preparar datos para el PDF
            $data = [
                'reserva' => $reserva,
                'cliente' => $this->formatearCliente($reserva),
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

            // Calcular horas hasta checkout
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

            return response()->json([
                'success' => true,
                'puede_extender' => $puedeExtender,
                'horas_hasta_checkout' => max(0, (int)$horasHastaCheckout),
                'max_dias' => 3,
                'razon' => $razon,
                'check_out_actual' => $checkOut->format('Y-m-d'),
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

            // Verificar que la reserva se puede extender (menos de 24 horas antes del checkout)
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

            // Calcular nuevo checkout sumando días con Carbon
            $nuevoCheckOut = $checkOut->copy()->addDays($numeroDias);

            // Convertir a formato de fecha para comparación
            $checkOutDate = $checkOut->format('Y-m-d');
            $nuevoCheckOutDate = $nuevoCheckOut->format('Y-m-d');

            // Verificar disponibilidad de habitaciones para las nuevas fechas (solo el período de extensión)
            $habitacionesNoDisponibles = [];

            foreach ($reserva->habitaciones as $habitacionReserva) {
                $habitacion = $habitacionReserva->habitacion;

                // Contar reservas conflictivas en el período de extensión (excluyendo esta reserva)
                // La extensión es desde checkOut actual hasta el nuevo checkOut
                $query = HabitacionReserva::where('habitacion_id', $habitacion->id)
                    ->where('reserva_id', '!=', $reserva->id);

                $conflictivas = $query
                    ->whereRaw("check_in < ? AND check_out > ?", [$nuevoCheckOutDate, $checkOutDate])
                    ->get();

                // Debug: mostrar todas las reservas de esta habitación
                $todasReservas = HabitacionReserva::where('habitacion_id', $habitacion->id)
                    ->where('reserva_id', '!=', $reserva->id)
                    ->get();

                \Log::info('Validación extensión', [
                    'habitacion_id' => $habitacion->id,
                    'numero' => $habitacion->numero,
                    'checkOut' => $checkOutDate,
                    'nuevoCheckOut' => $nuevoCheckOutDate,
                    'conflictivas_count' => $conflictivas->count(),
                    'todas_reservas' => $todasReservas->map(fn($r) => [
                        'reserva_id' => $r->reserva_id,
                        'check_in' => $r->check_in?->format('Y-m-d'),
                        'check_out' => $r->check_out?->format('Y-m-d'),
                    ])->toArray(),
                ]);

                if ($conflictivas->count() > 0) {
                    $habitacionesNoDisponibles[] = $habitacion->numero;
                }
            }

            if (!empty($habitacionesNoDisponibles)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Las habitaciones no están disponibles para la extensión seleccionada',
                ], 422);
            }

            // Calcular precio de la extensión usando precios base fijos
            $precioExtenso = 0;

            foreach ($reserva->habitaciones as $habitacionReserva) {
                $habitacion = $habitacionReserva->habitacion;
                // Calcular precio para los nuevos días usando precios base, nunca precio_noche de BD
                $precioExtenso += $this->calcularPrecioConPreciosBase(
                    $habitacion->tipo,
                    $checkOut,
                    $nuevoCheckOut
                );
            }

            // Verificar si necesita pago (solo si la reserva ya está PAGADA)
            // Si no está pagada, solo se suma al total pendiente
            $necesitaPago = $reserva->pago === 'pagado';

            // Si es confirmación sin pago requerido, actualizar directamente
            if ($request->input('confirmar') && !$necesitaPago) {
                $reserva->check_out = $nuevoCheckOut;
                $reserva->precio_total += $precioExtenso;
                $reserva->save();

                // Actualizar las fechas en las relaciones HabitacionReserva
                foreach ($reserva->habitaciones as $habitacionReserva) {
                    $habitacionReserva->check_out = $nuevoCheckOut;
                    $habitacionReserva->save();
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Reserva extendida correctamente',
                    'nuevo_check_out' => $nuevoCheckOut->toDateString(),
                    'precio_extension' => $precioExtenso,
                    'necesita_pago' => false,
                ]);
            }

            // Si es confirmación con pago, actualizar después de que se haya pagado
            if ($request->input('confirmar') && $necesitaPago) {
                $reserva->check_out = $nuevoCheckOut;
                $reserva->precio_total += $precioExtenso;
                $reserva->save();

                // Actualizar las fechas en las relaciones HabitacionReserva
                foreach ($reserva->habitaciones as $habitacionReserva) {
                    $habitacionReserva->check_out = $nuevoCheckOut;
                    $habitacionReserva->save();
                }

                return response()->json([
                    'success' => true,
                    'message' => 'Reserva extendida correctamente',
                    'nuevo_check_out' => $nuevoCheckOut->toDateString(),
                    'precio_extension' => $precioExtenso,
                    'necesita_pago' => true,
                ]);
            }

            // Retornar información de extensión (sin aplicar aún)
            return response()->json([
                'success' => true,
                'message' => 'Extensión calculada',
                'nuevo_check_out' => $nuevoCheckOut->toDateString(),
                'precio_extension' => $precioExtenso,
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
            $reservas = Reserva::with(['habitaciones.habitacion'])->get();
            $actualizadas = 0;

            foreach ($reservas as $reserva) {
                $precioTotal = 0;

                foreach ($reserva->habitaciones as $habitacionReserva) {
                    // Usar el método calcularPrecioEntreFechas para recalcular consistentemente
                    if ($habitacionReserva->habitacion) {
                        $precioDia = $this->calcularPrecioEntreFechas(
                            $habitacionReserva->habitacion,
                            $habitacionReserva->check_in ?? $reserva->check_in,
                            $habitacionReserva->check_out ?? $reserva->check_out
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
