<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReservaRequest;
use App\Http\Requests\UpdateReservaRequest;
use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Reserva;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Auth;

class ReservaController extends Controller
{
    public function index(Request $request)
    {
        $reservas = Reserva::with(['reservable', 'habitaciones.habitacion'])
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
                'cliente_name' => $reserva->reservable->name ?? 'Sin cliente',
                'booked_by_user' => $reserva->bookedBy->name ?? null,
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
        [$persona_id, $tipo_persona] = $this->porPersona($request);

        if (!$persona_id) {
            return back()->withErrors(['error' => 'Persona requerida']);
        }

        return DB::transaction(function () use ($request, $persona_id, $tipo_persona) {

            do {
                $localizador = 'G' . strtoupper(Str::random(6));
            } while (Reserva::where('localizador', $localizador)->exists());

            $reserva = Reserva::create([
                'localizador' => $localizador,
                'reservable_id' => $persona_id,
                'reservable_type' => $tipo_persona,
                'booked_by_user_id' => Auth::user()->id ?? null,
                'check_in' => $request->check_in,
                'check_out' => $request->check_out,
                'precio_total' => 0,
                'status' => $request->status ?? 'pendiente',
                'pago' => $request->pago ?? 'pendiente',
                'notas' => $request->notas ?? "Reserva creada in-situ"
            ]);

            $precioTotalReal = $this->asignarHabitacionesAutomaticamente($reserva, $request);
            $reserva->update(['precio_total' => $precioTotalReal]);

            $respuesta = [
                'success' => true,
                'message' => "Reserva {$localizador} creada (Total: €{$precioTotalReal})",
                'localizador' => $localizador,
                'reserva_id' => $reserva->id
            ];

            if ($request->wantsJson()) {
                return response()->json($respuesta);
            }

            return redirect()->back()->with($respuesta);
        });
    }

    private function obtenerModificadorPrecio($fecha): float
    {
        $modificador = 1.0;
        $mes = $fecha->month;
        $dia = $fecha->day;

        if (($mes == 7 || $mes == 8) || ($mes == 12 && $dia >= 20)) {
            $modificador *= 1.5;
        } elseif (($mes == 3 || $mes == 4) && $dia >= 15 && $dia <= 31) {
            $modificador *= 1.2;
        }

        if ($fecha->isWeekend()) $modificador *= 1.25;

        $festivos = ['01-01', '01-06', '05-01', '08-15', '10-12', '11-01', '12-25'];

        if (in_array($fecha->format('m-d'), $festivos)) $modificador *= 1.5;

        return $modificador;
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
                ->where('estado', 'disponible')
                ->where('capacidad', '>=', $personas)
                ->whereDoesntHave('reservas', function ($q) use ($request) {
                    $q->where('check_in', '<', $request->check_out)
                        ->where('check_out', '>', $request->check_in);
                })
                ->orderBy('numero')
                ->take($cantidad)
                ->get();

            if ($disponibles->count() < $cantidad) {
                throw new \Exception("No hay suficientes habitaciones de tipo {$tipo} disponibles");
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
        $entrada = $request->check_in;
        $salida = $request->check_out;

        $consulta = Habitacion::with('fotos')->where('estado', 'disponible');

        if ($entrada && $salida) {
            $consulta->whereDoesntHave('reservas', function ($query) use ($entrada, $salida) {
                $query->where('check_in', '<', $salida)
                    ->where('check_out', '>', $entrada);
            });
        }

        $habitaciones = $consulta->orderBy('numero')->get();

        $habitacionesFormateadas = $habitaciones->map(function ($habitacion) {
            return [
                'id' => $habitacion->id,
                'numero' => $habitacion->numero,
                'tipo' => $habitacion->tipo,
                'precio_noche' => $habitacion->precio_noche,
                'capacidad' => $habitacion->capacidad,
                'estado' => $habitacion->estado,
                'descripcion' => $habitacion->descripcion,
                'notas' => $habitacion->notas,
                'fotos' => $habitacion->fotos->map(function ($foto) {
                    return [
                        'id' => $foto->id,
                        'ruta' => $foto->ruta,
                        'orden' => $foto->orden,
                        'url' => asset('storage/' . $foto->ruta)
                    ];
                })->values()
            ];
        })->values();

        return response()->json($habitacionesFormateadas);
    }

    public function show(Reserva $reserva)
    {
        //
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
                'id' => $reserva->reservable->id,
                'name' => $reserva->reservable->name,
                'email' => $reserva->reservable->email,
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

        return DB::transaction(function () use ($validated, $reserva) {
            $reserva->update([
                'check_in' => $validated['check_in'],
                'check_out' => $validated['check_out'],
                'status' => $validated['status'],
                'pago' => $validated['pago'],
                'notas' => $validated['notas'] ?? null,
            ]);

            $reserva->habitaciones()->delete();
            $dias = Carbon::parse($validated['check_in'])->diffInDays($validated['check_out']);

            foreach ($validated['habitacion_ids'] as $habitacionId) {
                $habitacion = Habitacion::find($habitacionId);
                if ($habitacion) {
                    $precioHabitacion = $habitacion->precio_noche * $dias;

                    HabitacionReserva::create([
                        'reserva_id' => $reserva->id,
                        'habitacion_id' => $habitacionId,
                        'precio' => $precioHabitacion,
                        'check_in' => $validated['check_in'],
                        'check_out' => $validated['check_out'],
                    ]);
                }
            }

            $precioTotal = $reserva->habitaciones()->sum('precio');
            $reserva->update(['precio_total' => $precioTotal]);

            return redirect()->route('panel')->with('success', "✅ Reserva {$reserva->localizador} actualizada correctamente");
        });
    }

    public function destroy(Reserva $reserva)
    {
        //
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
        return Cliente::find($id) ?? User::find($id);
    }

    private function nuevoCliente($request)
    {
        $cliente = Cliente::create([
            'name' => $request->name,
            'email' => $request->email ?? null,
            'telefono' => $request->telefono ?? null,
            'tipo_documento' => $request->tipo_documento ?? 'dni',
            'numero_documento' => $request->numero_documento,
            'nacionalidad' => $request->nacionalidad ?? '',
            'direccion' => $request->direccion ?? 'Sin dirección',
        ]);

        return [$cliente->id, 'App\\Models\\Cliente'];
    }
}
