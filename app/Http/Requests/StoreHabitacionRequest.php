<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreHabitacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero' => 'required|string|max:10|unique:habitaciones,numero',
            'tipo' => 'required|in:doble,suite,familiar',
            'precio_noche' => 'required|numeric|min:0|max:9999.99',
            'capacidad' => 'required|integer|min:1|max:10',
            'estado' => 'nullable|in:disponible,ocupada,mantenimiento,limpieza',
            'descripcion' => 'nullable|string|max:500',
            'notas' => 'nullable|string|max:500',
            'fotos' => 'nullable|array|max:4',
            'fotos.*' => 'image|mimes:jpg,jpeg,png,webp|max:2048',
        ];
    }

    public function messages(): array
    {
        return [
            'numero.required' => 'El número de habitación es obligatorio.',
            'numero.unique' => 'El número de habitación ya existe.',
            'tipo.required' => 'El tipo de habitación es obligatorio.',
            'tipo.in' => 'El tipo de habitación no es válido.',
            'precio_noche.required' => 'El precio por noche es obligatorio.',
            'precio_noche.numeric' => 'El precio debe ser un número.',
            'precio_noche.min' => 'El precio no puede ser negativo.',
            'capacidad.required' => 'La capacidad es obligatoria.',
            'capacidad.integer' => 'La capacidad debe ser un número entero.',
            'fotos.*. image' => 'Las fotos deben ser imágenes válidas.',
        ];
    }
}
