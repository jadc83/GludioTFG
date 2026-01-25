<?php

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PanelController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\Api\TarifaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ScannerController;
use App\Http\Controllers\Api\TipoHabitacionController;



Route::pattern('reserva', '[0-9]+');

Route::get('/', function () {
    return Inertia::render('Home/Home');
})->name('home');

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard/Dashboard');
    })->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });

Route::get('/panel', [PanelController::class, 'index'])->name('panel')->middleware(['auth', 'verified']);
Route::get('/terminos', function () { return Inertia::render('Legal/TerminosCondiciones'); })->name('terminos');
Route::get('/scan-qr', function () { return Inertia::render('Scan/ScanQR'); })->name('scan-qr');
Route::post('/reservas/{localizador}/checkin', [ReservaController::class, 'marcarCheckIn'])->name('reservas.checkin');
Route::post('/reservas/{localizador}/checkout', [ReservaController::class, 'marcarCheckOut'])->name('reservas.checkout');
Route::post('/scan/procesar', [ScannerController::class, 'procesar'])->name('scan.procesar');
Route::get('/reserva/{reserva:localizador}', [ReservaController::class, 'show'])->name('reserva.show');
Route::get('/reservas/disponibles', [ReservaController::class, 'habitacionesDisponibles'])->name('reservas.disponibles');
Route::get('/reservas/precios-por-dia', [ReservaController::class, 'preciosPorDia'])->name('reservas.precios-por-dia');
Route::get('/api/tipos-habitacion', [TipoHabitacionController::class, 'index']);
Route::get('/api/tarifas', [TarifaController::class, 'index']);
Route::get('/reservas/precios/mes/{yyyy}/{mm}', [ReservaController::class, 'preciosMes'])->name('reservas.precios-mes');
Route::get('/reservas/buscar/{localizador}', [ReservaController::class, 'buscarPorLocalizador'])->name('reservas.buscar-localizador');
Route::get('/reservas/{localizador}/pdf', [ReservaController::class, 'descargarComprobante'])->name('reservas.descargar-comprobante');
Route::post('/reservas/calcular-precio', [ReservaController::class, 'calcularPrecio'])->name('reservas.calcular-precio');
Route::get('/reservas/{localizador}/info-extension', [ReservaController::class, 'infoExtension'])->name('reservas.info-extension');
Route::get('/reservas/calcular-precio', function() {
    return response()->json([
        'success' => false,
        'error' => 'Endpoint de cálculo de precios: use POST con payload JSON {check_in,check_out,habitaciones,tarifas}'
    ], 200);
});
Route::post('/reservas/{localizador}/extender', [ReservaController::class, 'extenderReserva'])->name('reservas.extender');
Route::post('/reservas/{localizador}/modificar-estancia', [ReservaController::class, 'modificarEstancia'])->name('reservas.modificar-estancia');
Route::get('/reservas/{localizador}/preview-modificar-estancia', [ReservaController::class, 'previewModificarEstancia'])->name('reservas.preview-modificar-estancia');
Route::post('/reservas', [ReservaController::class, 'store'])->name('reservas.store');
Route::post('/pagos/crear-payment-intent', [PagoController::class, 'crearPaymentIntent'])->name('pagos.crear-payment-intent');
Route::post('/pagos/confirmar', [PagoController::class, 'confirmarPago'])->name('pagos.confirmar');
Route::post('/webhooks/stripe', [PagoController::class, 'webhook'])->withoutMiddleware('VerifyCsrfToken');
Route::post('/reservas/{reserva}/reembolsar', [PagoController::class, 'reembolsarReserva'])->name('reservas.reembolsar');
Route::resource('habitaciones', HabitacionController::class)->parameters(['habitaciones' => 'habitacion'])->middleware('auth');
Route::resource('clientes', ClienteController::class)->middleware('auth');
Route::resource('users', UserController::class)->only(['store', 'update'])->middleware('auth');
Route::resource('reservas', ReservaController::class)->parameters(['reservas' => 'reserva'])->where(['reserva' => '[0-9]+'])->except('store')->middleware('auth');

require __DIR__ . '/auth.php';
