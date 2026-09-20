// Stripe-Client mit Demo-Modus-Unterstützung.
// Wenn keine echten STRIPE_SECRET_KEY vorhanden sind, arbeitet die App
// im Demo-Modus: der "Checkout" wird simuliert und das Abo sofort aktiviert.
//
// Abo-Modell: WOECHENTLICH (5.90 CHF / Woche)
import Stripe from "stripe"

export const STRIPE_ENABLED = Boolean(process.env.STRIPE_SECRET_KEY)

export const STRIPE_PRICE = 590 // 5.90 CHF -> in Rappen
export const STRIPE_CURRENCY = "chf"

/// Abrechnungsintervall
export const BILLING_INTERVAL = "week" as const
export const INTERVAL_DAYS = 7

let _stripe: Stripe | null = null

export function getStripe(): Stripe | null {
  if (!STRIPE_ENABLED) return null
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: "2025-08-27.basil" as any,
    })
  }
  return _stripe
}

/// Die woechentliche Abo-Summe als formatierter String
export const PRICE_LABEL = "CHF 5.90 / Woche"
export const PRICE_AMOUNT = 5.9
