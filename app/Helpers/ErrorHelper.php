<?php

namespace App\Helpers;

class ErrorHelper
{
    /**
     * Convierte errores en mensajes amigables para el usuario
     */
    public static function obtenerMensajeAmigable(\Exception $e): string
    {
        $mensaje = $e->getMessage();

        // Validar errores de unicidad
        if (str_contains($mensaje, 'llave duplicada') || str_contains($mensaje, 'UNIQUE')) {
            if (str_contains($mensaje, 'email')) {
                return 'El correo electrónico ya está registrado en el sistema.';
            }
            if (str_contains($mensaje, 'numero_documento')) {
                return 'El número de documento ya está registrado en el sistema.';
            }
            return 'Los datos ingresados ya existen en el sistema.';
        }

        // Errores de validación personalizados
        if (str_contains($mensaje, 'no coinciden')) {
            return 'Los datos proporcionados no coinciden con nuestros registros.';
        }

        // Errores de base de datos
        if (str_contains($mensaje, 'violates foreign key')) {
            return 'Hay un problema con los datos relacionados. Por favor, intenta de nuevo.';
        }

        // Error genérico
        return 'Ocurrió un error al procesar tu solicitud. Por favor, intenta nuevamente.';
    }
}
