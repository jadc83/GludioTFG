@php
  $subject = "Reserva cancelada — {$reserva->localizador}";
  $title = "Reserva cancelada — {$reserva->localizador}";
  $preheader = "Su reserva ha sido cancelada. Información y motivos (si procede).";
@endphp

@extends('emails.layout')

@section('content')
  <p class="lead">Estimado/a <strong>{{ optional($reserva->reservable)->name ?? 'cliente' }}</strong>,</p>
  <p class="muted">Le informamos que su reserva ha sido cancelada. Si cree que se trata de un error o desea más información, por favor contacte con nuestro equipo.</p>

  <table class="table" role="presentation">
    <tr><td class="table-key w-140">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
    <tr><td class="table-key">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
    <tr><td class="table-key">Check-out</td><td>{{ $reserva->check_out }}</td></tr>
      <tbody>
      <tr><td class="table-key w-140">Localizador</td><td>{{ $reserva->localizador }}</td></tr>
      <tr><td class="table-key">Check-in</td><td>{{ $reserva->check_in }}</td></tr>
      <tr><td class="table-key">Check-out</td><td>{{ $reserva->check_out }}</td></tr>
      <tr><td class="table-key">Precio</td><td>€{{ $reserva->precio_total }}</td></tr>
      </tbody>
    </table>

  @if(!empty($motivo))
    <p class="strong-label">Motivo de la cancelación</p>
    <div class="note-box">{{ $motivo }}</div>
  @endif

  <p class="strong-label">Habitaciones</p>
  <ul class="list">
    @foreach($reserva->habitaciones as $hr)
      <li class="list-item">#{{ $hr->habitacion?->numero ?? 'N/A' }} — {{ $hr->habitacion?->tipo ?? ($hr->tipo ?? 'N/A') }} (€{{ $hr->precio }})</li>
    @endforeach
  </ul>

  <p class="muted">Gracias por su atención.</p>
@endsection
