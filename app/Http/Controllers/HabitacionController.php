<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHabitacionRequest;
use App\Http\Requests\UpdateHabitacionRequest;
use App\Models\Habitacion;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;

class HabitacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Habitacion::with('fotos');

        if ($request->filled('estado') && $request->estado !== 'todos') {
            $query->where('estado', $request->estado);
        }

        if ($request->filled('tipo') && $request->tipo !== 'todos') {
            $query->where('tipo', $request->tipo);
        }

        if ($request->filled('capacidad') && $request->capacidad !== 'todos') {
            $query->where('capacidad', (int)$request->capacidad);
        }

        if ($request->filled('precio_min')) {
            $query->where('precio_noche', '>=', (float)$request->precio_min);
        }

        if ($request->filled('precio_max')) {
            $query->where('precio_noche', '<=', (float)$request->precio_max);
        }

        if ($request->filled('busqueda')) {
            $busqueda = $request->busqueda;
            $query->where(function ($q) use ($busqueda) {
                $q->where('numero', 'ILIKE', "%{$busqueda}%")
                    ->orWhere('tipo', 'ILIKE', "%{$busqueda}%")
                    ->orWhere('descripcion', 'ILIKE', "%{$busqueda}%");
            });
        }

        $habitaciones = $query->orderBy('numero')->get();

        $estadisticas = Cache::remember('habitaciones.conteos', 60, function () {
            return [
                'disponible' => Habitacion::where('estado', 'disponible')->count(),
                'ocupada' => Habitacion::where('estado', 'ocupada')->count(),
                'mantenimiento' => Habitacion::where('estado', 'mantenimiento')->count(),
                'limpieza' => Habitacion::where('estado', 'limpieza')->count(),
                'total' => Habitacion::count(),
                'capacidades_disponibles' => Habitacion::distinct()
                    ->orderBy('capacidad')
                    ->pluck('capacidad')
                    ->values()
                    ->toArray()
            ];
        });

        if ($request->wantsJson()) {
            return response()->json(self::formatear($habitaciones));
        }

        return [
            'habitaciones' => self::formatear($habitaciones),
            'estadisticas' => $estadisticas
        ];
    }

    /**
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreHabitacionRequest $request)
    {
        return DB::transaction(function () use ($request) {

            $validado = $request->validated();
            $habitacion = Habitacion::create($validado);

            if ($request->hasFile('fotos')) {
                foreach ($request->file('fotos') as $orden => $foto) {
                    $ruta = $foto->store('habitaciones', 'public');
                    $habitacion->fotos()->create([
                        'ruta' => $ruta,
                        'orden' => $orden,
                    ]);
                }
            }
            return redirect()->back()->with('success', 'Habitación creada.');
        });
    }

    /**
     * Display the specified resource.
     */
    public function show(Habitacion $habitacion)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Habitacion $habitacion)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateHabitacionRequest $request, Habitacion $habitacion)
    {
        return DB::transaction(function () use ($request, $habitacion) {
            $validado = $request->validated();
            $habitacion->update($validado);

            $this->eliminarFotos($habitacion, $request->input('fotos_eliminar', []));
            $this->agregarFotos($habitacion, $request->file('fotos'));

            return $request->header('X-Inertia')
                ? redirect()->back()
                : redirect()->route('panel');
        });
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Habitacion $habitacion)
    {
        //
    }

    private function eliminarFotos(Habitacion $habitacion, $ids)
    {
        $fotos = $habitacion->fotos()->whereIn('id', $ids)->get();

        foreach ($fotos as $foto) {
            Storage::disk('public')->delete($foto->ruta);
            $foto->delete();
        }
    }

    private function agregarFotos(Habitacion $habitacion, ?array $fotosNuevas)
    {
        if (!$fotosNuevas) return;

        $ordenActual = $habitacion->fotos()->max('orden') ?? 0;

        foreach ($fotosNuevas as $index => $foto) {
            $ruta = $foto->store('habitaciones', 'public');
            $habitacion->fotos()->create([
                'ruta' => $ruta,
                'orden' => $ordenActual + $index + 1,
            ]);
        }
    }



    /**
     * Formatea colección de habitaciones para el frontend
     */
    private static function formatear($habitaciones)
    {
        return $habitaciones->map(function ($habitacion) {
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
    }

    /**
     * Obtiene habitaciones disponibles, verificando estado y disponibilidad en fechas
     * Si se pasan fechas, excluye habitaciones con reservas en ese rango
     */
    public static function obtenerDisponibles(?string $checkIn = null, ?string $checkOut = null)
    {
        $habitaciones = Habitacion::with('fotos')->where('estado', 'disponible');

        if ($checkIn && $checkOut) {
            $habitaciones->whereDoesntHave('reservas', function ($query) use ($checkIn, $checkOut) {
                $query->where('check_in', '<', $checkOut)
                      ->where('check_out', '>', $checkIn);
            });
        }

        $habitaciones = $habitaciones->orderBy('numero')->get();

        return self::formatear($habitaciones);
    }
}
