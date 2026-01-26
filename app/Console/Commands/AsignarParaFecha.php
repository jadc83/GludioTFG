<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class AsignarParaFecha extends Command
{
    protected $signature = 'reservas:assign-for-date {fecha : Fecha YYYY-MM-DD}';

    protected $description = 'Realiza asignación (simula check-in) para todas las reservas con fecha dada.';

    public function handle()
    {
        $fecha = $this->argument('fecha');
        $reservaService = app(\App\Services\ReservaService::class);

        $reservas = \App\Models\Reserva::where('check_in', $fecha)->get();

        $results = ['assigned' => 0, 'failed' => 0, 'details' => []];

        foreach ($reservas as $reserva) {
            $this->line("Procesando reserva {$reserva->localizador}...");
            $asignaciones = $reservaService->asignarHabitacionEnCheckIn($reserva);
            $fallos = array_filter($asignaciones, function ($a) { return isset($a['assigned']) && $a['assigned'] === false; });
            if (count($fallos) > 0) {
                $results['failed']++;
            } else {
                $results['assigned']++;
            }
            $results['details'][$reserva->localizador] = $asignaciones;
        }

        $this->info("Resumen: asignadas={$results['assigned']} reservas completas, fallidas={$results['failed']} reservas con fallos en la asignación");
        foreach ($results['details'] as $loc => $det) {
            $this->line($loc . ': ' . json_encode($det));
        }

        return 0;
    }
}
