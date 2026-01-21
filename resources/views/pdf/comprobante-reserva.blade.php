<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Reserva {{ $reserva->localizador }}</title>
    <style>
        /* Page setup for PDF */
        @page { size: A4; margin: 20mm; }
        body { font-family: Arial, Helvetica, sans-serif; color: #222; background: #fff; margin:0; padding:0; }
        .container { width: 100%; max-width: 780px; margin: 0 auto; }
        .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:18px; }
        .brand { font-weight:700; color:#7a0202; }
        .meta { text-align:right; font-size:12px; color:#555; }
        .localizador { font-family: monospace; color:#7a0202; font-weight:700; margin-top:6px; display:block; }

        .section { margin-bottom: 14px; }
        .section-title { font-size:12px; font-weight:700; color:#fff; background:#7a0202; padding:6px 10px; display:inline-block; border-radius:3px; }

        .info { display:flex; gap:20px; margin-top:8px; }
        .info .col { flex:1; }
        .info-label { font-size:10px; color:#7a0202; font-weight:700; text-transform:uppercase; }
        .info-value { font-size:13px; color:#222; margin-top:6px; }

        table.items { width:100%; border-collapse:collapse; margin-top:10px; }
        table.items th, table.items td { border:1px solid #ddd; padding:8px 10px; text-align:left; font-size:13px; }
        table.items th { background:#f5f5f5; font-weight:700; }

        .totals { margin-top:12px; width:100%; display:flex; justify-content:flex-end; }
        .totals .box { width:320px; }
        .totals .row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
        .totals .grand { font-weight:800; font-size:16px; color:#7a0202; border-top:2px solid #eee; padding-top:8px; }

        .badge { display:inline-block; padding:6px 10px; border-radius:4px; color:#fff; font-weight:700; font-size:12px; }
        .badge-success { background:#10b981; }
        .badge-warning { background:#f59e0b; }

        .footer { margin-top:22px; font-size:11px; color:#666; text-align:center; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="brand">
                <div style="font-size:18px;">Hotel Gludio</div>
                <div style="font-size:12px;">Comprobante / Factura</div>
            </div>
            <div class="meta">
                <div>{{ $fecha_generacion ?? now()->format('d/m/Y H:i') }}</div>
                <div class="localizador">{{ $reserva->localizador }}</div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Información del Huésped</div>
            <div class="info">
                <div class="col">
                    <div class="info-label">Nombre</div>
                    <div class="info-value">{{ $cliente['nombre'] ?? ($reserva->reservable?->name ?? 'N/A') }}</div>
                </div>
                <div class="col">
                    <div class="info-label">Email</div>
                    <div class="info-value">{{ optional($reserva->reservable)->email ?? '-' }}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Detalles de la Estancia</div>
            <div class="info">
                <div class="col">
                    <div class="info-label">Check-in</div>
                    <div class="info-value">{{ \Carbon\Carbon::parse($reserva->check_in)->format('d/m/Y') }}</div>
                </div>
                <div class="col">
                    <div class="info-label">Check-out</div>
                    <div class="info-value">{{ \Carbon\Carbon::parse($reserva->check_out)->format('d/m/Y') }}</div>
                </div>
                <div class="col">
                    <div class="info-label">Noches</div>
                    <div class="info-value">{{ $noches }}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Habitaciones</div>
            <table class="items">
                <thead>
                    <tr>
                        <th>Descripción</th>
                        <th style="width:170px;text-align:right;">Precio</th>
                    </tr>
                </thead>
                <tbody>
                @foreach($reserva->habitaciones as $hr)
                    @php
                        $tipo = $hr->habitacion->tipo ?? 'Habitación';
                        $precio_por_noche = ($noches > 0) ? ($hr->precio / max(1, $noches)) : $hr->precio;
                    @endphp
                    <tr>
                        <td>Habitación {{ strtolower($tipo) }}</td>
                        <td style="text-align:right;">€ {{ number_format($precio_por_noche, 2, ',', '.') }}</td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>

        <div class="totals">
            <div class="box">
                <div class="row"><span>Subtotal</span><strong>€ {{ number_format($reserva->precio_total, 2, ',', '.') }}</strong></div>
                <div class="row grand"><span>TOTAL</span><strong>€ {{ number_format($reserva->precio_total, 2, ',', '.') }}</strong></div>
            </div>
        </div>

        <div class="section" style="margin-top:20px;">
            <div class="section-title">Estado de Pago</div>
            <div style="margin-top:8px;">
                @php
                    // calcular pago_texto: sólo considerar abonado si existe pago completado con stripe id
                    try { $reserva->loadMissing('pagos'); } catch (\Throwable $e) {}
                    $pagosCollection = $reserva->pagos ?? collect();
                    $ultimoTarjeta = $pagosCollection->where('estado','completado')
                                    ->filter(function($p){ return !empty($p->stripe_payment_intent_id); })
                                    ->sortByDesc('pagado_en')
                                    ->first();
                @endphp
                @if(isset($pago_texto))
                    @php $text = $pago_texto; @endphp
                @elseif($ultimoTarjeta)
                    @php $text = 'ABONADO (Tarjeta)'; @endphp
                @else
                    @php $text = 'PENDIENTE'; @endphp
                @endif

                @if(stripos($text,'abon') !== false)
                    <span class="badge badge-success">{{ $text }}</span>
                @else
                    <span class="badge badge-warning">{{ $text }}</span>
                @endif
            </div>
        </div>

        <div class="footer">
            <div>Comprobante generado el {{ $fecha_generacion ?? now()->format('d/m/Y H:i') }}</div>
            <div style="margin-top:6px;font-size:11px;color:#888;">Hotel Gludio — Guarda este documento para tus registros.</div>
        </div>
    </div>
</body>
</html>
