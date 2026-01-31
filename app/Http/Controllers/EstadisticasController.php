<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EstadisticasController extends Controller
{
    /* Retorna estadísticas de ocupación para una fecha o un rango de fechas*/
    public function ocupacion(Request $request)
    {
        return \App\Actions\Estadisticas\GetOcupacionAction::handle($request);
    }
}
