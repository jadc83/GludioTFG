<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReservaRequest extends FormRequest
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
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'status' => ['required', 'in:pendiente,confirmado,checked_in,checked_out,cancelado,no_presentado'],
            'pago' => ['required', 'in:pendiente,parcial,pagado,devuelto'],
            'habitacion_ids' => ['required', 'array', 'min:1'],
            'habitacion_ids.*' => ['exists:habitaciones,id'],
            'notas' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'check_in.required' => 'La fecha de check-in es obligatoria',
            'check_in.after_or_equal' => 'El check-in no puede ser anterior a hoy',
            'check_out.required' => 'La fecha de check-out es obligatoria',
            'check_out.after' => 'El check-out debe ser posterior al check-in',
            'status.required' => 'El estado de la reserva es obligatorio',
            'status.in' => 'El estado seleccionado no es válido',
            'pago.required' => 'El estado de pago es obligatorio',
            'pago.in' => 'El estado de pago seleccionado no es válido',
            'habitacion_ids.required' => 'Debes seleccionar al menos una habitación',
            'habitacion_ids.min' => 'Debes seleccionar al menos una habitación',
            'habitacion_ids.*.exists' => 'Una de las habitaciones seleccionadas no existe',
            'notas.max' => 'Las notas no pueden exceder 1000 caracteres',
        ];
    }
}
