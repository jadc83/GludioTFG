E2E: Checkout + Webhook (local)

This project includes a helper script to run a basic local E2E flow using the Stripe CLI and internal test scripts.

Usage (PowerShell, Windows):

1) Create a checkout session for a reservation (by localizador):
   php scripts/test_create_checkout_session.php {LOCALIZADOR}

2) Start forwarding Stripe webhooks to your local app (if not already running):
   "C:\Program Files\stripe-cli\stripe.exe" listen --forward-to "http://127.0.0.1:8000/webhooks/stripe"

3) Re-send an event (for example a Checkout session completed):
   "C:\Program Files\stripe-cli\stripe.exe" events resend {EVENT_ID}

Automated helper:
- Use `scripts\e2e_checkout_and_resend.ps1 -localizador {LOCAL} -eventId {EVENT_ID}` which will:
  - Run the PHP script to create a Checkout session for the given reservation.
  - Start `stripe listen --forward-to` in a new PowerShell window (if Stripe CLI available).
  - Re-send the given event ID.

Notes:
- You will need a valid Stripe CLI installation and access to an event id (evt_... field in Stripe Dashboard).
- E2E scenarios require the local Laravel server running (e.g. `php artisan serve --host=127.0.0.1 --port=8000`).
- These helpers are intended for local manual E2E. Automating full E2E in CI requires environment setup for Stripe and is out of scope of the quick script.
