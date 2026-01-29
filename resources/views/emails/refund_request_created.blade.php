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
  <p style="margin:0 0 8px 0;font-size:16px;">Hola,</p>
  <p style="margin:0 0 12px 0;color:#555;">Se ha creado una nueva solicitud de reembolso relacionada con la reserva <strong>{{ $refundRequest->reserva->localizador ?? 'N/D' }}</strong>.</p>

  <table class="table" role="presentation">
    <tr><td style="font-weight:600;width:180px;color:#444;">ID solicitud</td><td>{{ $refundRequest->id }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Reserva</td><td>{{ $refundRequest->reserva->localizador ?? 'N/D' }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Solicitado</td><td>€{{ number_format(($refundRequest->requested_amount_cents ?? 0)/100, 2) }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Penalización</td><td>€{{ number_format(($refundRequest->penalty_cents ?? 0)/100, 2) }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Estado</td><td>{{ ucfirst($statusLabel) }}</td></tr>
  </table>

  @if(!empty($refundRequest->notes))
    <p style="margin:8px 0 12px 0;font-weight:600;color:#444;">Notas</p>
    <div style="background:#f9f9f9;border:1px solid #eee;padding:12px;border-radius:6px;color:#333;margin-bottom:12px;">{{ $refundRequest->notes }}</div>
  @endif

  <p style="margin:0;color:#666;">Puedes ver y gestionar la solicitud en el panel administrativo.</p>
@endsection
