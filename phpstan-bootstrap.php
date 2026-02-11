<?php

// Bootstrap ligero para PHPStan: carga autoload y declara aliases/stubs
require __DIR__ . '/vendor/autoload.php';

// Declarar clases globales usadas como aliases en Laravel (config/app.php)
if (!class_exists('Log')) {
    class Log extends \Illuminate\Support\Facades\Log {}
}

if (!class_exists('Notification')) {
    class Notification extends \Illuminate\Support\Facades\Notification {}
}

// También declarar un alias global para Mail si se usa sin import
if (!class_exists('Mail')) {
    class Mail extends \Illuminate\Support\Facades\Mail {}
}

// Evitar side-effects: no se inicializa la app completa.

// Stubs para middlewares de App/Http que pueden faltar en el repo
if (!class_exists('App\\Http\\Middleware\\EncryptCookies')) {
    eval(<<<'PHP'
namespace App\Http\Middleware;
class EncryptCookies extends \Illuminate\Cookie\Middleware\EncryptCookies {}
PHP
    );
}

if (!class_exists('App\\Http\\Middleware\\Authenticate')) {
    eval(<<<'PHP'
namespace App\Http\Middleware;
class Authenticate extends \Illuminate\Auth\Middleware\Authenticate {}
PHP
    );
}

if (!class_exists('App\\Http\\Middleware\\RedirectIfAuthenticated')) {
    eval(<<<'PHP'
namespace App\Http\Middleware;
class RedirectIfAuthenticated extends \Illuminate\Auth\Middleware\RedirectIfAuthenticated {}
PHP
    );
}

// Stubs para middlewares de Spatie\Permission cuando el paquete no está instalado
if (!class_exists('Spatie\\Permission\\Middlewares\\RoleMiddleware')) {
    eval(<<<'PHP'
namespace Spatie\Permission\Middlewares;
class RoleMiddleware {}
PHP
    );
}

if (!class_exists('Spatie\\Permission\\Middlewares\\PermissionMiddleware')) {
    eval(<<<'PHP'
namespace Spatie\Permission\Middlewares;
class PermissionMiddleware {}
PHP
    );
}

if (!class_exists('Spatie\\Permission\\Middlewares\\RoleOrPermissionMiddleware')) {
    eval(<<<'PHP'
namespace Spatie\Permission\Middlewares;
class RoleOrPermissionMiddleware {}
PHP
    );
}
