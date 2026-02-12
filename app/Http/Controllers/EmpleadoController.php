<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmpleadoRequest;
use App\Http\Requests\UpdateEmpleadoRequest;
use App\Models\Empleado;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;

class EmpleadoController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function create(Request $request)
    {
        return Inertia::render('Empleados/Create');
    }

    public function store(StoreEmpleadoRequest $request): RedirectResponse
{
    DB::transaction(function () use ($request) {

        //Preparar los datos del usuario
        $payload = $request->only([
            'name', 'email', 'tipo_documento', 'numero_documento',
            'nacionalidad', 'direccion', 'ciudad', 'codigo_postal', 'telefono'
        ]);

        //Rellenar los campos opcionales con cadenas vacías
        $opcionales = ['tipo_documento','nacionalidad','direccion','ciudad','codigo_postal','telefono'];

        foreach ($opcionales as $field) {
            $payload[$field] = $payload[$field] ?? '';
        }

        $password = $request->input('password', Str::random(24));
        $user = User::create([ ...$payload, 'password' => Hash::make($password) ]);

        if ($request->filled('role')) {
            $user->syncRoles([$request->role]);
        }

        $user->empleado()->create([ 'departamento_id' => $request->departamento_id ]);

        if (!$request->filled('password')) {
            Password::sendResetLink(['email' => $user->email]);
        }
    });

    return redirect()->route('empleados.index')->with('status', 'Empleado creado correctamente.');
}

    public function update(UpdateEmpleadoRequest $request, Empleado $empleado): Response|RedirectResponse
    {
        $user = $empleado->user;
        $user->update($request->only(['name','email','tipo_documento','numero_documento','nacionalidad','direccion','ciudad','codigo_postal','telefono']));

        if ($request->filled('role')) {
            $user->syncRoles([$request->role]);
        }

        $empleado->update($request->only(['departamento_id']));

        if (($request->ajax() || $request->wantsJson() || $request->header('X-Requested-With')) && ! $request->header('X-Inertia')) {
            return response()->json(['success' => true, 'empleado' => $empleado]);
        }

        if ($request->header('X-Inertia')) {
            return Inertia::location(route('panel', ['tab' => 'empleados']));
        }

        return redirect()->route('empleados.index')->with('status', 'Empleado actualizado correctamente.');
    }


    public function show(Empleado $empleado)
    {
        $empleado->load('user');
        return Inertia::render('Empleados/Show', [ 'empleado' => $empleado ]);
    }

    public function destroy(Request $request, Empleado $empleado): RedirectResponse
    {
        DB::transaction(function () use ($empleado) {
            $user = $empleado->user;
            $empleado->delete();

            if ($user) {
                $user->delete();
            }
        });

        return redirect()->route('empleados.index')->with('status', 'Empleado eliminado correctamente.');
    }
}
