<?php

namespace App\Http\Controllers;

use App\Actions\Habitaciones\GetDisponiblesAction;
use App\Http\Requests\StoreHabitacionRequest;
use App\Http\Requests\UpdateHabitacionRequest;
use App\Models\Habitacion;
use App\Models\TipoHabitacion;
use App\Models\HabitacionReserva;
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

        $action = app(\App\Actions\Habitaciones\FormatHabitacionesAction::class);
        $formatted = $action->handle($habitaciones);

        if ($request->wantsJson()) {
            return response()->json($formatted);
        }

        return [ 'habitaciones' => $formatted ];
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
                    $habitacion->fotos()->create([ 'ruta' => $ruta, 'orden' => $orden ]);
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



    public static function getDisponibles(?string $checkIn = null, ?string $checkOut = null)
    {
        $action = app(GetDisponiblesAction::class);
        return $action->handle($checkIn, $checkOut);
    }
}
