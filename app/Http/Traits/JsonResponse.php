<?php

namespace App\Http\Traits;

trait JsonResponse
{
    /**
     * Respuesta JSON exitosa estandarizada
     *
     * @param array $data Datos a devolver
     * @param int $status Código HTTP (default: 200)
     * @param string|null $message Mensaje opcional
     * @return \Illuminate\Http\JsonResponse
     */
    protected function success(array $data = [], int $status = 200, ?string $message = null)
    {
        return response()->json(array_merge(
            ['success' => true],
            $message ? ['message' => $message] : [],
            $data
        ), $status);
    }

    /**
     * Respuesta JSON de error estandarizada
     *
     * @param string $message Mensaje de error
     * @param int $status Código HTTP (default: 400)
     * @param array $extra Datos adicionales opcionales
     * @return \Illuminate\Http\JsonResponse
     */
    protected function error(string $message, int $status = 400, array $extra = [])
    {
        return response()->json(array_merge(
            ['success' => false, 'error' => $message],
            $extra
        ), $status);
    }

}
