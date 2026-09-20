import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureDbReady } from "@/lib/ensure-db"
import {
  getStripe,
  STRIPE_ENABLED,
  STRIPE_CURRENCY,
} from "@/lib/stripe"

/// POST /api/checkout
/// Erstellt eine Stripe Checkout Session (recurring, 5.90 CHF/Woche).
export async function POST(req: Request) {
  await ensureDbReady()
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Bitte zuerst einloggen, um das Abo abzuschliessen." },
      { status: 401 },
    )
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  // Basis-URL fuer Success/Cancel ermitteln:
  // Bevorzugt aus dem Request-Header (immer korrekt auf Vercel),
  // Fallback auf NEXTAUTH_URL env var, dann hard-coded Domain.
  const proto = req.headers.get("x-forwarded-proto") || "https"
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "www.gv-wohnungen.online"
  const baseUrl =
    process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("vercel.app")
      ? process.env.NEXTAUTH_URL
      : `${proto}://${host}`

  const successPath = body.successUrl?.startsWith("http")
    ? body.successUrl
    : `${baseUrl}/?checkout=success`
  const cancelPath = body.cancelUrl?.startsWith("http")
    ? body.cancelUrl
    : `${baseUrl}/?checkout=cancel`

  // User aus DB holen (oder automatisch anlegen falls nicht vorhanden)
  let user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  })

  if (!user) {
    // Auf Vercel (ephemeral DB): User automatisch anlegen
    const bcryptjs = (await import("bcryptjs")).default
    // Pruefen ob bereits ein Stripe-Customer existiert
    let stripeCustomerId: string | null = null
    const stripe = getStripe()
    if (stripe) {
      try {
        const customers = await stripe.customers.list({
          email: session.user.email,
          limit: 1,
        })
        if (customers.data.length > 0) {
          stripeCustomerId = customers.data[0].id
        }
      } catch {
        /* ignore */
      }
    }
    user = await db.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || null,
        passwordHash: await bcryptjs.hash(
          Math.random().toString(36).slice(2),
          10,
        ),
        subscriptionStatus: "none",
        stripeCustomerId,
      },
      include: { subscription: true },
    })
  }

  // Bereits aktiv?
  if (user.subscriptionStatus === "active") {
    return NextResponse.json({
      alreadyActive: true,
      message: "Du hast bereits ein aktives Abo.",
    })
  }

  // === DEMO-MODUS ===
  if (!STRIPE_ENABLED) {
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const fakeSubId = `sub_demo_${user.id}_${Date.now()}`
    const fakeCustId = user.stripeCustomerId ?? `cus_demo_${user.id}`

    await db.user.update({
      where: { id: user.id },
      data: { stripeCustomerId: fakeCustId, subscriptionStatus: "active" },
    })

    if (user.subscription) {
      await db.subscription.update({
        where: { userId: user.id },
        data: {
          stripeSubscriptionId: fakeSubId,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      })
    } else {
      await db.subscription.create({
        data: {
          userId: user.id,
          stripeSubscriptionId: fakeSubId,
          status: "active",
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      })
    }

    return NextResponse.json({
      demo: true,
      success: true,
      url: successPath,
      message: "Demo-Checkout: Abo wurde sofort aktiviert.",
    })
  }

  // === PRODUKTIV-MODUS (Stripe) ===
  const stripe = getStripe()!
  const customerId = user.stripeCustomerId ?? undefined

  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      currency: STRIPE_CURRENCY,
      success_url: successPath,
      cancel_url: cancelPath,
      metadata: {
        userId: user.id,
        email: user.email,
      },
      subscription_data: {
        metadata: { userId: user.id, email: user.email },
      },
      allow_promotion_codes: false,
      locale: "de",
    })

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (e: any) {
    console.error("Stripe Checkout Fehler:", e)
    return NextResponse.json(
      { error: e?.message ?? "Checkout fehlgeschlagen" },
      { status: 500 },
    )
  }
}
