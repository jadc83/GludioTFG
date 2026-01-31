<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Reserva;
use App\Models\Cliente;

class CleanupSimulatedReservas extends Command
{
    protected $signature = 'reservas:cleanup-simulated {--from=2026-01-01} {--to=2026-12-31} {--pattern=SIM%} {--force}';

    protected $description = 'Elimina reservas simuladas creadas por las pruebas (por patrón de cliente y rango de fechas).';

    public function handle()
    {
        $from = $this->option('from');
        $to = $this->option('to');
        $pattern = $this->option('pattern');
        $force = $this->option('force');

        $clientes = Cliente::where('numero_documento', 'like', $pattern)
            ->orWhere('email', 'like', '%@sim.local')
            ->pluck('id')
            ->toArray();

        if (empty($clientes)) {
            $this->info('No se encontraron clientes simulados con ese patrón. Nada que limpiar.');
            return 0;
        }

        $reservas = Reserva::whereBetween('check_in', [$from, $to])
            ->where('reservable_type', Cliente::class)
            ->whereIn('reservable_id', $clientes)
            ->get();

        if ($reservas->isEmpty()) {
            $this->info('No se encontraron reservas simuladas en el rango indicado. Nada que limpiar.');
            return 0;
        }

        $this->info('Se encontraron ' . $reservas->count() . ' reservas simuladas:');
        $this->line($reservas->pluck('localizador')->implode(', '));

        if (! $force) {
            if (! $this->confirm('¿Deseas eliminar estas reservas y clientes huérfanos?')) {
                $this->info('Operación cancelada.');
                return 0;
            }
        }

        $deletedReservas = 0;
        $deletedClientes = 0;

        DB::transaction(function () use ($reservas, $clientes, &$deletedReservas, &$deletedClientes) {
            foreach ($reservas as $res) {
                // Eliminar habitaciones relacionadas
                $res->habitaciones()->delete();
                $res->delete();
                $deletedReservas++;
            }

            // Eliminar clientes que se quedaron sin reservas
            $clientesToDelete = Cliente::whereIn('id', $clientes)->doesntHave('reservas')->pluck('id');
            if ($clientesToDelete->count()) {
                $deletedClientes = Cliente::whereIn('id', $clientesToDelete)->delete();
            }
        });

        $this->info("Eliminadas {$deletedReservas} reservas.");
        $this->info("Eliminados {$deletedClientes} clientes huérfanos (si los hubo).");

        return 0;
    }
}
