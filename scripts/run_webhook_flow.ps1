# Script: run_webhook_flow.ps1
# Automatiza: php artisan serve, stripe listen (forward a /webhooks/stripe), resend event y tail de logs
# USO: Ejecutar desde PowerShell (administrador recomendado):
#   cd C:\Users\ohayo\Documents\GludioTFG\scripts
#   .\run_webhook_flow.ps1

param()

# CONFIGURA aquí si tu ruta difiere
$projectRoot = "C:\Users\ohayo\Documents\GludioTFG"
$stripeExe = "C:\Program Files\stripe-cli\stripe.exe"
$phpHost = "127.0.0.1"
$phpPort = 8000
$webhookPath = "/webhooks/stripe"
$eventId = "evt_3Sx8NeLK1X5GBmxy1e1COR18"

Write-Host "Proyecto: $projectRoot"
Write-Host "Stripe CLI: $stripeExe"
Write-Host "Endpoint webhook local: http://$phpHost`:$phpPort$webhookPath"
Write-Host "Evento a reenviar: $eventId"
Write-Host "---"

# Validaciones
if (!(Test-Path $projectRoot)) {
    Write-Error "No se encuentra el proyecto en $projectRoot. Modifica la variable "+"`$projectRoot`" en el script."; exit 1
}
if (!(Test-Path $stripeExe)) {
    Write-Warning "No se encontró stripe cli en $stripeExe. Si está en otra ruta, edita la variable $stripeExe en el script.";
}

# 1) Abrir servidor Laravel en una nueva ventana de PowerShell
Write-Host "Iniciando php artisan serve en nueva ventana..."
Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","cd '$projectRoot'; php artisan serve --host=$phpHost --port=$phpPort" -WindowStyle Normal
Start-Sleep -Seconds 2

# 2) Abrir stripe listen en otra ventana
if (Test-Path $stripeExe) {
    Write-Host "Iniciando Stripe CLI listen en nueva ventana..."
    # Construir URL de forward usando subexpresiones para evitar errores de interpolación con ':'
    $forwardUrl = "http://$($phpHost):$($phpPort)$webhookPath"
    $listenCmd = "& '$stripeExe' listen --forward-to `"$forwardUrl`""
    Start-Process -FilePath powershell -ArgumentList "-NoExit","-Command","cd '$projectRoot'; $listenCmd" -WindowStyle Normal
} else {
    Write-Warning "Stripe CLI no encontrado: no arrancaré el listener automáticamente. Inicia manualmente:
    & 'C:\Program Files\stripe-cli\stripe.exe' listen --forward-to http://$phpHost:$phpPort$webhookPath"
}

Write-Host "Esperando 6 segundos para que los procesos arranquen..."
Start-Sleep -Seconds 6

# 3) Reenviar evento
if (Test-Path $stripeExe) {
    Write-Host "Reenviando evento $eventId..."
    & $stripeExe events resend $eventId | Write-Host
} else {
    Write-Warning "No puedo reenviar evento porque no se encontró stripe cli. Ejecuta manualmente:
    & 'C:\Program Files\stripe-cli\stripe.exe' events resend $eventId"
}

Write-Host "---"
Write-Host "A continuación se mostrarán los logs de Laravel (Ctrl+C para salir)."

# 4) Tail logs
$logFile = Join-Path $projectRoot "storage\logs\laravel.log"
if (Test-Path $logFile) {
    Get-Content $logFile -Tail 200 -Wait
} else {
    Write-Warning "No se encontró el log en $logFile";
}
