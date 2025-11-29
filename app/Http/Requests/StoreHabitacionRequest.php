<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHabitacionRequest extends FormRequest
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
            'numero' => 'required|string|unique:habitaciones,numero',
            'tipo' => 'required|in:doble,suite,familiar',
            'precio_noche' => 'required|numeric|min:0',
            'capacidad' => 'required|integer|min:1',
            'estado' => 'nullable|in:disponible,ocupada,mantenimiento,limpieza',
            'descripcion' => 'nullable|string',
            'notas' => 'nullable|string',
            'fotos' => 'nullable|array|max:4',
            'fotos.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }
}
