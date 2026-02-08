<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateReservaRequest extends FormRequest
{
    /* Determine if the user is authorized to make this request */
    public function authorize(): bool
    {
        return true;
    }

    /* Get the validation rules that apply to the request */
    public function rules(): array
    {
        return [
            'check_in' => ['required', 'date', 'after_or_equal:today'],
            'check_out' => ['required', 'date', 'after:check_in'],
            'status' => ['required', 'in:pendiente,confirmado,checked_in,checked_out,cancelado,no_presentado,reembolso_parcial_pendiente,reembolso_total_pendiente,reembolso_parcial_confirmado'],
            'pago' => ['required', 'in:pendiente,parcial,pagado,devuelto'],
            // Las habitaciones son optativas para ediciones de fechas (se asignan en check-in)
            'habitacion_ids' => ['sometimes', 'array'],
            'habitacion_ids.*' => ['integer', 'exists:habitaciones,id'],
            'notas' => ['nullable', 'string', 'max:1000'],
            'motivo' => ['nullable', 'string', 'max:500'],
            // Permitir que el frontend incluya un payment_intent_id al actualizar la reserva
            'payment_intent_id' => ['nullable', 'string'],
            // monto del pago enviado desde frontend (opcional)
            'pago_monto' => ['nullable', 'numeric'],
        ];
    }

    public function messages(): array
    {
        return [
            'check_in.required' => 'La fecha de check-in es obligatoria',
            'check_in.date' => 'La fecha de check-in debe ser válida',
            'check_in.after_or_equal' => 'El check-in no puede ser anterior a hoy',
            'check_out.required' => 'La fecha de check-out es obligatoria',
            'check_out.date' => 'La fecha de check-out debe ser válida',
            'check_out.after' => 'El check-out debe ser posterior al check-in',
            'status.required' => 'El estado de la reserva es obligatorio',
            'status.in' => 'El estado seleccionado no es válido',
            'pago.required' => 'El estado de pago es obligatorio',
            'pago.in' => 'El estado de pago seleccionado no es válido',
            'habitacion_ids.array' => 'Las habitaciones deben ser un array',
            'habitacion_ids.*.integer' => 'Cada ID de habitación debe ser un número entero',
            'habitacion_ids.*.exists' => 'Una de las habitaciones seleccionadas no existe',
            'notas.max' => 'Las notas no pueden exceder 1000 caracteres',
            'motivo.max' => 'El motivo no puede exceder 500 caracteres',
        ];
    }
}
