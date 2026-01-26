<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\PhpExecutableFinder;

class SimulateOverbooking extends Command
{
    protected $signature = 'reservas:simulate-overbooking {--tipo=} {--from=} {--to=} {--parallel=5} {--rooms=1}';

    protected $description = 'Lanza múltiples procesos en paralelo para simular overbooking.';

    public function handle()
    {
        $tipo = $this->option('tipo') ?: '';
        $from = $this->option('from') ?: date('Y-m-d');
        $to = $this->option('to') ?: $from;
        $parallel = intval($this->option('parallel')) ?: 5;
        $rooms = intval($this->option('rooms')) ?: 1;

        $php = (new PhpExecutableFinder())->find(false);

        $this->info("Simulación: tipo={$tipo} fechas={$from}..{$to} procesos={$parallel} habitaciones_por_peticion={$rooms}");

        $processes = [];

        for ($i = 0; $i < $parallel; $i++) {
            $uniqueSuffix = time();
            $dni = "SIM{$i}_{$uniqueSuffix}";
            $cmd = [$php, 'artisan', 'reservas:create-simulated', "--tipo={$tipo}", "--from={$from}", "--to={$to}", "--rooms={$rooms}", "--guest-name=Sim_{$i}", "--guest-dni={$dni}"];
            $proc = new Process($cmd);
            $proc->setTimeout(60);
            $proc->start();
            $processes[] = $proc;
        }

        $results = ['ok' => 0, 'error' => 0, 'outs' => []];

        // Wait for all
        foreach ($processes as $p) {
            $p->wait();
            $out = trim($p->getOutput());
            $err = trim($p->getErrorOutput());
            if ($p->getExitCode() === 0) {
                $results['ok']++;
                $results['outs'][] = ['status' => 'ok', 'out' => $out];
            } else {
                $results['error']++;
                $results['outs'][] = ['status' => 'error', 'out' => $err ?: $out];
            }
        }

        $this->info("Resultados: exitosas={$results['ok']} fallidas={$results['error']}");
        foreach ($results['outs'] as $r) {
            $this->line("[{$r['status']}]: {$r['out']}");
        }

        return $results['error'] === 0 ? 0 : 1;
    }
}
