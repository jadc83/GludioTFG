<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'telefono' => 'nullable|string|max:20',
            'tipo_documento' => 'nullable|string|in:dni,pasaporte,tie',
            'numero_documento' => 'nullable|string|max:50|unique:users',
            'nacionalidad' => 'nullable|string|max:100',
            'direccion' => 'nullable|string|max:500',
        ]);

        User::create($validated);

        return redirect()->route('panel')->with('success', 'Usuario creado correctamente');
    }

    public function update(Request $request, User $user)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
            'telefono' => 'nullable|string|max:20',
            'tipo_documento' => 'nullable|string|max:50',
            'numero_documento' => 'nullable|string|max:50',
            'nacionalidad' => 'nullable|string|max:100',
            'direccion' => 'nullable|string|max:500',
        ]);

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
