@php
  $subject = "Reserva completada — {$reserva->localizador}";
  $title = "Reserva completada — {$reserva->localizador}";
  $preheader = "Su reserva se ha creado correctamente. Detalles y código QR adjuntos.";
@endphp

@extends('emails.layout')

@section('content')
  <p class="lead">Estimado/a <strong>{{ optional($reserva->reservable)->name ?? 'cliente' }}</strong>,</p>
  <p class="muted">Su reserva se ha creado correctamente. A continuación los detalles:</p>

  <table class="table" role="presentation">
    <tbody>
    <tr><td class="table-key w-140">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
    <tr><td class="table-key">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
    <tr><td class="table-key">Check-out</td><td>{{ $reserva->check_out }}</td></tr>
    <tr><td class="table-key">Precio</td><td>€{{ $reserva->precio_total }}</td></tr>
    </tbody>
  </table>

  <div class="center-block">
    <p class="strong-label">Tu código QR de reserva</p>
    <img alt="QR Reserva {{ $reserva->localizador }}" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&amp;data={{ urlencode($reserva->localizador) }}" class="qr-img">
  </div>

  <p class="strong-label">Habitaciones asignadas</p>
  <ul class="list">
    @foreach($reserva->habitaciones as $hr)
      <li class="list-item">#{{ $hr->habitacion?->numero ?? 'N/A' }} — {{ $hr->habitacion?->tipo ?? ($hr->tipo ?? 'N/A') }} (€{{ $hr->precio }})</li>
    @endforeach
  </ul>

  <p class="muted">Gracias por elegirnos.</p>
@endsection
