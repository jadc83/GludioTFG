<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ReservaService;
use App\Models\User;
use Carbon\Carbon;

class CreateSimulatedReserva extends Command
{
    protected $signature = 'reservas:create-simulated {--tipo=} {--from=} {--to=} {--guest-name=Simulado} {--guest-dni=SIM12345} {--rooms=1}';

    protected $description = 'Crea una reserva de prueba (usado por el simulador de overbooking).';

    protected ReservaService $reservaService;

    public function __construct(ReservaService $reservaService)
    {
        parent::__construct();
        $this->reservaService = $reservaService;
    }

    public function handle()
    {
        $tipo = $this->option('tipo') ?: null;
        $from = $this->option('from') ?: Carbon::now()->format('Y-m-d');
        $to = $this->option('to') ?: $from;
        $nombre = $this->option('guest-name');
        $dni = $this->option('guest-dni');
        $rooms = intval($this->option('rooms')) ?: 1;

        // Por defecto crear un email válido para evitar violaciones de NOT NULL
        $email = strtolower(preg_replace('/[^a-z0-9]/', '', $dni)) . '@sim.local';
        $telefono = '000000000';

        $datos = [
            'check_in' => $from,
            'check_out' => $to,
            'habitaciones' => [],
            'nombre' => $nombre,
            'numero_documento' => $dni,
            'email' => $email,
            'telefono' => $telefono,
        ];

        for ($i = 0; $i < $rooms; $i++) {
            $datos['habitaciones'][] = ['tipo' => $tipo ?? '', 'cantidad' => 1];
        }

        try {
            $reserva = $this->reservaService->crearReserva($datos, null, 'pendiente');
            $this->info("OK: Reserva creada - localizador={$reserva->localizador}");
            return 0;
        } catch (\Exception $e) {
            $this->error('ERROR: ' . $e->getMessage());
            return 1;
        }
    }
}
