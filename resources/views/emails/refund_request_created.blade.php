@php
  $subject = "Nueva solicitud de reembolso — " . ($refundRequest->reserva->localizador ?? '');
  $title = "Nueva solicitud de reembolso";
  $preheader = "Se ha creado una nueva solicitud de reembolso para la reserva " . ($refundRequest->reserva->localizador ?? '');

  $rawStatus = strtolower($refundRequest->status ?? 'pendiente');
  $statusMap = [
    'pending' => 'pendiente',
    'approved' => 'aprobada',
    'accepted' => 'aceptada',
    'rejected' => 'rechazada',
    'processed' => 'procesada',
  ];
  $statusLabel = $statusMap[$rawStatus] ?? ucfirst($rawStatus);
@endphp

@extends('emails.layout')

@section('content')
  <p class="lead">Hola,</p>
  <p class="muted">Se ha creado una nueva solicitud de reembolso relacionada con la reserva <strong>{{ $refundRequest->reserva->localizador ?? 'N/D' }}</strong>.</p>

  <table class="table" role="presentation">
    <tbody>
    <tr><td class="table-key w-180">ID solicitud</td><td>{{ $refundRequest->id }}</td></tr>
    <tr><td class="table-key">Reserva</td><td>{{ $refundRequest->reserva->localizador ?? 'N/D' }}</td></tr>
    <tr><td class="table-key">Solicitado</td><td>€{{ number_format(($refundRequest->requested_amount_cents ?? 0)/100, 2) }}</td></tr>
    <tr><td class="table-key">Penalización</td><td>€{{ number_format(($refundRequest->penalty_cents ?? 0)/100, 2) }}</td></tr>
    <tr><td class="table-key">Estado</td><td>{{ ucfirst($statusLabel) }}</td></tr>
    </tbody>
  </table>

  @if(!empty($refundRequest->notes))
    <p class="strong-label">Notas</p>
    <div class="note-box">{{ $refundRequest->notes }}</div>
  @endif

  <p class="muted">Puedes ver y gestionar la solicitud en el panel administrativo.</p>
@endsection
