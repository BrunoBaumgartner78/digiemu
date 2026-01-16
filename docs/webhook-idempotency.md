# Stripe Webhook Idempotency (v1.0 Stabilisierung)

Stripe sendet Webhook-Events ggf. mehrfach (Retries / Netzwerk / Timeouts).
Damit keine doppelten Orders/DownloadLinks entstehen, wird `event.id` serverseitig
in der DB "geclaimed".

## Umsetzung
- Prisma Model: `StripeWebhookEvent` mit `eventId @unique`
- Webhook Route:
  - nach Signatur-Verifikation: `stripeWebhookEvent.create({ eventId: event.id })`
  - bei `P2002`: Duplicate → sofort `200 OK`

## Migration
```bash
npx prisma migrate dev -n stripe_webhook_idempotency
```

## Test
- Stripe CLI: `stripe listen --forward-to http://localhost:3000/api/webhook`
- Checkout durchführen
- Bei wiederholten Events sollte der Server `duplicate: true` loggen und 200 liefern.
