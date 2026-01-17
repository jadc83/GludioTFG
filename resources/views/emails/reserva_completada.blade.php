<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reserva completada</title>
  </head>
  <body style="margin:0;padding:0;background-color:#E2E0DC;font-family:Inter, Arial, Helvetica, sans-serif;color:#222;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#E2E0DC;padding:24px 0;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.06);width:100%;max-width:600px;">
            <tr>
              <td style="background:#83122A;padding:18px 24px;color:#fff;font-size:20px;font-weight:700;">
                Reserva completada — {{ $reserva->localizador }}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;color:#333;">
                <p style="margin:0 0 8px 0;font-size:16px;">Estimado/a <strong>{{ optional($reserva->reservable)->name ?? 'cliente' }}</strong>,</p>
                <p style="margin:0 0 12px 0;color:#555;">Su reserva se ha creado correctamente. A continuación los detalles:</p>

                <table cellpadding="0" cellspacing="0" role="presentation" style="width:100%;margin-bottom:12px;">
                  <tr>
                    <td style="padding:6px 0;font-weight:600;width:140px;color:#444;">Localizador</td>
                    <td style="padding:6px 0;color:#222;">{{ $reserva->localizador }}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-weight:600;color:#444;">Check-in</td>
                    <td style="padding:6px 0;color:#222;">{{ $reserva->check_in }}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-weight:600;color:#444;">Check-out</td>
                    <td style="padding:6px 0;color:#222;">{{ $reserva->check_out }}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-weight:600;color:#444;">Precio</td>
                    <td style="padding:6px 0;color:#222;">€{{ $reserva->precio_total }}</td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0;font-weight:600;color:#444;">Estado</td>
                    <td style="padding:6px 0;color:#222;">{{ $reserva->status }}</td>
                  </tr>
                </table>

                <div style="text-align:center;margin:18px 0;">
                  <p style="margin:0 0 8px 0;font-weight:600;color:#444;">Tu código QR de reserva</p>
                  <img alt="QR Reserva {{ $reserva->localizador }}" src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={{ urlencode($reserva->localizador) }}" style="width:100%;max-width:260px;height:auto;border-radius:6px;border:4px solid #f5f5f5;display:block;margin:0 auto;" />
                </div>

                <p style="margin:12px 0 6px 0;font-weight:600;color:#444;">Habitaciones asignadas</p>
                <ul style="margin:6px 0 16px 20px;color:#333;">
                  @foreach($reserva->habitaciones as $hr)
                    <li style="margin:6px 0;">#{{ $hr->habitacion->numero ?? 'N/A' }} — {{ $hr->habitacion->tipo ?? 'N/A' }} (€{{ $hr->precio }})</li>
                  @endforeach
                </ul>

                <p style="margin:0;color:#666;">Gracias por elegirnos.</p>
              </td>
            </tr>
            <tr>
              <td style="background:#f7f7f7;padding:12px 24px;font-size:13px;color:#777;text-align:center;">
                <small>Hotel GLudio — Si tienes preguntas responde a este correo.</small>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
