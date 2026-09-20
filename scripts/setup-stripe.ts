/* Stripe-Setup-Skript
   Erstellt das Stripe-Produkt, den woechentlichen Preis und den Webhook-Endpoint.
   
   Voraussetzung: STRIPE_SECRET_KEY in .env setzen.
   Ausfuehren mit: bun run scripts/setup-stripe.ts
   
   Erstellt:
   1. Produkt "GV Wohnungen Abo"
   2. Preis: 5.90 CHF / Woche (recurring)
   3. Webhook-Endpoint: https://www.gv-wohnungen.online/api/webhooks/stripe
      mit Events: checkout.session.completed, customer.subscription.*,
      invoice.payment_failed
*/
import Stripe from "stripe"

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const WEBHOOK_URL =
  process.env.STRIPE_WEBHOOK_URL ||
  "https://www.gv-wohnungen.online/api/webhooks/stripe"

if (!STRIPE_SECRET_KEY) {
  console.error(
    "STRIPE_SECRET_KEY ist nicht gesetzt. Bitte in .env eintragen:\n" +
      "STRIPE_SECRET_KEY=sk_live_... oder sk_test_...",
  )
  process.exit(1)
}

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2025-08-27.basil" as any,
})

async function main() {
  console.log("=== Stripe-Setup fuer GV Wohnungen ===\n")

  // 1. Produkt erstellen (oder vorhandenes suchen)
  console.log("1. Suche/Erstelle Produkt...")
  let product: Stripe.Product
  const existingProducts = await stripe.products.list({ limit: 100 })
  const found = existingProducts.data.find((p) => p.name === "GV Wohnungen Abo")
  if (found) {
    console.log("   Produkt bereits vorhanden:", found.id)
    product = found
  } else {
    product = await stripe.products.create({
      name: "GV Wohnungen Abo",
      description:
        "Vollzugang zu allen Inserat-Links und Kontaktdaten. Woechentlich kuendbar.",
      metadata: { app: "gv-wohnungen" },
    })
    console.log("   Produkt erstellt:", product.id)
  }

  // 2. Preis erstellen (5.90 CHF / Woche)
  console.log("\n2. Suche/Erstelle Preis (5.90 CHF / Woche)...")
  let price: Stripe.Price
  const existingPrices = await stripe.prices.list({
    product: product.id,
    limit: 100,
  })
  const foundPrice = existingPrices.data.find(
    (p) =>
      p.type === "recurring" &&
      p.recurring?.interval === "week" &&
      p.unit_amount === 590 &&
      p.currency === "chf",
  )
  if (foundPrice) {
    console.log("   Preis bereits vorhanden:", foundPrice.id)
    price = foundPrice
  } else {
    price = await stripe.prices.create({
      product: product.id,
      unit_amount: 590, // 5.90 CHF in Rappen
      currency: "chf",
      recurring: {
        interval: "week",
        interval_count: 1,
      },
      metadata: { app: "gv-wohnungen" },
    })
    console.log("   Preis erstellt:", price.id)
  }

  // 3. Webhook-Endpoint erstellen
  console.log("\n3. Suche/Erstelle Webhook-Endpoint...")
  const webhookEvents = [
    "checkout.session.completed",
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.payment_failed",
    "invoice.payment_succeeded",
  ]

  let webhook: Stripe.WebhookEndpoint | null = null
  const existingWebhooks = await stripe.webhookEndpoints.list({ limit: 100 })
  const foundWebhook = existingWebhooks.data.find(
    (w) => w.url === WEBHOOK_URL,
  )
  if (foundWebhook) {
    console.log("   Webhook bereits vorhanden:", foundWebhook.id)
    webhook = foundWebhook
  } else {
    webhook = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: webhookEvents,
      description: "GV Wohnungen - Stripe-Webhook",
      metadata: { app: "gv-wohnungen" },
    })
    console.log("   Webhook erstellt:", webhook.id)
  }

  // 4. Zusammenfassung
  console.log("\n=== Setup abgeschlossen ===\n")
  console.log("Produkt-ID:", product.id)
  console.log("Preis-ID:", price.id)
  console.log("Webhook-ID:", webhook?.id)
  console.log("Webhook-URL:", WEBHOOK_URL)
  console.log("Webhook-Secret:", webhook?.secret)
  console.log("\n=== Diese Werte in .env eintragen ===\n")
  console.log(`STRIPE_PRICE_ID=${price.id}`)
  console.log(`STRIPE_WEBHOOK_SECRET=${webhook?.secret || "<von Stripe Dashboard>"}`)
  console.log(
    `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<von Stripe Dashboard: pk_live_... oder pk_test_...>`,
  )
  console.log("\nHinweis: Das Webhook-Secret wird nur einmal bei der Erstellung angezeigt.")
  console.log("Falls es nicht sichtbar ist, im Stripe Dashboard unter")
  console.log("Developers > Webhooks > [Endpoint] > Signing secret nachschauen.")
}

main().catch((e) => {
  console.error("Setup fehlgeschlagen:", e?.message || e)
  process.exit(1)
})
