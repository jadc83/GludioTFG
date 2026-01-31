@php
  $subject = "Reserva cancelada — {$reserva->localizador}";
  $title = "Reserva cancelada — {$reserva->localizador}";
  $preheader = "Su reserva ha sido cancelada. Información y motivos (si procede).";
@endphp

@extends('emails.layout')

@section('content')
  <p style="margin:0 0 8px 0;font-size:16px;">Estimado/a <strong>{{ optional($reserva->reservable)->name ?? 'cliente' }}</strong>,</p>
  <p style="margin:0 0 12px 0;color:#555;">Le informamos que su reserva ha sido cancelada. Si cree que se trata de un error o desea más información, por favor contacte con nuestro equipo.</p>

  <table class="table" role="presentation">
    <tr><td style="font-weight:600;width:140px;color:#444;">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Check-out</td><td>{{ $reserva->check_out }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Precio</td><td>€{{ $reserva->precio_total }}</td></tr>
  </table>

  @if(!empty($motivo))
    <p style="margin:8px 0 12px 0;font-weight:600;color:#444;">Motivo de la cancelación</p>
    <div style="background:#f9f9f9;border:1px solid #eee;padding:12px;border-radius:6px;color:#333;margin-bottom:12px;">{{ $motivo }}</div>
  @endif

  <p style="margin:0 0 6px 0;font-weight:600;color:#444;">Habitaciones</p>
  <ul style="margin:6px 0 16px 20px;color:#333;">
    @foreach($reserva->habitaciones as $hr)
      <li style="margin:6px 0;">#{{ $hr->habitacion?->numero ?? 'N/A' }} — {{ $hr->habitacion?->tipo ?? ($hr->tipo ?? 'N/A') }} (€{{ $hr->precio }})</li>
    @endforeach
  </ul>

  <p style="margin:0;color:#666;">Gracias por su atención.</p>
@endsection
