<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEmpleadoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'name' => ['required','string','max:255'],
            'email' => ['required','email','max:255','unique:users,email'],
            'password' => ['nullable','string','min:8','confirmed'],

            // Campos de empleado
            'numero_empleado' => ['required','string','max:50','unique:empleados,numero_empleado'],
            'departamento' => ['nullable','string','max:255'],
            'puesto' => ['nullable','string','max:255'],

            // Campos adicionales del usuario para evitar violaciones NOT NULL en la tabla users
            'tipo_documento' => ['nullable','string','max:20'],
            'numero_documento' => ['nullable','string','max:255'],
            'nacionalidad' => ['nullable','string','max:255'],
            'direccion' => ['nullable','string','max:1000'],
            'ciudad' => ['nullable','string','max:255'],
            'codigo_postal' => ['nullable','string','max:20'],
            'telefono' => ['nullable','string','max:50'],
        ];
    }
}
