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

Route::get('/panel', [PanelController::class, 'index'])->name('panel')->middleware(['auth', 'verified', \App\Http\Middleware\EnsureEncargado::class]);
Route::get('/terminos', function () { return Inertia::render('Legal/TerminosCondiciones'); })->name('terminos');
// Páginas públicas: política, términos y contacto
Route::get('/politica-privacidad', function () { return Inertia::render('PoliticaPrivacidad'); })->name('politica.privacidad');
Route::get('/terminos-servicio', function () { return Inertia::render('TerminosServicio'); })->name('terminos.servicio');
Route::get('/contacto', function () { return Inertia::render('Contacto'); })->name('contacto');
Route::get('/scan-qr', function () { return Inertia::render('Scan/ScanQR'); })->name('scan-qr');
Route::post('/reservas/{localizador}/checkin', [ReservaController::class, 'marcarCheckIn'])->where('localizador', '[A-Z0-9]+')->name('reservas.checkin');
Route::post('/reservas/{localizador}/checkout', [ReservaController::class, 'marcarCheckOut'])->where('localizador', '[A-Z0-9]+')->name('reservas.checkout');
Route::post('/scan/procesar', [ScannerController::class, 'procesar'])->name('scan.procesar');
Route::get('/reserva/{reserva:localizador}', [ReservaController::class, 'show'])->where('reserva', '[A-Z0-9]+')->name('reserva.show');

Route::get('/reservas/disponibles', [ReservaController::class, 'habitacionesDisponibles'])->name('reservas.disponibles');
Route::get('/habitaciones/disponibles', [HabitacionController::class, 'getDisponibles'])->name('habitaciones.disponibles');
Route::get('/reservas/precios-por-dia', [ReservaController::class, 'preciosPorDia'])->name('reservas.precios-por-dia');
Route::get('/api/tipos-habitacion', [TipoHabitacionController::class, 'index']);
Route::put('/api/tipos-habitacion/{tipoHabitacion}', [TipoHabitacionController::class, 'update'])->middleware('auth');
Route::get('/api/tarifas', [TarifaController::class, 'index']);

// API: roles disponibles para asignar a empleados (encargado|operario|auxiliar)
Route::get('/api/roles', function() {
    return \Spatie\Permission\Models\Role::whereIn('name', ['encargado','operario','auxiliar'])->pluck('name')->values();
})->middleware('auth');

// API: departamentos
Route::get('/api/departamentos', function() {
    return \App\Models\Departamento::select('id','name')->orderBy('name')->get();
})->middleware('auth');

// API: tareas para empleado logueado
Route::get('/api/tareas', [\App\Http\Controllers\TareaController::class, 'index'])->middleware('auth');
Route::post('/api/tareas/assign-room', [\App\Http\Controllers\TareaController::class, 'assignRoom'])->middleware('auth');
Route::post('/api/tareas/{tarea}/complete', [\App\Http\Controllers\TareaController::class, 'complete'])->middleware('auth');
Route::post('/api/tareas/{tarea}/cancel', [\App\Http\Controllers\TareaController::class, 'cancel'])->middleware('auth');
Route::get('/api/tareas/completed', [\App\Http\Controllers\TareaController::class, 'completedByUser'])->middleware('auth');

// API: habitaciones en limpieza (excluye habitaciones con tareas activas)
Route::get('/api/habitaciones/limpieza', function (Illuminate\Http\Request $request) {
    $habitaciones = \App\Models\Habitacion::where('estado', 'limpieza')
        ->whereDoesntHave('tareas', function($q){ $q->whereIn('status', ['pendiente', 'en_progreso']); })
        ->with('fotos')
        ->limit(200)
        ->get();
    $action = app(\App\Actions\Habitaciones\FormatHabitacionesAction::class);
    return response()->json(['habitaciones' => $action->handle($habitaciones)]);
})->middleware('auth');

// API: turnos (PoC) - para empleado logueado
Route::get('/api/turnos', [\App\Http\Controllers\TurnoController::class, 'index'])->middleware('auth');
Route::post('/api/turnos', [\App\Http\Controllers\TurnoController::class, 'store'])->middleware('auth');
Route::put('/api/turnos/{turno}', [\App\Http\Controllers\TurnoController::class, 'update'])->middleware('auth');
Route::delete('/api/turnos/{turno}', [\App\Http\Controllers\TurnoController::class, 'destroy'])->middleware('auth');
Route::post('/api/turnos/clear', [\App\Http\Controllers\TurnoController::class, 'clear'])->middleware('auth');

// Vista: historial de tareas completadas por el usuario
Route::get('/profile/tareas/completadas', [\App\Http\Controllers\ProfileController::class, 'tareasCompleted'])->name('profile.tareas.completed')->middleware('auth');

