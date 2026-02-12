@php
  $rawStatus = strtolower($refundRequest->status ?? 'procesada');
  $statusMap = [
    'pending' => 'pendiente',
    'approved' => 'aprobada',
    'accepted' => 'aceptada',
    'rejected' => 'rechazada',
    'processed' => 'procesada',
  ];
  $statusLabel = $statusMap[$rawStatus] ?? ucfirst($rawStatus);
  $title = 'Solicitud de reembolso ' . ucfirst($statusLabel);
  $preheader = 'Estado de su solicitud de reembolso: ' . ucfirst($statusLabel);
@endphp

@extends('emails.layout')

@section('content')
  <p class="lead">Hola,</p>
  <p class="muted">Su solicitud de reembolso para la reserva <strong>{{ $refundRequest->reserva->localizador ?? 'N/D' }}</strong> ha sido <strong>{{ $statusLabel }}</strong>.</p>

    <table class="table" role="presentation">
      <tbody>
      <tr><td class="table-key w-180">ID solicitud</td><td>{{ $refundRequest->id }}</td></tr>
      <tr><td class="table-key">Solicitado</td><td>€{{ number_format(($refundRequest->requested_amount_cents ?? 0)/100, 2) }}</td></tr>
      <tr><td class="table-key">Procesado</td><td>{{ $refundRequest->processed_at ?? 'N/D' }}</td></tr>
      <tr><td class="table-key">Estado</td><td>{{ ucfirst($statusLabel) }}</td></tr>
      </tbody>
    </table>

  @if(!empty($refundRequest->admin_reason))
    <p class="strong-label">Motivo del administrador</p>
    <div class="note-box">{{ $refundRequest->admin_reason }}</div>
  @endif

  <p class="muted">Si tiene preguntas, contacte con soporte.</p>
@endsection
