<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ModificarEstanciaRequest extends FormRequest
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
            'pago_id' => 'sometimes|integer|exists:pagos,id',
        ];
    }
}
