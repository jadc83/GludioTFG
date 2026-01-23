<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->user->id ?? $this->route('user');

        return [
            'name' => 'required|string|max:255|min:2',
            'email' => 'required|string|email|max:255|unique:users,email,' . $userId,
            'telefono' => 'nullable|string|max:20',
            'tipo_documento' => 'nullable|string|in:dni,pasaporte,tie',
            'numero_documento' => 'nullable|string|max:50|unique:users,numero_documento,' . $userId,
            'nacionalidad' => 'nullable|string|max:100',
            'direccion' => 'nullable|string|max:500',
            'ciudad' => 'nullable|string|max:100',
            'codigo_postal' => 'nullable|string|max:20',
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.min' => 'El nombre debe tener al menos 2 caracteres.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.unique' => 'El correo electrónico ya está registrado.',
            'email.email' => 'El correo electrónico no es válido.',
            'numero_documento.unique' => 'El número de documento ya está registrado.',
            'tipo_documento.in' => 'El tipo de documento no es válido.',
        ];
    }
}
