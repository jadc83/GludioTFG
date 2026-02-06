<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEmpleadoRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $empleado = $this->route('empleado');

        $userId = null;
        $empleadoId = null;

        if ($empleado) {
            $empleadoId = $empleado->id ?? null;
            $user = $empleado->user ?? null;
            $userId = $user->id ?? null;
        }

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],

            // Campos de empleado
            // numero_empleado removed - not required anymore
            // departamento ahora referenciado por id
            'departamento_id' => ['nullable','integer','exists:departamentos,id'],
            'puesto' => ['nullable', 'string', 'max:255'],

            // Campos adicionales del usuario
            'tipo_documento' => ['nullable', 'string', 'max:20'],
            'numero_documento' => ['nullable', 'string', 'max:255'],
            'nacionalidad' => ['nullable', 'string', 'max:255'],
            'direccion' => ['nullable', 'string', 'max:1000'],
            'ciudad' => ['nullable', 'string', 'max:255'],
            'codigo_postal' => ['nullable', 'string', 'max:20'],
            'telefono' => ['nullable', 'string', 'max:50'],
            // bloquear asignación de roles reservados (admin,user)
            'role' => ['nullable','string','exists:roles,name','not_in:admin,user'],
        ];
    }
}
