@php
  $subject = "Reserva completada — {$reserva->localizador}";
  $title = "Reserva completada — {$reserva->localizador}";
  $preheader = "Su reserva se ha creado correctamente. Detalles y código QR adjuntos.";
@endphp

@extends('emails.layout')

@section('content')
  <p style="margin:0 0 8px 0;font-size:16px;">Estimado/a <strong>{{ optional($reserva->reservable)->name ?? 'cliente' }}</strong>,</p>
  <p style="margin:0 0 12px 0;color:#555;">Su reserva se ha creado correctamente. A continuación los detalles:</p>

  <table class="table" role="presentation">
    <tr><td style="font-weight:600;width:140px;color:#444;">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Check-out</td><td>{{ $reserva->check_out }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Precio</td><td>€{{ $reserva->precio_total }}</td></tr>
  </table>

  <div style="text-align:center;margin:18px 0;">
    <p style="margin:0 0 8px 0;font-weight:600;color:#444;">Tu código QR de reserva</p>
    <img alt="QR Reserva {{ $reserva->localizador }}" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={{ urlencode($reserva->localizador) }}" style="width:100%;max-width:260px;height:auto;border-radius:6px;border:4px solid #f5f5f5;display:block;margin:0 auto;" />
  </div>

  <p style="margin:12px 0 6px 0;font-weight:600;color:#444;">Habitaciones asignadas</p>
  <ul style="margin:6px 0 16px 20px;color:#333;">
    @foreach($reserva->habitaciones as $hr)
      <li style="margin:6px 0;">#{{ $hr->habitacion?->numero ?? 'N/A' }} — {{ $hr->habitacion?->tipo ?? ($hr->tipo ?? 'N/A') }} (€{{ $hr->precio }})</li>
    @endforeach
  </ul>

  <p style="margin:0;color:#666;">Gracias por elegirnos.</p>
@endsection
