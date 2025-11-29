<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHabitacionRequest extends FormRequest
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
    public function rules()
    {
        $id = $this->habitacion->id;

        return [
            'numero' => 'required|string|unique:habitaciones,numero,' . $id,
            'tipo' => 'required|in:doble,suite,familiar',
            'precio_noche' => 'required|numeric|min:0',
            'capacidad' => 'required|integer|min:1',
            'estado' => 'required|in:disponible,ocupada,mantenimiento,limpieza',
            'descripcion' => 'nullable|string',
            'notas' => 'nullable|string',
        ];
    }
}
