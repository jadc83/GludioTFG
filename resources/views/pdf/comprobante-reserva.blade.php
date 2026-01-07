<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Comprobante de Reserva {{ $reserva->localizador }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            color: #333;
            margin: 0;
            padding: 0;
            background: #E2E0DC;
        }
        @page {
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 800px;
            margin: 0;
            background: #E2E0DC;
            padding: 0;
            box-shadow: none;
        }
        .header {
            background: linear-gradient(135deg, #7a0202 0%, #920303 100%);
            color: #7a0202;
            padding: 20px 30px;
            text-align: center;
            margin: 0;
            border-radius: 0;
        }
        .header h1 {
            font-size: 20px;
            font-weight: bold;
            margin: 0 0 5px 0;
            color: #7a0202;
        }
        .header p {
            font-size: 12px;
            margin: 0;
            color: #7a0202;
        }
        .localizador {
            font-family: monospace;
            font-weight: bold;
            font-size: 14px;
            background: rgba(122, 2, 2, 0.1);
            padding: 6px 12px;
            border-radius: 0;
            display: inline-block;
            margin-top: 5px;
            color: #7a0202;
        }
        .section {
            margin-bottom: 15px;
            margin-left: 30px;
            margin-right: 30px;
        }
        .section:first-of-type {
            margin-top: 15px;
        }
        .section-title {
            font-size: 11px;
            font-weight: bold;
            color: white;
            background: #7a0202;
            text-transform: uppercase;
            padding: 8px 12px;
            margin-bottom: 10px;
            border-left: 4px solid #920303;
        }
        .info-grid {
            background: #E2E0DC;
            padding: 12px;
            border-radius: 0;
            margin-bottom: 10px;
            border: none;
        }
        .info-row {
            display: table;
            width: 100%;
            margin-bottom: 8px;
        }
        .info-row:last-child {
            margin-bottom: 0;
        }
        .info-col {
            display: table-cell;
            width: 50%;
            padding-right: 10px;
            vertical-align: top;
        }
        .info-col:last-child {
            padding-right: 0;
        }
        .info-label {
            font-size: 11px;
            color: #7a0202;
            text-transform: uppercase;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .info-value {
            font-size: 15px;
            color: #2d2d2d;
            margin-top: 4px;
            font-weight: 500;
        }
        .badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: bold;
            color: white;
        }
        .badge-success {
            background-color: #10b981;
        }
        .badge-warning {
            background-color: #f59e0b;
        }
        .badge-info {
            background-color: #7a0202;
        }
        table {
            width: calc(100% - 60px);
            border-collapse: collapse;
            margin-top: 15px;
            margin-left: 30px;
            margin-right: 30px;
        }
        th {
            background-color: #7a0202;
            color: white;
            padding: 8px 12px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
        }
        td {
            padding: 8px 12px;
            border-bottom: none;
            font-size: 13px;
            background: #E2E0DC;
        }
        tr:nth-child(even) td {
            background-color: #d8d4cc;
        }
        tr:last-child td {
            border-bottom: none;
        }
        .total-section {
            background-color: #E2E0DC;
            padding: 12px;
            border-radius: 0;
            margin-top: 12px;
            margin-left: 30px;
            margin-right: 30px;
            border: none;
        }
        .total-row {
            display: table;
            width: 100%;
            margin-bottom: 5px;
            font-size: 13px;
        }
        .total-label {
            display: table-cell;
            width: 70%;
        }
        .total-value {
            display: table-cell;
            width: 30%;
            text-align: right;
        }
        .grand-total {
            font-size: 16px;
            font-weight: bold;
            color: #7a0202;
            border-top: 2px solid #7a0202;
            padding-top: 12px;
            margin-top: 12px;
        }
        .footer {
            text-align: center;
            margin-top: 15px;
            padding: 15px 30px;
            border-top: none;
            font-size: 10px;
            color: #666;
            background: #E2E0DC;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✓ COMPROBANTE DE RESERVA</h1>
            <p>Hotel Gludio</p>
            <div class="localizador">{{ $reserva->localizador }}</div>
        </div>

        <div class="section">
            <div class="section-title">Información del Huésped</div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-col">
                        <div class="info-label">Nombre</div>
                        <div class="info-value">{{ $cliente['nombre'] }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Detalles de la Estancia</div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-col">
                        <div class="info-label">Check-in</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($reserva->check_in)->format('d/m/Y') }}</div>
                    </div>
                    <div class="info-col">
                        <div class="info-label">Check-out</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($reserva->check_out)->format('d/m/Y') }}</div>
                    </div>
                </div>
                <div class="info-row">
                    <div class="info-col">
                        <div class="info-label">Noches</div>
                        <div class="info-value">{{ $noches }}</div>
                    </div>
                    <div class="info-col">
                        <div class="info-label">Fecha Reserva</div>
                        <div class="info-value">{{ \Carbon\Carbon::parse($reserva->created_at)->format('d/m/Y') }}</div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Habitaciones Reservadas</div>
            <table>
                <tr>
                    <th>Tipo</th>
                    <th>Habitación</th>
                    <th>Precio Total</th>
                </tr>
                @foreach($reserva->habitaciones as $habitacion)
                <tr>
                    <td>{{ ucfirst($habitacion->habitacion->tipo) }}</td>
                    <td>#{{ $habitacion->habitacion->numero }}</td>
                    <td>€ {{ number_format($habitacion->precio, 2, ',', '.') }}</td>
                </tr>
                @endforeach
            </table>
        </div>

        <div class="total-section">
            <div class="total-row">
                <span class="total-label">Subtotal:</span>
                <span class="total-value">€ {{ number_format($reserva->precio_total, 2, ',', '.') }}</span>
            </div>
            <div class="total-row grand-total">
                <span class="total-label">TOTAL A PAGAR:</span>
                <span class="total-value">€ {{ number_format($reserva->precio_total, 2, ',', '.') }}</span>
            </div>
        </div>

        <div class="section" style="margin-top: 30px;">
            <div class="section-title">Estado de la Reserva</div>
            <div class="info-grid">
                <div class="info-row">
                    <div class="info-col">
                        <div class="info-label">Estado de Reserva</div>
                        <div style="margin-top: 5px;">
                            @if($reserva->status === 'confirmada')
                                <span class="badge badge-success">✓ CONFIRMADA</span>
                            @elseif($reserva->status === 'pendiente')
                                <span class="badge badge-warning">⏳ PENDIENTE</span>
                            @else
                                <span class="badge badge-info">{{ ucfirst($reserva->status) }}</span>
                            @endif
                        </div>
                    </div>
                    <div class="info-col">
                        <div class="info-label">Estado de Pago</div>
                        <div style="margin-top: 5px;">
                            @if($reserva->pago === 'pagado')
                                <span class="badge badge-success">✓ PAGADO</span>
                            @elseif($reserva->pago === 'pendiente')
                                <span class="badge badge-warning">⏳ PENDIENTE</span>
                            @else
                                <span class="badge badge-info">{{ ucfirst($reserva->pago) }}</span>
                            @endif
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="footer">
            <p>Comprobante generado el {{ $fecha_generacion }}</p>
            <p>Este documento confirma tu reserva. Guárdalo para futuras referencias.</p>
            <p style="margin-top: 15px; font-size: 10px; color: #999;">
                Hotel Gludio | +34 91 234 5678 | info@hotelgludio.com
            </p>
        </div>
    </div>
</body>
</html>
