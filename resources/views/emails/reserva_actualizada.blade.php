@php
  $subject = "Reserva actualizada — {$reserva->localizador}";
  $title = "Reserva actualizada — {$reserva->localizador}";
  $preheader = "Su reserva ha sido actualizada. Revise los detalles y el estado de pago.";
@endphp

@extends('emails.layout')

@section('content')
  <p style="margin:0 0 8px 0;font-size:16px;">Estimado/a <strong>{{ optional($reserva->reservable)->name ?? 'cliente' }}</strong>,</p>
  <p style="margin:0 0 12px 0;color:#555;">Su reserva ha sido <strong>actualizada</strong>. A continuación los detalles actuales:</p>

  <table class="table" role="presentation">
    <tr><td style="font-weight:600;width:140px;color:#444;">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Check-out</td><td>{{ $reserva->check_out }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Precio</td><td>€{{ $reserva->precio_total }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Estado de pago</td><td>{{ $pago_texto ?? 'PENDIENTE' }}</td></tr>
  </table>

  @if(!empty($comprobante))
    <p style="margin:12px 0 12px 0;color:#444;">Se ha adjuntado un comprobante de pago en este correo. Si no lo ve, revise su carpeta de correo no deseado.</p>
  @endif

  <p style="margin:12px 0 6px 0;font-weight:600;color:#444;">Habitaciones asignadas</p>
  <ul style="margin:6px 0 16px 20px;color:#333;">
    @foreach($reserva->habitaciones as $hr)
      <li style="margin:6px 0;">#{{ $hr->habitacion?->numero ?? 'N/A' }} — {{ $hr->habitacion?->tipo ?? ($hr->tipo ?? 'N/A') }} (€{{ $hr->precio }})</li>
    @endforeach
  </ul>

  <p style="margin:0;color:#666;">Gracias por confiar en nosotros. Si necesita asistencia, responda este correo.</p>
@endsection