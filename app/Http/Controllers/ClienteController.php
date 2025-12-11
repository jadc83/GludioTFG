<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClienteRequest;
use App\Http\Requests\UpdateClienteRequest;
use App\Models\Cliente;
use App\Models\User;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $consulta = Cliente::query();
        if ($request->filled('tipo_documento') && $request->tipo_documento !== 'todos') {
            $consulta->where('tipo_documento', $request->tipo_documento);
        }

        if ($request->filled('busqueda')) {
            $busqueda = $request->busqueda;
            $consulta->where(function($query) use ($busqueda) {
                $query->where('name', 'ILIKE', "%{$busqueda}%")
                  ->orWhere('email', 'ILIKE', "%{$busqueda}%")
                  ->orWhere('numero_documento', 'ILIKE', "%{$busqueda}%")
                  ->orWhere('telefono', 'ILIKE', "%{$busqueda}%");
            });
        }

        $clientes = $consulta->orderBy('name')->get();

        $clientes->each(function($cliente) {
            $cliente->tipo_usuario = 'cliente';
        });

        if ($request->wantsJson()) {
            return response()->json($clientes);
        }

        return [
            'clientes' => $clientes,
            'estadisticas' => [
                'dni' => Cliente::where('tipo_documento', 'dni')->count(),
                'pasaporte' => Cliente::where('tipo_documento', 'pasaporte')->count(),
                'tie' => Cliente::where('tipo_documento', 'tie')->count(),
                'total' => Cliente::count(),
            ]
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
    public function store(StoreClienteRequest $request)
    {
        $validado = $request->validated();
        $cliente = Cliente::create($validado);
        $cliente->save();

        return redirect()->back();

    }

    /**
     * Display the specified resource.
     */
    public function show(Cliente $cliente)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Cliente $cliente)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateClienteRequest $request, Cliente $cliente)
    {
        $validado = $request->validated();
        $cliente->update($validado);

        return redirect()->back();

    }


    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Cliente $cliente)
    {
        //
    }

    public function buscar(Request $request)
    {
        $query = $request->get('query');

        if (strlen($query) < 1) {
            return response()->json([]);
        }

        $campos = ['id', 'name', 'email', 'numero_documento', 'telefono', 'nacionalidad', 'direccion', 'tipo_documento'];

        $buscarEn = function($modelo) use ($query, $campos) {

            return $modelo::where(function($q) use ($query) {
                $q->where('name', 'ILIKE', "%{$query}%")
                  ->orWhere('numero_documento', 'ILIKE', "%{$query}%")
                  ->orWhere('email', 'ILIKE', "%{$query}%")
                  ->orWhere('telefono', 'ILIKE', "%{$query}%");
            })->select($campos)->limit(5)->get();
        };

        $usuarios = $buscarEn(User::class)->map(fn($u) => array_merge(
            $u->toArray(),
            ['tipo_usuario' => 'usuario', 'nombre_completo' => $u->name . ' ⭐']
        ));

        $clientes = $buscarEn(Cliente::class)->map(fn($c) => array_merge(
            $c->toArray(),
            ['tipo_usuario' => 'cliente', 'nombre_completo' => $c->name]
        ));

        return response()->json($usuarios->concat($clientes)->take(10));
    }


}
