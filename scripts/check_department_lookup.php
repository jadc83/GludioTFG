<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Empleado;
use App\Models\Departamento;

$e = Empleado::with('user')->first();
if (!$e) { echo "No empleado\n"; exit; }

echo "Empleado id={$e->id} user_id={$e->user_id} departamento_id={$e->departamento_id}\n";
$dep = Departamento::find($e->departamento_id);
if ($dep) {
    echo "Departamento lookup: ".json_encode($dep->toArray(), JSON_UNESCAPED_UNICODE) . "\n";
} else {
    echo "Departamento lookup: NOT FOUND\n";
}

try {
    $rel = $e->departamento();
    $relObj = $e->departamento;
    echo "Relation method class: ".get_class($rel)."\n";
    if ($relObj) echo "Relation property: ".json_encode($relObj->toArray(), JSON_UNESCAPED_UNICODE)."\n";
    else echo "Relation property: NULL\n";
} catch (Throwable $ex) {
    echo "Error accessing relation: " . $ex->getMessage() . "\n";
}
