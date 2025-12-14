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

class ReservaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
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

        return [ 'reservas' => $reservasJson ];

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
                'cliente_name' => $reserva->reservable->name ?? 'Sin cliente',
                'habitacion_numero' => $reserva->habitaciones->count() ? $reserva->habitaciones->pluck('habitacion.numero')->implode(', ') : 'Sin asignar',
            ];
        });
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreReservaRequest $request)
    {
        return DB::transaction(function () use ($request) {

            $reservable_id = $request->reservable_id;
            $tipo_usuario = $request->tipo_usuario;

            if ($reservable_id && $tipo_usuario) {
                if ($tipo_usuario === 'usuario') {

                    $user = User::find($reservable_id);

                    if (!$user) { return back()->withErrors(['error' => 'Usuario no encontrado']); }

                    $reservable_type = 'App\\Models\\User';

                } else {

                    $cliente = Cliente::find($reservable_id);

                    if (!$cliente) { return back()->withErrors(['error' => 'Cliente no encontrado']); }

                    $reservable_type = 'App\\Models\\Cliente';
                }
            }
            else if ($reservable_id) {

                $cliente = Cliente::find($reservable_id);

                if ($cliente) {

                    $reservable_type = 'App\\Models\\Cliente';

                } else {

                    $user = User::find($reservable_id);

                    if (!$user) {

                        return back()->withErrors(['error' => 'Persona no encontrada']);

                    }

                    $reservable_type = 'App\\Models\\User';
                }
            }
            else if ($request->filled('name')) {

                $cliente = Cliente::create([
                    'name' => $request->name,
                    'email' => $request->email ?? null,
                    'telefono' => $request->telefono ?? null,
                    'tipo_documento' => $request->tipo_documento ?? 'dni',
                    'numero_documento' => $request->numero_documento,
                    'nacionalidad' => $request->nacionalidad ?? null,
                    'direccion' => $request->direccion ?? 'Sin dirección',
                ]);

                $reservable_id = $cliente->id;
                $reservable_type = 'App\\Models\\Cliente';

            } else {

                return back()->withErrors(['error' => 'Persona requerida']);

            }

            do {

                $localizador = 'R' . strtoupper(Str::random(6));

            } while (Reserva::where('localizador', $localizador)->exists());

            $preciosHabitaciones = [];
            $precioTotalReal = $request->precio_total ?? 0;

            if ($request->filled('habitacion_ids') && is_array($request->habitacion_ids)) {
                $preciosHabitaciones = Habitacion::whereIn('id', $request->habitacion_ids)
                    ->pluck('precio_noche', 'id')
                    ->toArray();

                if (count($preciosHabitaciones) !== count($request->habitacion_ids)) {
                    $preciosHabitaciones = [];
                } else {
                    $precioTotalReal = array_sum($preciosHabitaciones);
                }
            }

            $reserva = Reserva::create([
                'localizador' => $localizador,
                'reservable_id' => $reservable_id,
                'reservable_type' => $reservable_type,
                'check_in' => $request->check_in,
                'check_out' => $request->check_out,
                'precio_total' => $precioTotalReal,
                'status' => $request->status ?? 'pendiente',
                'pago' => $request->pago ?? 'pendiente',
                'notas' => $request->notas ?? "Reserva creada in-situ"
            ]);

            if ($request->filled('habitacion_ids') && is_array($request->habitacion_ids)) {
                foreach ($request->habitacion_ids as $habitacionId) {
                    $precioHabitacion = $preciosHabitaciones[$habitacionId] ?? ($request->precio_total / count($request->habitacion_ids));

                    HabitacionReserva::create([
                        'reserva_id' => $reserva->id,
                        'habitacion_id' => $habitacionId,
                        'precio' => $precioHabitacion,
                        'check_in' => $request->check_in,
                        'check_out' => $request->check_out,
                    ]);
                }
            }

            return redirect()->back()->with(['success' => true, 'message' => "✅ Reserva {$localizador} creada (Total: €{$precioTotalReal})",
                'localizador' => $localizador
            ]);
        });
    }

    public function buscar(Request $request)
    {
        $query = $request->query('query');

        $users = User::where(function($q) use ($query) {
                $q->where('name', 'LIKE', "%{$query}%")
                  ->orWhere('email', 'LIKE', "%{$query}%")
                  ->orWhere('numero_documento', 'LIKE', "%{$query}%");
            })->select('id', 'name', 'email', 'numero_documento', 'telefono', 'nacionalidad')->limit(10)->get();

        return response()->json($users);
    }

    public function habitacionesDisponibles(Request $request)
    {
        $checkIn = $request->check_in;
        $checkOut = $request->check_out;

        $query = Habitacion::with('fotos')->where('estado', 'disponible');

        if ($checkIn && $checkOut) {
            $query->whereDoesntHave('reservas', function ($q) use ($checkIn, $checkOut) {
                $q->where('check_in', '<', $checkOut)
                  ->where('check_out', '>', $checkIn);
            });
        }

        $habitaciones = $query->orderBy('numero')->get();

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

    public function show(Reserva $reserva) { }

    public function edit(Reserva $reserva)
    {
        $reserva->load(['reservable', 'habitaciones.habitacion.fotos']);

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

        // Incluir habitaciones actuales (sin importar estado) + habitaciones disponibles sin conflictos
        $habitacionesDisponibles = Habitacion::select('id', 'numero', 'tipo', 'precio_noche', 'capacidad', 'estado')
            ->where(function($query) use ($reserva, $habitacionesActualesIds) {
                // Habitaciones actuales de esta reserva (sin filtrar por estado)
                $query->whereIn('id', $habitacionesActualesIds)
                    // O habitaciones disponibles sin conflictos de fechas
                    ->orWhere(function($q) use ($reserva) {
                        $q->where('estado', 'disponible')
                          ->whereDoesntHave('reservas', function ($subQ) use ($reserva) {
                              $subQ->where('reserva_id', '!=', $reserva->id)
                                   ->where('check_in', '<', $reserva->check_out)
                                   ->where('check_out', '>', $reserva->check_in);
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

    public function destroy(Reserva $reserva) { }

}
