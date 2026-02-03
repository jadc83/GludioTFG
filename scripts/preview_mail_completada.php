<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
$reservaId = $argv[1] ?? null;
if (!$reservaId) { echo "Uso: php preview_mail_completada.php <reserva_id>\n"; exit(1); }
$res = App\Models\Reserva::find($reservaId);
if (!$res) { echo "Reserva $reservaId no encontrada\n"; exit(1); }
$mail = new App\Mail\ReservaCompletada($res);
$html = $mail->render();
echo $html . "\n";