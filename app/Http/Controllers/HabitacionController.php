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
        $this->denegarAccesoLimpiezaYMantenimiento();
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
        $this->denegarAccesoLimpiezaYMantenimiento();
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
        $this->denegarAccesoLimpiezaYMantenimiento();
        try {
            return DB::transaction(function () use ($request, $habitacion) {
                $validado = $request->validated();
                $habitacion->update($validado);

                $this->eliminarFotos($habitacion, $request->input('fotos_eliminar', []));
                $this->agregarFotos($habitacion, $request->file('fotos'));

                // Refresh the model to ensure latest state
                $habitacion->refresh();

                // Broadcast update to connected clients so UI can refresh in real-time
                try {
                    event(new \App\Events\HabitacionUpdated($habitacion));
                } catch (\Throwable $e) {
                    Log::error('Failed to broadcast HabitacionUpdated', ['error' => $e->getMessage()]);
                }

                // 1) Pure AJAX / API callers (no Inertia): return JSON
                $isAjax = $request->ajax() || $request->wantsJson();
                $isInertia = $request->header('X-Inertia') !== null;

                if ($isAjax && ! $isInertia) {
                    return response()->json(['success' => true, 'habitacion' => $habitacion]);
                }

                // 2) Inertia visits: instruct the client to perform a location visit
                //    including a query param so the `Panel` can open the correct drawer.
                if ($isInertia) {
                    // Force an absolute URL so the client performs a full location visit
                    return \Inertia\Inertia::location(route('panel', ['tab' => 'habitaciones', 'edited' => $habitacion->id], true));
                }

                // 3) Classic HTML form submit: regular redirect with flash message
                // Use an absolute URL to avoid relative-path issues under Apache
                return redirect()->to(route('panel', ['tab' => 'habitaciones'], true))->with('success', 'Habitación actualizada.');
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
        $this->denegarAccesoLimpiezaYMantenimiento();
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
