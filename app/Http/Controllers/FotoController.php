<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class FotoController extends Controller
{
    private function eliminadoResponse()
    {
        return response()->json(['success' => false, 'error' => 'Controlador Foto eliminado (no usado)'], 410);
    }

    public function index() { return $this->eliminadoResponse(); }
    public function create() { return $this->eliminadoResponse(); }
    public function store(Request $request) { return $this->eliminadoResponse(); }
    public function show($id) { return $this->eliminadoResponse(); }
    public function edit($id) { return $this->eliminadoResponse(); }
    public function update(Request $request, $id) { return $this->eliminadoResponse(); }
    public function destroy($id) { return $this->eliminadoResponse(); }
}
