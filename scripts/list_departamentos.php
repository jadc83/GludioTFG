<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Departamento;
use Illuminate\Support\Facades\DB;

$deps = Departamento::orderBy('name')->get();
$out = [];
foreach ($deps as $d) {
    $count = DB::table('empleados')->where('departamento_id', $d->id)->count();
    $out[] = ['id' => $d->id, 'name' => $d->name, 'count' => $count];
}

echo json_encode($out, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE) . PHP_EOL;
