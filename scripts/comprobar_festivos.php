<?php

require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Carbon\Carbon;

$service = app(\App\Services\PrecioService::class);
$refl = new ReflectionMethod($service, 'esFestivo');
$refl->setAccessible(true);

$fechas = [
    '2026-01-01', // Año Nuevo (fijo)
    '2026-04-05', // Domingo de Pascua (festivo móvil en 2026)
    '2026-04-03', // Viernes Santo 2026 (festivo móvil)
    '2026-02-02', // No festivo
];

foreach ($fechas as $f) {
    $c = Carbon::parse($f);
    $es = $refl->invoke($service, $c);
    echo "{$f} => " . ($es ? 'FESTIVO' : 'NO') . PHP_EOL;
}
