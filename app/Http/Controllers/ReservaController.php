<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReservaRequest;
use App\Http\Requests\UpdateReservaRequest;
use App\Models\Cliente;
use App\Models\Habitacion;
use App\Models\HabitacionReserva;
use App\Models\Reserva;
use App\Models\User;
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
        $query = Reserva::with(['reservable', 'habitaciones.habitacion']);

        if ($request->filled('status') && $request->status !== 'todos') {
            $query->where('status', $request->status);
        }

        if ($request->filled('localizador')) {
            $query->where('localizador', 'LIKE', "%{$request->localizador}%");
        }

        if ($request->filled('cliente')) {
            $search = $request->cliente;
            $query->whereHasMorph('reservable', [Cliente::class, User::class], function ($q) use ($search) {
                $q->where('name', 'LIKE', "%{$search}%");
            });
        }

        if ($request->filled('habitacion')) {
            $habitacionSearch = $request->habitacion;
            $query->whereHas('habitaciones.habitacion', function ($q) use ($habitacionSearch) {
                $q->where('numero', 'LIKE', "%{$habitacionSearch}%");
            });
        }

        $reservas = $query->orderBy('check_in', 'desc')->get();

        $estadisticas = [
            'confirmado' => Reserva::where('status', 'confirmado')->count(),
            'pendiente' => Reserva::where('status', 'pendiente')->count(),
            'cancelado' => Reserva::where('status', 'cancelado')->count(),
            'checked_in' => Reserva::where('status', 'checked_in')->count(),
            'checked_out' => Reserva::where('status', 'checked_out')->count(),
            'total' => Reserva::count(),
            'confirmados' => Reserva::where('status', 'confirmado')->count(),
            'ingresos' => number_format(Reserva::sum('precio_total'), 2, '.', '')
        ];

        $reservasJson = $reservas->map(function ($reserva) {
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
                'habitacion_numero' => $reserva->habitaciones->count()
                    ? $reserva->habitaciones->pluck('habitacion.numero')->implode(', ')
                    : 'Sin asignar',
            ];
        });

        if ($request->wantsJson()) {
            return response()->json($reservasJson);
        }

        return [
            'reservas' => $reservasJson,
            'estadisticas' => $estadisticas
        ];
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

                    if (!$user) {
                        return back()->withErrors(['error' => 'Usuario no encontrado']);
                    }

                    $reservable_type = 'App\\Models\\User';
                } else {
                    $cliente = Cliente::find($reservable_id);

                    if (!$cliente) {
                        return back()->withErrors(['error' => 'Cliente no encontrado']);
                    }

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

    /**
     * Obtiene habitaciones disponibles para el rango de fechas especificado
     */
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
    public function edit(Reserva $reserva) { }
    public function update(UpdateReservaRequest $request, Reserva $reserva) { }
    public function destroy(Reserva $reserva) { }

}
