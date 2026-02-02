<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Services\TarifasService;
use Illuminate\Http\Request;

class TarifaController extends Controller
{
    protected TarifasService $tarifasService;

    public function __construct(TarifasService $tarifasService)
    {
        $this->tarifasService = $tarifasService;
    }

    /**
     * Return a JSON list of tarifas.
     */
    public function index(Request $request)
    {
        return response()->json($this->tarifasService->obtenerTodas());
    }
}
