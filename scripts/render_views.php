<?php
// Render Blade views to static HTML files for validation.
// Usage: php scripts/render_views.php

require __DIR__ . '/../vendor/autoload.php';

// Bootstrap the app
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Directory for output
$outDir = __DIR__ . '/../storage/html-validate';
if (!is_dir($outDir)) {
    mkdir($outDir, 0777, true);
}

// Find blade files
$base = realpath(__DIR__ . '/../resources/views');
$rii = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($base));
$files = [];
foreach ($rii as $file) {
    if ($file->isDir()) continue;
    $name = $file->getFilename();
    if (substr($name, -10) === '.blade.php') {
        $files[] = $file->getPathname();
    }
}

echo "Found " . count($files) . " blade files\n";

$count = 0;
foreach ($files as $path) {
    $rel = substr($path, strlen($base) + 1);
    $viewName = str_replace(DIRECTORY_SEPARATOR, '.', preg_replace('/\.blade\.php$/', '', $rel));
    // Provide some default data to avoid errors in many templates
    // Provide both array-style and object-style sample data to satisfy different templates
    $sampleReservaArr = [
        'localizador' => 'TEST123',
        'check_in' => date('Y-m-d'),
        'check_out' => date('Y-m-d', strtotime('+1 day')),
        'precio_total' => '100.00',
        'noches' => 1,
        'cliente' => [
            'name' => 'Cliente Test',
            'direccion' => 'C/ Ejemplo, 1',
            'email' => 'test@example.com',
            'telefono' => '600000000'
        ],
        'habitaciones' => [
            ['tipo' => 'Doble', 'precio_noche' => 50, 'precio' => 50]
        ],
        'tarifas' => [],
    ];

    $sampleReservaObj = (object) array_merge($sampleReservaArr, ['reservable' => (object)['name' => 'Cliente Test', 'direccion' => 'C/ Ejemplo, 1']]);

    $data = [
        'title' => 'Test',
        'subject' => 'Test',
        'preheader' => 'Test',
        'content' => 'Test',
        'reserva' => $sampleReservaArr,
        'reserva_model' => $sampleReservaObj,
        'cliente' => (object)['nombre' => 'Cliente Test'],
        'refundRequest' => (object)['id' => 1, 'requested_amount_cents' => 0, 'penalty_cents' => 0, 'localizador' => 'REF123', 'status' => 'pending'],
        'page' => 1,
        'noches' => 1,
        'qr_data_uri' => null,
    ];

    try {
        $html = view($viewName, $data)->render();
        // Remove trailing whitespace per-line and trim final output to avoid html-validate warnings
        $html = preg_replace('/[ \t]+$/m', '', $html);
        $html = rtrim($html, "\n\r ") . "\n";
        $safeName = preg_replace('/[^a-z0-9_.-]/i', '_', $viewName) . '.html';
        file_put_contents($outDir . '/' . $safeName, $html);
        echo "Rendered: $viewName -> $safeName\n";
        $count++;
    } catch (Throwable $e) {
        echo "Skipping $viewName: " . $e->getMessage() . "\n";
    }
}

echo "Rendered $count files to $outDir\n";

return 0;
