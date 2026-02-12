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
        try {
            return DB::transaction(function () use ($request, $habitacion) {
                $validado = $request->validated();
                $habitacion->update($validado);

                $this->eliminarFotos($habitacion, $request->input('fotos_eliminar', []));
                $this->agregarFotos($habitacion, $request->file('fotos'));

                // Only return plain JSON for pure AJAX/JSON requests (not Inertia visits)
                if (($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With')) && ! $request->header('X-Inertia')) {
                        // Refresh the model to ensure latest state
                        $habitacion->refresh();
                        // Broadcast update to connected clients so UI can refresh in real-time
                        try {
                            event(new \App\Events\HabitacionUpdated($habitacion));
                        } catch (\Throwable $e) {
                            Log::error('Failed to broadcast HabitacionUpdated', ['error' => $e->getMessage()]);
                        }
                        return response()->json(['success' => true, 'habitacion' => $habitacion]);
                }

                // If this is an Inertia request, respond with an Inertia-compatible
                // redirect so the client does not receive plain JSON.
                if ($request->header('X-Inertia')) {
                    return \Inertia\Inertia::location(route('panel', ['tab' => 'habitaciones']));
                }

                return redirect()->route('panel');
            });
        } catch (\Throwable $e) {
            Log::error('HabitacionController::update exception', ['message' => $e->getMessage(), 'trace' => $e->getTraceAsString()]);

            if ($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With')) {
                $code = $e->getCode() ?: 500;
                $msg = $e->getMessage() ?: 'Error al actualizar habitación. Revisa los logs.';
                return response()->json(['error' => $msg], $code);
            }

            return redirect()->back()->with('error', 'Error al actualizar habitación. Revisa los logs.');
        }
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
