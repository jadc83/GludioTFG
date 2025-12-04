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
            'tipo_documento' => 'nullable|string|in:dni,pasaporte,tie', // ← Agregar esto
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
}
