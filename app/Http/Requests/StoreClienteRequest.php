<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreClienteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => 'required|string|max:100',
            'email' => 'required|email|max:100|unique:clientes,email',
            'telefono' => 'required|string|max:20',
            'tipo_documento' => 'required|in:dni,pasaporte,tie',
            'numero_documento' => 'required|string|max:50|unique:clientes,numero_documento',
            'nacionalidad' => 'required|string|max:100',
            'direccion' => 'required|string',
        ];
    }
}
