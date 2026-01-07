<?php

namespace App\Services;

use App\Models\User;
use App\Models\Cliente;
use Illuminate\Database\Eloquent\Model;

/**
 * Servicio para operaciones relacionadas con usuarios y clientes
 * Centraliza lógica de identificación y transformación
 */
class UserService
{
    /**
     * Identifica si un registro es usuario o cliente
     */
    public static function identificarTipo($usuarioOCliente): string
    {
        if (is_array($usuarioOCliente)) {
            return isset($usuarioOCliente['email_verified_at']) ? 'usuario' : 'cliente';
        }

        return method_exists($usuarioOCliente, 'getAttribute') &&
               $usuarioOCliente->hasAttribute('email_verified_at')
            ? 'usuario'
            : 'cliente';
    }

    /**
     * Obtiene un usuario o cliente por ID y tipo
     */
    public static function obtenerPorId(int $id, string $tipo): ?Model
    {
        if ($tipo === 'usuario') {
            return User::find($id);
        } else {
            return Cliente::find($id);
        }
    }

    /**
     * Transforma un usuario o cliente a formato estándar
     */
    public static function normalizarDatos($registro): array
    {
        if (is_array($registro)) {
            $tipo = self::identificarTipo($registro);
        } else {
            $tipo = self::identificarTipo($registro);
            $registro = $registro->toArray();
        }

        return array_merge(
            [
                'id' => $registro['id'] ?? null,
                'tipo_usuario' => $tipo,
                'name' => $registro['name'] ?? '',
                'email' => $registro['email'] ?? '',
                'telefono' => $registro['telefono'] ?? null,
                'tipo_documento' => $registro['tipo_documento'] ?? null,
                'numero_documento' => $registro['numero_documento'] ?? null,
                'nacionalidad' => $registro['nacionalidad'] ?? null,
                'direccion' => $registro['direccion'] ?? null,
            ],
            $tipo === 'usuario' ? ['email_verified_at' => $registro['email_verified_at'] ?? null] : []
        );
    }

    /**
     * Busca un usuario o cliente por email o documento
     */
    public static function buscarPorEmailODocumento(?string $email, ?string $numeroDocumento): ?Model
    {
        if ($email) {
            $usuario = User::where('email', $email)->first();
            if ($usuario) {
                return $usuario;
            }
        }

        if ($numeroDocumento) {
            $cliente = Cliente::where('numero_documento', $numeroDocumento)->first();
            if ($cliente) {
                return $cliente;
            }
        }

        return null;
    }

    /**
     * Obtiene opciones disponibles de tipos de documento
     */
    public static function obtenerTiposDocumento(): array
    {
        return [
            'dni' => 'DNI',
            'nie' => 'NIE',
            'pasaporte' => 'Pasaporte',
            'tie' => 'TIE'
        ];
    }

    /**
     * Valida que el documento sea válido para su tipo
     */
    public static function validarDocumento(string $tipo, string $numero): bool
    {
        $numero = str_replace(['-', '.', ' '], '', $numero);

        return match ($tipo) {
            'dni' => preg_match('/^\d{8}[A-Z]$/', $numero),
            'nie' => preg_match('/^[XYZ]\d{7}[A-Z]$/', $numero),
            'pasaporte' => strlen($numero) >= 6,
            'tie' => strlen($numero) >= 5,
            default => false,
        };
    }
}
