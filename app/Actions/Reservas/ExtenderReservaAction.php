<?php

namespace App\Actions\Reservas;

use App\Services\ReservaExtensionService;

class ExtenderReservaAction
{
    protected ReservaExtensionService $extensionService;

    public function __construct(ReservaExtensionService $extensionService)
    {
        $this->extensionService = $extensionService;
    }

    public function handle(string $localizador, int $numeroDias, bool $confirmar = false): array
    {
        return $this->extensionService->extenderReserva($localizador, $numeroDias, $confirmar);
    }
}
