<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CalcularPrecioRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    protected function prepareForValidation()
    {
        $data = $this->all();

        if (isset($data['habitaciones']) && is_array($data['habitaciones'])) {
            $map = [
                'double'  => 'doble',
                'dobles'  => 'doble',
                'doble'   => 'doble',
                'family'  => 'familiar',
                'familia' => 'familiar',
                'familiar'=> 'familiar',
                'suite'   => 'suite',
            ];

            foreach ($data['habitaciones'] as $i => $h) {
                if (isset($h['tipo'])) {
                    $tipo = mb_strtolower(trim($h['tipo']));
                    $data['habitaciones'][$i]['tipo'] = $map[$tipo] ?? $tipo;
                }
            }
        }

        if (isset($data['tarifas']) && is_array($data['tarifas'])) {
            $data['tarifas'] = array_map(function ($t) {
                return is_numeric($t) ? (int) $t : $t;
            }, $data['tarifas']);
        }

        $this->replace($data);
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
