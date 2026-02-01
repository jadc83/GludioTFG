<?php

use App\Http\Controllers\ClienteController;
use App\Http\Controllers\CuponController;
use App\Http\Controllers\HabitacionController;
use App\Http\Controllers\PagoController;
use App\Http\Controllers\PanelController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReservaController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\EmpleadoController;
use App\Http\Controllers\TarifaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\ScannerController;
use App\Http\Controllers\TipoHabitacionController;


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
Route::post('/reservas/{localizador}/checkin', [ReservaController::class, 'marcarCheckIn'])->where('localizador', '[A-Z0-9]+')->name('reservas.checkin');
Route::post('/reservas/{localizador}/checkout', [ReservaController::class, 'marcarCheckOut'])->where('localizador', '[A-Z0-9]+')->name('reservas.checkout');
Route::post('/scan/procesar', [ScannerController::class, 'procesar'])->name('scan.procesar');
Route::get('/reserva/{reserva:localizador}', [ReservaController::class, 'show'])->where('reserva', '[A-Z0-9]+')->name('reserva.show');
Route::get('/reservas/disponibles', [ReservaController::class, 'habitacionesDisponibles'])->name('reservas.disponibles');
Route::get('/habitaciones/disponibles', [HabitacionController::class, 'getDisponibles'])->name('habitaciones.disponibles');
Route::get('/reservas/precios-por-dia', [ReservaController::class, 'preciosPorDia'])->name('reservas.precios-por-dia');
Route::get('/api/tipos-habitacion', [TipoHabitacionController::class, 'index']);
Route::get('/api/tarifas', [TarifaController::class, 'index']);
Route::get('/reservas/precios/mes/{yyyy}/{mm}', [ReservaController::class, 'preciosMes'])->name('reservas.precios-mes');
Route::get('/reservas/buscar/{localizador}', [ReservaController::class, 'buscarPorLocalizador'])->where('localizador', '[A-Z0-9]+')->name('reservas.buscar-localizador');
Route::get('/reservas/{localizador}/pdf', [ReservaController::class, 'descargarComprobante'])->where('localizador', '[A-Z0-9]+')->name('reservas.descargar-comprobante');
Route::post('/reservas/calcular-precio', [ReservaController::class, 'calcularPrecio'])->name('reservas.calcular-precio');


Route::get('/reservas/{localizador}/info-extension', [ReservaController::class, 'infoExtension'])->where('localizador', '[A-Z0-9]+')->name('reservas.info-extension');
Route::get('/reservas/calcular-precio', function() {
    return response()->json([
        'success' => false,
        'error' => 'Endpoint de cálculo de precios: use POST con payload JSON {check_in,check_out,habitaciones,tarifas}'
    ], 200);
});
Route::post('/reservas/{localizador}/extender', [ReservaController::class, 'extenderReserva'])->where('localizador', '[A-Z0-9]+')->name('reservas.extender');
Route::post('/reservas/{localizador}/modificar-estancia', [ReservaController::class, 'modificarEstancia'])->where('localizador', '[A-Z0-9]+')->name('reservas.modificar-estancia');
Route::get('/reservas/{localizador}/preview-modificar-estancia', [ReservaController::class, 'previewModificarEstancia'])->where('localizador', '[A-Z0-9]+')->name('reservas.preview-modificar-estancia');
Route::post('/reservas/{reserva}/refund-requests', [\App\Http\Controllers\RefundRequestController::class, 'store'])->name('reservas.refund-requests.store')->where('reserva', '[0-9]+')->middleware('auth');
Route::post('/reservas/{localizador}/refund-requests', [\App\Http\Controllers\RefundRequestController::class, 'storeByLocalizador'])->where('localizador', '[A-Z0-9]+')->name('reservas.refund-requests.store.by_localizador')->middleware('auth');
Route::get('/refund-requests', [\App\Http\Controllers\RefundRequestController::class, 'index'])->name('refund-requests.index')->middleware('auth');
Route::get('/panel/estadisticas/ocupacion', [\App\Http\Controllers\EstadisticasController::class, 'ocupacion'])->name('panel.estadisticas.ocupacion')->middleware(['auth']);
Route::post('/refund-requests/{refundRequest}/approve', [\App\Http\Controllers\RefundRequestController::class, 'approve'])->name('refund-requests.approve')->middleware('auth');
Route::post('/refund-requests/{refundRequest}/reject', [\App\Http\Controllers\RefundRequestController::class, 'reject'])->name('refund-requests.reject')->middleware('auth');
Route::delete('/refund-requests/{refundRequest}', [\App\Http\Controllers\RefundRequestController::class, 'destroy'])->name('refund-requests.destroy')->middleware('auth');
Route::post('/reservas', [ReservaController::class, 'store'])->name('reservas.store');
Route::post('/pagos/crear-payment-intent', [PagoController::class, 'crearPaymentIntent'])->name('pagos.crear-payment-intent');
Route::post('/pagos/confirmar', [PagoController::class, 'confirmarPago'])->name('pagos.confirmar');
Route::post('/webhooks/stripe', [PagoController::class, 'webhook'])->withoutMiddleware('VerifyCsrfToken');
Route::post('/reservas/{reserva}/reembolsar', [PagoController::class, 'reembolsarReserva'])->name('reservas.reembolsar');
Route::resource('habitaciones', HabitacionController::class)->parameters(['habitaciones' => 'habitacion'])->middleware('auth');
Route::resource('clientes', ClienteController::class)->middleware('auth');
Route::resource('users', UserController::class)->only(['store', 'update'])->middleware('auth');
Route::resource('empleados', EmpleadoController::class)->only(['create','store','update'])->middleware('auth');

// Ruta index simple que redirige al panel (donde se muestran los empleados en la pestaña) para mantener compatibilidad con las redirecciones actuales
Route::get('/empleados', function () { return redirect()->route('panel'); })->name('empleados.index')->middleware('auth');
Route::resource('reservas', ReservaController::class)->parameters(['reservas' => 'reserva'])->where(['reserva' => '[0-9]+'])->except('store')->middleware('auth');
Route::post('/reservas/{reserva}/asignar-habitaciones', [ReservaController::class, 'asignarHabitaciones'])->name('reservas.asignar-habitaciones')->middleware('auth');
Route::post('/reservas/{reserva}/desasignar-habitaciones', [ReservaController::class, 'desasignarHabitaciones'])->name('reservas.desasignar-habitaciones')->middleware('auth');

// Cupones
Route::post('/cupones/validar', [CuponController::class, 'validar']);

require __DIR__ . '/auth.php';