// API: detalle de departamento con empleados
Route::get('/api/departamentos/{departamento}', function (App\Models\Departamento $departamento) {
    $departamento->load(['empleados.user']);
    $empleados = $departamento->empleados->map(function ($e) {
        return [
            'id' => $e->id,
            'name' => $e->user->name ?? null,
            'email' => $e->user->email ?? null,

            'role' => $e->user ? ($e->user->getRoleNames()->first() ?? null) : null,
        ];
    });
    return response()->json(['id' => $departamento->id, 'name' => $departamento->name, 'empleados' => $empleados]);
})->middleware('auth');
Route::get('/reservas/precios/mes/{yyyy}/{mm}', [ReservaController::class, 'preciosMes'])->name('reservas.precios-mes');
Route::get('/reservas/buscar/{localizador}', [ReservaController::class, 'buscarPorLocalizador'])->where('localizador', '[A-Z0-9]+')->name('reservas.buscar-localizador');
Route::get('/reservas/{localizador}/pdf', [ReservaController::class, 'descargarComprobante'])->where('localizador', '[A-Z0-9]+')->name('reservas.descargar-comprobante');
Route::post('/reservas/calcular-precio', [ReservaController::class, 'calcularPrecio'])->name('reservas.calcular-precio');
// Proteger contra llamadas por GET (posibles navegaciones manuales o herramientas que abren la URL)
Route::get('/reservas/calcular-precio', function() {
    \Illuminate\Support\Facades\Log::warning('GET /reservas/calcular-precio called; method not allowed');
    return response()->json([
        'success' => false,
        'error' => 'Method Not Allowed. Use POST /reservas/calcular-precio with JSON payload {check_in,check_out,habitaciones,tarifas}'
    ], 405);
});

// Endpoint para obtener estados de pago por localizadores (usado por el panel para refrescar)
Route::get('/api/reservas/estados', [ReservaController::class, 'estados'])->name('api.reservas.estados');
// Cambio de fechas eliminado: rutas de modificación/preview retiradas.
Route::post('/reservas/{reserva}/refund-requests', [\App\Http\Controllers\RefundRequestController::class, 'store'])->name('reservas.refund-requests.store')->where('reserva', '[0-9]+')->middleware('auth');
Route::post('/reservas/{localizador}/refund-requests', [\App\Http\Controllers\RefundRequestController::class, 'storeByLocalizador'])->where('localizador', '[A-Z0-9]+')->name('reservas.refund-requests.store.by_localizador')->middleware('auth');
Route::get('/refund-requests', [\App\Http\Controllers\RefundRequestController::class, 'index'])->name('refund-requests.index')->middleware('auth');
Route::get('/panel/estadisticas/ocupacion', [\App\Http\Controllers\EstadisticasController::class, 'ocupacion'])->name('panel.estadisticas.ocupacion')->middleware(['auth']);
Route::post('/refund-requests/{refundRequest}/approve', [\App\Http\Controllers\RefundRequestController::class, 'approve'])->name('refund-requests.approve')->middleware('auth');
Route::post('/refund-requests/{refundRequest}/reject', [\App\Http\Controllers\RefundRequestController::class, 'reject'])->name('refund-requests.reject')->middleware('auth');
Route::delete('/refund-requests/{refundRequest}', [\App\Http\Controllers\RefundRequestController::class, 'destroy'])->name('refund-requests.destroy')->middleware('auth');
Route::post('/reservas', [ReservaController::class, 'store'])->name('reservas.store');
Route::post('/reservas/crear-con-checkout', [ReservaController::class, 'storeConCheckout'])->name('reservas.store.con_checkout');
Route::post('/pagos/crear-payment-intent', [PagoController::class, 'crearPaymentIntent'])->name('pagos.crear-payment-intent');
Route::post('/pagos/crear-payment-intent-standalone', [PagoController::class, 'crearPaymentIntentStandalone'])->name('pagos.crear-payment-intent-standalone');
Route::post('/pagos/crear-checkout-session', [PagoController::class, 'crearCheckoutSession'])->name('pagos.crear-checkout-session');
// Página para simular Stripe Checkout pero alojando un formulario con Stripe Elements
Route::get('/checkout-simulado', function (\Illuminate\Http\Request $request) {
    return Inertia::render('CheckoutSimulada', [
        'reserva_id' => $request->get('reserva_id'),
        'monto' => $request->get('monto'),
    ]);
});
Route::post('/pagos/confirmar', [PagoController::class, 'confirmarPago'])->name('pagos.confirmar');
// Endpoint para comprobar estado de una Checkout Session (usado por success_url UX)
Route::get('/pagos/check-session', [PagoController::class, 'checkSession'])->name('pagos.check-session');
// Endpoint para marcar pago manualmente (recepción)
Route::post('/pagos/{pago}/marcar-como-pagado', [PagoController::class, 'marcarComoPagado'])->name('pagos.marcar-como-pagado')->middleware('auth');
// Stripe webhook endpoint — exclude CSRF middleware to allow external POSTs
Route::post('/webhooks/stripe', [PagoController::class, 'webhook'])->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
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
Route::post('/cupones/validar', [CuponController::class, 'validar'])->withoutMiddleware('web');
Route::middleware(['auth'])->group(function () {
    Route::resource('cupones', \App\Http\Controllers\CuponController::class)->parameters(['cupones' => 'cupon']);
    Route::post('cupones/{cupon}/toggle', [\App\Http\Controllers\CuponController::class, 'toggle'])->name('cupones.toggle');
});

require __DIR__ . '/auth.php';
