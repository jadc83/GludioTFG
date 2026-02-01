<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreReservaRequest extends FormRequest
{
    public function messages(): array
    {
        return [
            'name.required' => 'El nombre es obligatorio.',
            'name.max' => 'El nombre no puede tener más de 255 caracteres.',
            'email.email' => 'El correo electrónico no es válido.',
            'email.max' => 'El correo electrónico no puede tener más de 255 caracteres.',
            'telefono.max' => 'El teléfono no puede tener más de 20 caracteres.',
            'numero_documento.max' => 'El número de documento no puede tener más de 100 caracteres.',
            'nacionalidad.max' => 'La nacionalidad no puede tener más de 100 caracteres.',
            'booked_by_user_id.exists' => 'El usuario seleccionado no es válido.',
            'check_in.required' => 'La fecha de check-in es obligatoria.',
            'check_in.date' => 'La fecha de check-in debe ser una fecha válida.',
            'check_in.after_or_equal' => 'La fecha de check-in no puede ser anterior a hoy.',
            'check_out.required' => 'La fecha de check-out es obligatoria.',
            'check_out.date' => 'La fecha de check-out debe ser una fecha válida.',
            'check_out.after' => 'La fecha de check-out debe ser posterior a la de check-in.',
            'habitaciones.required' => 'Debes seleccionar al menos una habitación.',
            'habitaciones.array' => 'Las habitaciones deben ser un array.',
            'habitaciones.min' => 'Debes seleccionar al menos una habitación.',
            'habitaciones.*.tipo.required' => 'El tipo de habitación es obligatorio.',
            'habitaciones.*.tipo.in' => 'El tipo de habitación seleccionado no es válido.',
            'habitaciones.*.cantidad.required' => 'La cantidad de habitaciones es obligatoria.',
            'habitaciones.*.cantidad.integer' => 'La cantidad debe ser un número entero.',
            'habitaciones.*.cantidad.min' => 'La cantidad debe ser al menos 1.',
        ];
    }

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
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'name' => ['required_without:reservable_id', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'numero_documento' => ['nullable', 'string', 'max:100'],
            'nacionalidad' => ['nullable', 'string', 'max:100'],
            'direccion' => ['nullable', 'string'],
            'booked_by_user_id' => ['nullable', 'integer', 'exists:users,id'],
            'habitaciones' => ['required', 'array', 'min:1'],
            'habitaciones.*.tipo' => ['required', 'string', 'in:doble,familiar,suite'],
            'habitaciones.*.cantidad' => ['required', 'integer', 'min:1'],
            'habitaciones.*.personas_por_habitacion' => ['nullable', 'integer', 'min:1'],
            'status' => ['nullable', 'string', 'in:pendiente,confirmado'],
        ];
    }
}
