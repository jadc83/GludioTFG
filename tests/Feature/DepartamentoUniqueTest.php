<?php

use App\Models\Departamento;
use Illuminate\Database\QueryException;

it('prevents creating departamentos with same name ignoring case', function () {
    Departamento::create(['name' => 'Limpieza']);

    // Attempt to create duplicate with different case
    $th = null;
    try {
        Departamento::create(['name' => 'limpieza']);
    } catch (QueryException $e) {
        $th = $e;
    }

    expect($th)->toBeInstanceOf(QueryException::class);
});
