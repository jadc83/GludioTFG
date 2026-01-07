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

                // Marcar habitaciones como ocupadas cuando se crea la reserva
                $reserva->marcarHabitacionesComoOcupadas();

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
        $precioService = new \App\Services\PrecioService();

        foreach ($habitacionesRequeridas as $req) {
            $tipo = $req['tipo'];
            $cantidad = $req['cantidad'];

            $habitaciones = Habitacion::where('tipo', $tipo)
                ->limit($cantidad)
                ->get();

            // Calcular precio dinámico para este tipo de habitación
            $precioCalculo = $precioService->calcularPrecioDinamico(
                $tipo,
                $reserva->check_in,
                $reserva->check_out
            );

            $precioDinamico = $precioCalculo['total'] ?? 0;
            $precioPorNoche = $precioCalculo['precioPromedioPorNoche'] ?? 0;

            foreach ($habitaciones as $habitacion) {
                HabitacionReserva::create([
                    'reserva_id' => $reserva->id,
                    'habitacion_id' => $habitacion->id,
                    'precio' => $precioDinamico,
                    'precio_unitario' => $precioPorNoche,
                ]);
            }
        }
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

    private function asignarHabitacionesAutomaticamente(Reserva $reserva, $request): float
    {
        $precioTotalReal = 0;

        foreach ($request->habitaciones as $solicitud) {
            $tipo = $solicitud['tipo'];
            $cantidad = $solicitud['cantidad'];
            $personas = $solicitud['personas_por_habitacion'] ?? 1;

            $disponibles = Habitacion::where('tipo', $tipo)
                ->where('capacidad', '>=', $personas)
                ->disponiblesEntre($request->check_in, $request->check_out, $reserva->id ?? null)
                ->orderBy('numero')
                ->take($cantidad)
                ->get();

            if ($disponibles->count() < $cantidad) {
                throw new \Exception("No hay suficientes habitaciones de tipo {$tipo} disponibles para las fechas seleccionadas");
            }

            foreach ($disponibles as $habitacion) {
                $precioDinamico = $this->calcularPrecioEntreFechas($habitacion, $request->check_in, $request->check_out);

                HabitacionReserva::create([
                    'reserva_id' => $reserva->id,
                    'habitacion_id' => $habitacion->id,
                    'precio' => $precioDinamico,
                    'check_in' => $request->check_in,
                    'check_out' => $request->check_out,
                ]);
                $precioTotalReal += $precioDinamico;
            }
        }

        return $precioTotalReal;
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
        $reserva->load(['reservable', 'habitaciones.habitacion', 'bookedBy']);

        if (request()->wantsJson()) {
            return response()->json($reserva);
        }

        return inertia('ShowReserva', [
            'reserva' => $reserva
        ]);
    }

    public function edit(Request $request, Reserva $reserva)
    {
        $reserva->load(['reservable', 'habitaciones.habitacion.fotos']);

        $checkIn = $request->check_in ?? $reserva->check_in;
        $checkOut = $request->check_out ?? $reserva->check_out;

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
            ->map(function ($hab) use ($habitacionesActualesIds) {
                return [
                    'id' => $hab->id,
                    'numero' => $hab->numero,
                    'tipo' => $hab->tipo,
                    'precio_noche' => $hab->precio_noche,
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
                    $precioHabitacion = $this->calcularPrecioEntreFechas($habitacion, $checkIn, $checkOut);

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

                // Si la reserva está confirmada o pagada, marcar habitaciones como ocupadas
                if ($validated['status'] === 'confirmada' || $validated['pago'] === 'pagado') {
                    $reserva->marcarHabitacionesComoOcupadas();
                }

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

    private function porPersona($request): array
    {
        if ($persona = $this->porTipo($request)) {
            return [$persona->id, get_class($persona)];
        }

        if ($persona = $this->porId($request->reservable_id)) {
            return [$persona->id, get_class($persona)];
        }

        if ($request->filled('name')) {
            return $this->nuevoCliente($request);
        }

        return [null, null];
    }

    private function porTipo($request)
    {
        if (!$request->reservable_id || !$request->tipo_usuario) {
            return null;
        }

        return $request->tipo_usuario === 'usuario' ? User::find($request->reservable_id) : Cliente::find($request->reservable_id);
    }

    private function porId($id)
    {
        if (!$id) return null;
        return Cliente::find($id) ?? User::find($id);
    }

    private function nuevoCliente($request)
    {
        // Buscar cliente existente por DNI
        if ($request->numero_documento) {
            $clienteExistente = Cliente::where('numero_documento', $request->numero_documento)->first();
            if ($clienteExistente) {
                // Validar que el nombre coincida para evitar suplantaciones
                if ($clienteExistente->name !== $request->name) {
                    throw new \Exception("Los datos proporcionados no coinciden con nuestros registros. Por favor, verifica tu información.");
                }
                return [$clienteExistente->id, Cliente::class];
            }
        }

        // Buscar cliente existente por email
        if ($request->email) {
            $clienteExistente = Cliente::where('email', $request->email)->first();
            if ($clienteExistente) {
                return [$clienteExistente->id, Cliente::class];
            }
        }

        // Procesar la dirección - puede venir como array o string
        $direccion = $request->direccion ?? 'Sin dirección';
        if (is_array($direccion)) {
            // Si es un array, combinar los componentes en una cadena
            $partes = array_filter([
                $direccion['calle'] ?? null,
                $direccion['codigo_postal'] ?? null,
                $direccion['ciudad'] ?? null,
                $direccion['pais'] ?? null,
            ]);
            $direccion = !empty($partes) ? implode(', ', $partes) : 'Sin dirección';
        }

        $cliente = Cliente::create([
            'name' => $request->name,
            'email' => $request->email ?? null,
            'telefono' => $request->telefono ?? null,
            'tipo_documento' => $request->tipo_documento ?? 'dni',
            'numero_documento' => $request->numero_documento,
            'nacionalidad' => $request->nacionalidad ?? '',
            'direccion' => $direccion,
        ]);

        return [$cliente->id, Cliente::class];
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
}

