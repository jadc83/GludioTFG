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
}
