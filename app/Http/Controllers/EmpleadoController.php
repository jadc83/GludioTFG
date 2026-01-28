<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmpleadoRequest;
use App\Models\Empleado;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class EmpleadoController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function create(Request $request)
    {
        // If Inertia is available, render an Inertia page; otherwise use Blade view
        if (class_exists(\Inertia\Inertia::class)) {
            return \Inertia\Inertia::render('Empleados/Create');
        }

        return view('empleados.create');
    }

    public function store(StoreEmpleadoRequest $request): RedirectResponse
    {
        DB::transaction(function() use ($request) {
            $password = $request->filled('password') ? $request->password : Str::random(24);

            $user = User::create(array_merge(
                $request->only(['name','email','tipo_documento','numero_documento','nacionalidad','direccion','ciudad','codigo_postal','telefono']),
                ['password' => Hash::make($password)]
            ));

            Empleado::create([
                'user_id' => $user->id,
                'numero_empleado' => $request->numero_empleado,
                'departamento' => $request->departamento,
                'puesto' => $request->puesto,
            ]);

            if (!$request->filled('password')) {
                // Send password reset link so the empleado can set their password
                Password::sendResetLink(['email' => $user->email]);
            }
        });

        return redirect()->route('empleados.index')->with('status', 'Empleado creado correctamente.');
    }

    /**
     * Actualiza un empleado existente (usuario y datos del empleado).
     */
    public function update(Request $request, Empleado $empleado): RedirectResponse
    {
        $user = $empleado->user;

        $request->validate([
            'name' => ['required','string','max:255'],
            'email' => ['required','email','max:255', "unique:users,email,{$user->id}"],

            // Campos de empleado
            'numero_empleado' => ['required','string','max:50', "unique:empleados,numero_empleado,{$empleado->id}"],
            'departamento' => ['nullable','string','max:255'],
            'puesto' => ['nullable','string','max:255'],

            // Campos adicionales del usuario
            'tipo_documento' => ['nullable','string','max:20'],
            'numero_documento' => ['nullable','string','max:255'],
            'nacionalidad' => ['nullable','string','max:255'],
            'direccion' => ['nullable','string','max:1000'],
            'ciudad' => ['nullable','string','max:255'],
            'codigo_postal' => ['nullable','string','max:20'],
            'telefono' => ['nullable','string','max:50'],
        ]);

        // Actualizamos usuario
        $user->update($request->only(['name','email','tipo_documento','numero_documento','nacionalidad','direccion','ciudad','codigo_postal','telefono']));

        // Actualizamos empleado
        $empleado->update($request->only(['numero_empleado','departamento','puesto']));

        return redirect()->route('empleados.index')->with('status', 'Empleado actualizado correctamente.');
    }
}
