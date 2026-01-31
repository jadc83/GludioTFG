<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $subject ?? config('app.name') }}</title>
    <style>
      body { margin:0;padding:0;background-color:#E2E0DC;font-family:Inter, Arial, Helvetica, sans-serif;color:#222; }
      .wrapper { width:100%;padding:24px 0;background-color:#E2E0DC }
      .card { background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 6px rgba(0,0,0,0.06);width:100%;max-width:600px;margin:0 auto }
      .card-header { background:#83122A;padding:18px 24px;color:#fff;font-size:20px;font-weight:700; }
      .card-body { padding:20px 24px;color:#333 }
      .card-footer { background:#f7f7f7;padding:12px 24px;font-size:13px;color:#777;text-align:center }
      .muted { color:#666 }
      .btn { display:inline-block;background:#83122A;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:700 }
      .table { width:100%;margin:12px 0;border-collapse:collapse }
      .table td { padding:6px 0 }
    </style>
  </head>
  @php
    $title = $title ?? 'Hotel GLudio';
    $preheader = $preheader ?? '';
  @endphp

  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>{{ $title }}</title>
      <style>
        body { margin:0; padding:0; background-color:#E2E0DC; font-family:Inter, Arial, Helvetica, sans-serif; color:#222; }
        .container { width:100%; max-width:600px; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 2px 6px rgba(0,0,0,0.06); }
        .header { background:#83122A; padding:18px 24px; color:#fff; font-size:20px; font-weight:700; }
        .content { padding:20px 24px; color:#333; }
        .footer { background:#f7f7f7; padding:12px 24px; font-size:13px; color:#777; text-align:center; }
        .table { width:100%; margin-bottom:12px; }
      </style>
    </head>
    <body>
      <span style="display:none;">{{ $preheader }}</span>
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#E2E0DC;padding:24px 0;">
        <tr>
          <td align="center">
            <table class="container" cellpadding="0" cellspacing="0" role="presentation">
              <tr>
                <td class="header">{{ $title }}</td>
              </tr>
              <tr>
                <td class="content">@yield('content')</td>
              </tr>
              <tr>
                <td class="footer"><small>Hotel GLudio — Si tienes preguntas responde a este correo.</small></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
