<?php

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PanelController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\UserController;
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
    });

Route::get('/panel', [PanelController::class, 'index'])->name('panel')->middleware(['auth', 'verified']);
Route::get('/terminos', function () { return Inertia::render('TerminosCondiciones'); })->name('terminos');

// Rutas de reservas
Route::get('/reserva/{reserva:localizador}', [ReservaController::class, 'show'])->name('reserva.show');
Route::get('/reservas/disponibles', [ReservaController::class, 'habitacionesDisponibles'])->name('reservas.disponibles');
Route::get('/reservas/buscar/{localizador}', [ReservaController::class, 'buscarPorLocalizador'])->name('reservas.buscar-localizador');
Route::get('/reservas/{localizador}/pdf', [ReservaController::class, 'descargarComprobante'])->name('reservas.descargar-comprobante');
Route::post('/reservas/calcular-precio', [ReservaController::class, 'calcularPrecio'])->name('reservas.calcular-precio');
Route::get('/reservas/{localizador}/info-extension', [ReservaController::class, 'infoExtension'])->name('reservas.info-extension');
Route::post('/reservas/{localizador}/extender', [ReservaController::class, 'extenderReserva'])->name('reservas.extender');
Route::post('/reservas', [ReservaController::class, 'store'])->name('reservas.store');

// Rutas de pagos
Route::post('/pagos/crear-payment-intent', [PagoController::class, 'crearPaymentIntent'])->name('pagos.crear-payment-intent');
Route::post('/pagos/confirmar', [PagoController::class, 'confirmarPago'])->name('pagos.confirmar');
Route::post('/webhooks/stripe', [PagoController::class, 'webhook'])->withoutMiddleware('VerifyCsrfToken');

// Ruta resource
Route::resource('habitaciones', HabitacionController::class)->parameters(['habitaciones' => 'habitacion'])->middleware('auth');
Route::resource('clientes', ClienteController::class)->middleware('auth');
Route::resource('users', UserController::class)->only(['store', 'update'])->middleware('auth');
Route::resource('reservas', ReservaController::class)->except('store')->middleware('auth');

require __DIR__ . '/auth.php';
