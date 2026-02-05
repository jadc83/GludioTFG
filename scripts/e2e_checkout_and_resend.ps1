# Automatiza un E2E básico: crear checkout para una reserva y reenviar webhook con Stripe CLI
# Uso: .\e2e_checkout_and_resend.ps1 -localizador {LOCALIZADOR} -eventId {STRIPE_EVENT_ID}
param(
    [string]$localizador = '',
    [string]$eventId = '',
    [string]$stripeExe = 'C:\Program Files\stripe-cli\stripe.exe',
    [string]$php = 'php'
)

$projectRoot = (Get-Location).Path
if (-not $localizador) { Write-Error 'Debes pasar -localizador {LOCALIZADOR}'; exit 1 }

Write-Host "Creando checkout para reserva: $localizador"
& $php "$projectRoot\scripts\test_create_checkout_session.php" $localizador

if (-not (Test-Path $stripeExe)) {
    Write-Warning "Stripe CLI no encontrado en $stripeExe. Inicia manualmente el listener y reenvía el evento con 'stripe events resend {eventId}'"
    exit 0
}

if (-not $eventId) {
    Write-Warning 'No se pasó -eventId. Abre Stripe Dashboard o CLI para localizar un evt_... válido y pásalo.'
    exit 0
}

# Inicia el forwarder si no está corriendo
Write-Host "Iniciando Stripe CLI listen (forward-to /webhooks/stripe)..."
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","& '$stripeExe' listen --forward-to 'http://127.0.0.1:8000/webhooks/stripe'" -WindowStyle Normal
Start-Sleep -Seconds 2

Write-Host "Reenviando evento $eventId..."
& $stripeExe events resend $eventId

Write-Host 'Hecho. Revisa storage/logs/laravel.log y la UI (DetalleReserva) para confirmar la actualización.'
