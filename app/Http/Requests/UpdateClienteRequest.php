<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clienteId = $this->cliente->id ?? $this->route('cliente');

        return [
            'name' => 'sometimes|required|string|max:100|min:2',
            'email' => 'sometimes|nullable|email|max:100|unique:clientes,email,' . $clienteId,
            'telefono' => 'sometimes|nullable|string|max:20',
            'tipo_documento' => 'sometimes|required|in:dni,pasaporte,tie',
            'numero_documento' => 'sometimes|required|string|max:50|unique:clientes,numero_documento,' . $clienteId,
            'nacionalidad' => 'sometimes|nullable|string|max:100',
            'direccion' => 'sometimes|nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.min' => 'El nombre debe tener al menos 2 caracteres.',
            'email.unique' => 'El correo electrónico ya está registrado.',
            'email.email' => 'El correo electrónico no es válido.',
            'numero_documento.required' => 'El número de documento es obligatorio.',
            'numero_documento.unique' => 'El número de documento ya está registrado.',
        ];
    }
}
