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
  <p style="margin:0 0 8px 0;font-size:16px;">Hola,</p>
  <p style="margin:0 0 12px 0;color:#555;">Su solicitud de reembolso para la reserva <strong>{{ $refundRequest->reserva->localizador ?? 'N/D' }}</strong> ha sido <strong>{{ $statusLabel }}</strong>.</p>

  <table class="table" role="presentation">
    <tr><td style="font-weight:600;width:180px;color:#444;">ID solicitud</td><td>{{ $refundRequest->id }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Solicitado</td><td>€{{ number_format(($refundRequest->requested_amount_cents ?? 0)/100, 2) }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Procesado</td><td>{{ $refundRequest->processed_at ?? 'N/D' }}</td></tr>
    <tr><td style="font-weight:600;color:#444;">Estado</td><td>{{ ucfirst($statusLabel) }}</td></tr>
  </table>

  @if(!empty($refundRequest->admin_reason))
    <p style="margin:8px 0 12px 0;font-weight:600;color:#444;">Motivo del administrador</p>
    <div style="background:#f9f9f9;border:1px solid #eee;padding:12px;border-radius:6px;color:#333;margin-bottom:12px;">{{ $refundRequest->admin_reason }}</div>
  @endif

  <p style="margin:0;color:#666;">Si tiene preguntas, contacte con soporte.</p>
@endsection
