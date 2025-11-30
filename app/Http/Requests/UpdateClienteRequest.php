<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateClienteRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
public function rules(): array
{
    return [
        'name' => 'sometimes|required|string|max:100',
        'email' => 'sometimes|required|email|max:100|unique:clientes,email,' . $this->cliente->id,
        'telefono' => 'sometimes|required|string|max:20',
        'tipo_documento' => 'sometimes|required|in:dni,pasaporte,tie',
        'numero_documento' => 'sometimes|required|string|max:50|unique:clientes,numero_documento,' . $this->cliente->id,
        'nacionalidad' => 'sometimes|required|string|max:100',
        'direccion' => 'sometimes|required|string',
    ];
}

}
