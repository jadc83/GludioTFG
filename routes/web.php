<?php

use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\ProfileController;
use App\Models\Habitacion;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Home');
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    Route::get('/logout', function () {
        Auth::logout();
        request()->session()->invalidate();
        request()->session()->regenerateToken();
        return redirect('/');
    })->name('logout.get');
});

Route::get('/panel', function () {
    $habitaciones = Habitacion::with('fotos')->orderBy('numero')->get()->map(function ($habitacion) {
        return [
        'id' => $habitacion->id,
        'numero' => $habitacion->numero,
        'tipo' => $habitacion->tipo,
        'precio_noche' => $habitacion->precio_noche,
        'capacidad' => $habitacion->capacidad,
        'estado' => $habitacion->estado,
        'descripcion' => $habitacion->descripcion,
        'notas' => $habitacion->notas,
        'fotos' => $habitacion->fotos->map(function ($foto) {
            return [ 'id' => $foto->id, 'ruta' => $foto->ruta, 'orden' => $foto->orden, 'url' => asset('storage/' . $foto->ruta)]; })->values() ];})->values();

    return Inertia::render('PanelControl', ['habitaciones' => $habitaciones, ]); })->name('panel')->middleware(['auth', 'verified']);

Route::resource('habitaciones', HabitacionController::class)->parameters(['habitaciones' => 'habitacion']);

require __DIR__.'/auth.php';
