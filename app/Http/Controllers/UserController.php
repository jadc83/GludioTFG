<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function store(StoreUserRequest $request)
    {
        $validated = $request->validated();
        User::create($validated);
        return redirect()->route('panel')->with('success', 'Usuario creado correctamente');
    }

    public function update(UpdateUserRequest $request, User $user)
    {
        $validated = $request->validated();
        $user->update($validated);
        return redirect()->route('panel')->with('success', 'Usuario actualizado correctamente');
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $consulta = User::query();

        if ($request->filled('tipo_documento') && $request->tipo_documento !== 'todos') {
            $consulta->where('tipo_documento', $request->tipo_documento);
        }

        if ($request->filled('busqueda')) {
            $busqueda = '%' . $request->busqueda . '%';

            $consulta->where(function ($q) use ($busqueda) {
                $q->where('name', 'ILIKE', $busqueda)
                    ->orWhere('email', 'ILIKE', $busqueda)
                    ->orWhere('numero_documento', 'ILIKE', $busqueda)
                    ->orWhere('telefono', 'ILIKE', $busqueda);
            });
        }

        $usuarios = $consulta->orderBy('name')->get();

        $usuarios->each(function ($usuario) {
            $usuario->tipo_usuario = 'usuario';
        });

        if ($request->wantsJson()) {
            return response()->json($usuarios);
        }

        return ['usuarios' => $usuarios];
    }
}
