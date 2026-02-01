<?php

namespace App\Console\Commands;

use App\Models\Reserva;
use App\Services\RefundService;
use Illuminate\Console\Command;

class SyncRefundStates extends Command
{
    protected $signature = 'refunds:sync-states';
    protected $description = 'Sincroniza los estados de reservas según refunds procesados';

    public function handle()
    {
        $refundService = new RefundService();
        $synced = 0;

        // Sincronizar todas las reservas que tienen refund requests
        $reservas = Reserva::has('refundRequests')
            ->with(['refundRequests', 'reembolsos', 'pagos'])
            ->get();

        $this->info("Sincronizando " . $reservas->count() . " reservas...");

        foreach ($reservas as $reserva) {
            $statusAntes = $reserva->status;
            $refundService->sincronizarEstadoReservaSegunReembolsos($reserva);
            $reserva->refresh();

            if ($statusAntes !== $reserva->status) {
                $this->line("✓ {$reserva->localizador}: {$statusAntes} → {$reserva->status}");
                $synced++;
            }
        }

        $this->info("Sincronizadas $synced reservas");
    }
}
