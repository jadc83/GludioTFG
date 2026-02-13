<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClienteRequest;
use App\Http\Requests\UpdateClienteRequest;
use App\Models\Cliente;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClienteController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $this->denegarAccesoLimpiezaYMantenimiento();
        $clientes = Cliente::buscar($request->busqueda)
            ->tipoDocumento($request->tipo_documento)
            ->orderBy('name')
            ->get();

        $clientes->each(function($cliente) {
            $cliente->tipo_usuario = 'cliente';
        });

        // Obtener también los users
        $users = User::buscar($request->busqueda)
            ->tipoDocumento($request->tipo_documento)
            ->orderBy('name')
            ->get();

        $users->each(function($user) {
            $user->tipo_usuario = 'user';
        });

        // Combinar ambas colecciones
        $todosLosClientes = $clientes->concat($users);

        if ($request->wantsJson()) {
            return response()->json($todosLosClientes);
        }

        return [
            'clientes' => $todosLosClientes
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
        $this->denegarAccesoLimpiezaYMantenimiento();
        $validado = $request->validated();
        $cliente = Cliente::create($validado);
        $cliente->save();

        return redirect()->route('panel');

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
        $this->denegarAccesoLimpiezaYMantenimiento();
        $validado = $request->validated();

        // actualización recibida

        $cliente->update($validado);

        // Devolver JSON solo para peticiones API/JSON puras. No devolver JSON para peticiones Inertia
        // (Inertia espera una respuesta con cabeceras especiales). Si es Inertia, mantener la redirección.
        // Return JSON only for pure AJAX/JSON requests (not Inertia visits)
        if (($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With')) && ! $request->header('X-Inertia')) {
            return response()->json(['success' => true, 'cliente' => $cliente]);
        }

        // If the request is an Inertia request, redirect to the panel with the clientes tab
        if ($request->header('X-Inertia')) {
            return Inertia::location(route('panel', ['tab' => 'clientes']));
        }

        return redirect()->route('panel');

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
        $this->denegarAccesoLimpiezaYMantenimiento();
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

        $usuarios = $buscarEn(User::class)->map(fn($usuario) => array_merge(
            $usuario->toArray(),
            ['tipo_usuario' => 'usuario', 'nombre_completo' => $usuario->name . ' ⭐']
        ));

        $clientes = $buscarEn(Cliente::class)->map(fn($c) => array_merge(
            $c->toArray(),
            ['tipo_usuario' => 'cliente', 'nombre_completo' => $c->name]
        ));

        return response()->json($usuarios->concat($clientes)->take(10));
    }


}
