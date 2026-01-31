<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHabitacionRequest;
use App\Http\Requests\UpdateHabitacionRequest;
use App\Models\Habitacion;
use App\Models\TipoHabitacion;
use App\Services\PrecioService;
use Carbon\Carbon;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Http\Request;

class HabitacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $habitaciones = Habitacion::with(['fotos'])
            ->buscar($request->busqueda)
            ->estado($request->estado)
            ->tipo($request->tipo)
            ->capacidad($request->capacidad)
            ->precioMin($request->precio_min)
            ->precioMax($request->precio_max)
            ->orderBy('numero')
            ->get();

        if ($request->wantsJson()) {
            return response()->json(self::formatear($habitaciones));
        }

        return [
            'habitaciones' => self::formatear($habitaciones)
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
            return redirect()->route('panel')->with('success', 'Habitación creada.');
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
    private static function formatear($habitaciones, $preciosPorTipo = [])
    {
        // Obtener precios de tipos en un único lote para evitar consultas N+1
        $slugs = $habitaciones->pluck('tipo')->unique()->filter()->values()->all();
        $tiposMap = TipoHabitacion::whereIn('slug', $slugs)->get()->keyBy('slug');

        return $habitaciones->map(function ($habitacion) use ($tiposMap, $preciosPorTipo) {
            $tipoModelo = $tiposMap->get($habitacion->tipo);
            $precioTipo = $tipoModelo ? (float) $tipoModelo->precio_base : null;
            $precioEntre = null;
            $precioEntreNoche = null;
            if (isset($preciosPorTipo[$habitacion->tipo]) && is_array($preciosPorTipo[$habitacion->tipo])) {
                $precioEntre = (float)($preciosPorTipo[$habitacion->tipo]['total'] ?? null);
                $precioEntreNoche = isset($preciosPorTipo[$habitacion->tipo]['por_noche']) ? (float)$preciosPorTipo[$habitacion->tipo]['por_noche'] : null;
            }

            return [
                'id' => $habitacion->id,
                'numero' => $habitacion->numero,
                'tipo' => $habitacion->tipo,
                'capacidad' => $habitacion->capacidad,
                'estado' => $habitacion->estado,
                'descripcion' => $habitacion->descripcion,
                'notas' => $habitacion->notas,
                'precioTipo' => $precioTipo,
                'precioEntreFechas' => $precioEntre,
                'precioEntreNoche' => $precioEntreNoche,
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
    public static function getDisponibles(?string $checkIn = null, ?string $checkOut = null)
    {
        $habitaciones = Habitacion::with('fotos')->where('estado', 'disponible');

        if ($checkIn && $checkOut) {
            $habitaciones->whereDoesntHave('reservas', function ($query) use ($checkIn, $checkOut) {
                $query->where('check_in', '<', $checkOut)->where('check_out', '>', $checkIn);});
        }

        $habitaciones = $habitaciones->orderBy('numero')->get();

        // Si se pasan fechas, calcular precio entre fechas por tipo y añadirlo
        $preciosPorTipo = [];
        if ($checkIn && $checkOut) {
            try {
                $serv = new PrecioService();
                $slugs = $habitaciones->pluck('tipo')->unique()->filter()->values()->all();
                $noches = Carbon::createFromFormat('Y-m-d', $checkIn)->diffInDays(Carbon::createFromFormat('Y-m-d', $checkOut));
                foreach ($slugs as $slug) {
                    try {
                        $precioTotal = $serv->precioEntreFechas($slug, Carbon::createFromFormat('Y-m-d', $checkIn), Carbon::createFromFormat('Y-m-d', $checkOut));
                        $preciosPorTipo[$slug] = [
                            'total' => $precioTotal,
                            'por_noche' => $noches > 0 ? round($precioTotal / $noches, 2) : null,
                            'noches' => $noches,
                        ];
                    } catch (\Exception $e) {
                        $preciosPorTipo[$slug] = null;
                    }
                }
            } catch (\Exception $e) {
                $preciosPorTipo = [];
            }
        }

        return self::formatear($habitaciones, $preciosPorTipo);
    }
}
