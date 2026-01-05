<?php

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\PanelController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\UserController;
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

Route::get('/panel', [PanelController::class, 'index'])
    ->name('panel')
    ->middleware(['auth', 'verified']);

Route::get('/clientes/buscar', [ClienteController::class, 'buscar'])
    ->name('clientes.buscar')
    ->middleware('auth');

Route::get('/reservas/disponibles', [ReservaController::class, 'habitacionesDisponibles'])
    ->name('reservas.disponibles');

Route::post('/reservas', [ReservaController::class, 'store'])->name('reservas.store');
Route::resource('habitaciones', HabitacionController::class)->parameters(['habitaciones' => 'habitacion'])->middleware('auth');
Route::resource('clientes', ClienteController::class)->middleware('auth');
Route::resource('users', UserController::class)->only(['store', 'update'])->middleware('auth');
Route::resource('reservas', ReservaController::class)->except('store')->middleware('auth');

require __DIR__ . '/auth.php';
