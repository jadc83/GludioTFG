<?php

use App\Services\PrecioService;
use Carbon\Carbon;

uses(\Illuminate\Foundation\Testing\RefreshDatabase::class);

it('detects known spanish holidays using Yasumi', function () {
    $precioService = new PrecioService();

    $festivo = Carbon::parse('2026-01-01'); // Año Nuevo
    $noFestivo = Carbon::parse('2026-02-02');

    expect($precioService->esFestivo($festivo))->toBeTrue();
    expect($precioService->esFestivo($noFestivo))->toBeFalse();
});
