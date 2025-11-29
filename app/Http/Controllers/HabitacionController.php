<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreHabitacionRequest;
use App\Http\Requests\UpdateHabitacionRequest;
use App\Models\Habitacion;
use Illuminate\Support\Facades\Storage;

class HabitacionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
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
    public function store(StoreHabitacionRequest $request)
    {
        $validado = $request->validated();

        $habitacion = new Habitacion();
        $habitacion->numero = $validado['numero'];
        $habitacion->tipo = $validado['tipo'];
        $habitacion->precio_noche = $validado['precio_noche'];
        $habitacion->capacidad = $validado['capacidad'];
        $habitacion->estado = $validado['estado'] ?? 'disponible';
        $habitacion->descripcion = $validado['descripcion'] ?? null;
        $habitacion->notas = $validado['notas'] ?? null;
        $habitacion->save();

        if ($request->hasFile('fotos')) {
            foreach ($request->file('fotos') as $orden => $foto) {
                $ruta = $foto->store('habitaciones', 'public');
                $habitacion->fotos()->create([
                    'ruta' => $ruta,
                    'orden' => $orden,
                ]);
            }
        }

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Habitación creada correctamente.');
        }

        return redirect()->route('habitaciones.index')->with('success', 'Habitación creada.');
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
        $validado = $request->validated();
        $habitacion->update($validado);

        $this->eliminarFotos($habitacion, $request->input('fotos_eliminar', []));
        $this->agregarFotos($habitacion, $request->file('fotos'));

        return $request->header('X-Inertia')
            ? redirect()->back()
            : redirect()->route('panel');
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
}
