@php
  $subject = "Reserva actualizada — {$reserva->localizador}";
  $title = "Reserva actualizada — {$reserva->localizador}";
  $preheader = "Su reserva ha sido actualizada. Revise los detalles y el estado de pago.";
@endphp

@extends('emails.layout')

@section('content')
  <p class="lead">Estimado/a <strong>{{ optional($reserva->reservable)->name ?? 'cliente' }}</strong>,</p>
  <p class="muted">Su reserva ha sido <strong>actualizada</strong>. A continuación los detalles actuales:</p>

  <table class="table" role="presentation">
    <tr><td class="table-key w-140">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
    <tr><td class="table-key">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
     <tbody>
    <tr><td class="table-key w-140">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
    <tr><td class="table-key">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
    <tr><td class="table-key">Check-out</td><td>{{ $reserva->check_out }}</td></tr>
    <tr><td class="table-key">Precio</td><td>€{{ $reserva->precio_total }}</td></tr>
    <tr><td class="table-key">Estado de pago</td><td>{{ $pago_texto ?? 'PENDIENTE' }}</td></tr>
     </tbody>
  </table>

  @if(!empty($comprobante))
    <p class="muted">Se ha adjuntado un comprobante de pago en este correo. Si no lo ve, revise su carpeta de correo no deseado.</p>
  @endif

  <p class="strong-label">Habitaciones asignadas</p>
  <ul class="list">
    @foreach($reserva->habitaciones as $hr)
      <li class="list-item">#{{ $hr->habitacion?->numero ?? 'N/A' }} — {{ $hr->habitacion?->tipo ?? ($hr->tipo ?? 'N/A') }} (€{{ $hr->precio }})</li>
    @endforeach
  </ul>

  <p class="muted">Gracias por confiar en nosotros. Si necesita asistencia, responda este correo.</p>
@endsection
