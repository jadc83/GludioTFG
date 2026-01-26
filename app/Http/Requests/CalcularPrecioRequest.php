<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalcularPrecioRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'check_in' => 'required|date_format:Y-m-d',
            'check_out' => 'required|date_format:Y-m-d|after:check_in',
            'habitaciones' => 'required|array|min:1',
            'habitaciones.*.tipo' => 'required|string|in:doble,familiar,suite',
            'habitaciones.*.cantidad' => 'required|integer|min:1',
            'tarifas' => 'sometimes|array',
            'tarifas.*' => 'integer|exists:tarifas,id',
        ];
    }
}
