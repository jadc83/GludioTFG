<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="UTF-8">
	<title>Factura {{ $reserva['localizador'] ?? $reserva_model->localizador ?? '' }} - Hotel Gludio</title>
	<style>
		/* Configuraciones de página para PDF (DomPDF compatible) */
		@page { size: A4; margin: 0; }
		body {
			font-family: Helvetica, Arial, sans-serif;
			color: #1a1a1a;
			background: #ffffff;
			line-height: 1.5;
			margin: 0;
			padding: 0;
		}

		/* Contenedor principal */
		.wrapper { padding: 40px; }

		/* Cabecera */
		.header {
			display: table;
			width: 100%;
			border-bottom: 2px solid #f3f4f6;
			padding-bottom: 25px;
			margin-bottom: 30px;
		}
		.brand-cell { display: table-cell; vertical-align: top; }
		.meta-cell { display: table-cell; vertical-align: top; text-align: right; }

		.brand-name { font-size: 24px; font-weight: bold; color: #111; margin: 0; }
		.brand-sub { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; }

		.localizador-badge {
			background: #f3f4f6;
			padding: 4px 12px;
			border-radius: 6px;
			font-family: monospace;
			font-size: 16px;
			font-weight: bold;
			color: #111;
			display: inline-block;
			margin-top: 5px;
		}

		/* Grid de información rápida (Usando tablas para compatibilidad PDF) */
		.summary-table {
			width: 100%;
			margin-bottom: 40px;
			background: #fafafa;
			border-radius: 12px;
			border-spacing: 20px;
			border-collapse: separate;
		}
		.summary-item { width: 25%; vertical-align: top; }
		.label { font-size: 10px; text-transform: uppercase; color: #6b7280; font-weight: bold; margin-bottom: 4px; }
		.value { font-size: 13px; font-weight: bold; color: #111; }

		/* Secciones */
		.section-title {
			font-size: 13px;
			font-weight: bold;
			color: #111;
			margin-bottom: 15px;
			padding-left: 10px;
			border-left: 4px solid #7a0202;
		}

		.status-refund { background: #7a0202; color: #fff; }

		/* Tablas */
		table.modern-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
		table.modern-table th {
			text-align: left;
			font-size: 11px;
			color: #6b7280;
			padding: 12px;
			border-bottom: 1px solid #e5e7eb;
			text-transform: uppercase;
		}
		table.modern-table td { padding: 14px 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }

		/* Totales */
		.totals-wrapper { width: 100%; display: table; margin-top: 10px; }
		.totals-left { display: table-cell; width: 55%; vertical-align: bottom; }
		.totals-right { display: table-cell; width: 45%; }

		.total-row { display: table; width: 100%; margin-bottom: 6px; }
		.total-label { display: table-cell; text-align: left; color: #6b7280; font-size: 13px; }
		.total-value { display: table-cell; text-align: right; font-weight: bold; font-size: 13px; }

		.grand-total { border-top: 2px solid #111; padding-top: 12px; margin-top: 10px; }
		.grand-total .total-label { color: #111; font-weight: bold; font-size: 15px; }
		.grand-total .total-value { color: #7a0202; font-weight: bold; font-size: 19px; }

		/* Badges */
		.status-badge {
			padding: 5px 12px;
			border-radius: 15px;
			font-size: 10px;
			font-weight: bold;
			display: inline-block;
			text-transform: uppercase;
		}
		.status-paid { background: #dcfce7; color: #166534; }
		.status-pending { background: #fef3c7; color: #92400e; }

		.qr-box { text-align: right; }
		.qr-box img { border: 1px solid #e5e7eb; padding: 4px; background: #fff; }

		.footer {
			margin-top: 40px;
			padding-top: 20px;
			border-top: 1px solid #f3f4f6;
			text-align: center;
			font-size: 11px;
			color: #9ca3af;
		}
	</style>
</head>
<body>
	<div class="wrapper">
		<div class="header">
			<div class="brand-cell">
				<div class="brand-name">Hotel Gludio</div>
				<div class="brand-sub">Factura</div>
				<div style="margin-top:8px; font-size:11px; color:#6b7280;">
					<strong>Hotel Gludio S.L.</strong><br>
					C/ Ejemplo, 1 · 11540 Sanlúcar de Barrameda<br>
					CIF: B12345678
				</div>
			</div>
			<div class="meta-cell" style="text-align:right;">
				<div class="label">Factura Nº</div>
				<div class="localizador-badge">FAC-{{ $reserva['localizador'] ?? $reserva_model->localizador ?? '' }}</div>
				@php
					$hasRefund = isset($reserva['refundRequests']) && count($reserva['refundRequests']);
				@endphp
				@if(!empty($hasRefund))
					<div style="margin-top:8px;">
						<span class="status-badge status-refund">Reembolso solicitado</span>
					</div>
				@endif
				<div style="margin-top:8px; font-size:11px; color:#6b7280;">
					<div class="label">Emitida</div>
					<div class="value">{{ $fecha_generacion ?? now()->format('d/m/Y H:i') }}</div>
				</div>
			</div>
		</div>

		<table class="summary-table">
			<tr>
				<td class="summary-item">
					<div class="label">Huésped</div>
					<div class="value">{{ $reserva['cliente']['name'] ?? ($reserva_model->reservable?->name ?? 'N/A') }}</div>
				</td>
				<td class="summary-item">
					<div class="label">Check-in</div>
					<div class="value">{{ isset($reserva['check_in']) ? \Carbon\Carbon::parse($reserva['check_in'])->format('d/m/Y') : (isset($reserva_model->check_in) ? \Carbon\Carbon::parse($reserva_model->check_in)->format('d/m/Y') : '-') }}</div>
				</td>
				<td class="summary-item">
					<div class="label">Check-out</div>
					<div class="value">{{ isset($reserva['check_out']) ? \Carbon\Carbon::parse($reserva['check_out'])->format('d/m/Y') : (isset($reserva_model->check_out) ? \Carbon\Carbon::parse($reserva_model->check_out)->format('d/m/Y') : '-') }}</div>
				</td>
				<td class="summary-item">
					<div class="label">Estancia</div>
					<div class="value">
						{{ $noches }} {{ $noches == 1 ? 'noche' : 'noches' }}
					</div>
				</td>
			</tr>
		</table>

		<div class="section-title">Habitaciones Reservadas</div>
		<table class="modern-table">
			<thead>
				<tr>
					<th>Descripción</th>
					<th style="text-align: center;">Noches</th>
					<th style="text-align: right;">Precio/Noche</th>
				</tr>
			</thead>
			<tbody>
				@php $habs = $reserva['habitaciones'] ?? null; @endphp
				@if($habs && count($habs))
					@foreach($habs as $hr)
						@php
							$tipo = $hr['tipo'] ?? 'Habitación';
							$precio_por_noche = $hr['precio_noche'] ?? ($hr['precio'] ? round($hr['precio'] / max(1, $noches), 2) : 0);
						@endphp
						<tr>
							<td style="font-weight: 500;">Habitación {{ ucfirst(strtolower($tipo)) }}</td>
							<td style="text-align: center;">{{ $noches }}</td>
							<td style="text-align: right;">€ {{ number_format($precio_por_noche, 2, ',', '.') }}</td>
						</tr>
					@endforeach
				@else
					@foreach($reserva_model->habitaciones as $hr)
						@php
							$tipo = $hr->habitacion?->tipo ?? ($hr->tipo ?? 'Habitación');
							$precio_por_noche = ($noches > 0) ? ($hr->precio / max(1, $noches)) : $hr->precio;
						@endphp
						<tr>
							<td style="font-weight: 500;">Habitación {{ ucfirst(strtolower($tipo)) }}</td>
							<td style="text-align: center;">{{ $noches }}</td>
							<td style="text-align: right;">€ {{ number_format($precio_por_noche, 2, ',', '.') }}</td>
						</tr>
					@endforeach
				@endif
			</tbody>
		</table>

		@php
			$tarifasArr = $reserva['tarifas'] ?? null;
		@endphp

		@if($tarifasArr && count($tarifasArr))
			<div class="section-title">Extras y Tarifas</div>
			<table class="modern-table" style="margin-bottom: 10px;">
				@foreach($tarifasArr as $t)
					@php
						$name = $t['name'] ?? 'Suplemento';
						$price = $t['price'] ?? 0;
					@endphp
					<tr>
						<td style="color: #4b5563;">{{ $name }}</td>
						<td style="text-align: right; font-weight: 500;">
							{{ $price > 0 ? '+' : '' }} € {{ number_format($price, 2, ',', '.') }}
						</td>
					</tr>
				@endforeach
			</table>
		@endif

		<div class="totals-wrapper">
			<div class="totals-left">
				<div style="margin-top: 6px;">
					<div class="section-title">Cliente (datos fiscales)</div>
					<div style="font-size:11px; color:#4b5563; margin-top:6px;">
						<strong>{{ $reserva['cliente']['name'] ?? ($reserva_model->reservable?->name ?? 'Cliente') }}</strong><br>
						{{ $reserva['cliente']['direccion'] ?? ($reserva_model->reservable?->direccion ?? $reserva_model->reservable?->address ?? '-') }}<br>
						NIF/CIF: {{ $reserva['cliente']['numero_documento'] ?? ($reserva_model->reservable?->numero_documento ?? '-') }}<br>
						Email: {{ $reserva['cliente']['email'] ?? ($reserva_model->reservable?->email ?? '-') }} · Tel: {{ $reserva['cliente']['telefono'] ?? ($reserva_model->reservable?->telefono ?? '-') }}
					</div>
				</div>
			</div>

			<div class="totals-right">
				{{-- Base imponible eliminado para igualar resumen de interfaz --}}
				<div class="total-row">
					<div class="total-label">IVA (21%)</div>
					@php $total = $reserva['precio_total'] ?? $reserva_model->precio_total ?? 0; @endphp
					<div class="total-value">€ {{ number_format(round($total * 0.21, 2), 2, ',', '.') }}</div>
				</div>
				<div class="total-row grand-total">
					<div class="total-label">TOTAL FACTURA</div>
					<div class="total-value">€ {{ number_format(round($total * 1.21, 2), 2, ',', '.') }}</div>
				</div>

				<div class="qr-box" style="margin-top: 20px;">
					@php
						$qrUrl = !empty($qr_data_uri) ? $qr_data_uri : (isset($reserva['localizador']) ? "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=" . urlencode(url('/reserva/'.$reserva['localizador'])) : "https://chart.googleapis.com/chart?chs=150x150&cht=qr&chl=" . urlencode(url('/reserva/'.$reserva_model->localizador)));
					@endphp
					<img src="{{ $qrUrl }}" alt="QR" style="width:120px; height:120px;" />
				</div>
			</div>
		</div>

		<div class="footer">
			<strong>Hotel Gludio S.L.</strong> &bull; CIF: B12345678 &bull; C/ Ejemplo, 1 · 11540 Sanlúcar de Barrameda<br>
			Emitida el {{ $fecha_generacion ?? now()->format('d/m/Y H:i') }}
		</div>
	</div>
</body>
</html>
