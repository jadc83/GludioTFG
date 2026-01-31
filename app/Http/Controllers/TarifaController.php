<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Tarifa;
use Illuminate\Http\Request;

class TarifaController extends Controller
{
    /**
     * Return a JSON list of tarifas.
     */
    public function index(Request $request)
    {
        return response()->json(Tarifa::orderBy('id')->get());
    }
}
