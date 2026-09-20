import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureDbReady } from "@/lib/ensure-db"
import { getStripe, STRIPE_ENABLED } from "@/lib/stripe"

/// POST /api/checkout-cooperatives
/// Erstellt eine Stripe Checkout Session fuer den einmaligen Kauf
/// der Genossenschafts-Liste (CHF 29.90).
export async function POST(req: Request) {
  await ensureDbReady()
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Bitte zuerst einloggen." },
      { status: 401 },
    )
  }

  let body: any = {}
  try {
    body = await req.json()
  } catch {
    body = {}
  }

  // URL aus Request-Header ableiten
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
    : `${baseUrl}/?coop=success`
  const cancelPath = body.cancelUrl?.startsWith("http")
    ? body.cancelUrl
    : `${baseUrl}/?coop=cancel`

  // User finden oder erstellen
  let user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { cooperativePurchase: true },
  })
  if (!user) {
    const bcryptjs = (await import("bcryptjs")).default
    user = await db.user.create({
      data: {
        email: session.user.email,
        name: session.user.name || null,
        passwordHash: await bcryptjs.hash(Math.random().toString(36).slice(2), 10),
        subscriptionStatus: "none",
      },
      include: { cooperativePurchase: true },
    })
  }

  // Bereits gekauft?
  if (user.cooperativePurchase?.status === "paid") {
    return NextResponse.json({
      alreadyPurchased: true,
      message: "Du hast die Genossenschafts-Liste bereits freigeschaltet.",
    })
  }

  // Demo-Modus
  if (!STRIPE_ENABLED) {
    if (user.cooperativePurchase) {
      await db.cooperativePurchase.update({
        where: { userId: user.id },
        data: { status: "paid", purchasedAt: new Date(), stripePaymentId: "demo" },
      })
    } else {
      await db.cooperativePurchase.create({
        data: {
          userId: user.id,
          status: "paid",
          purchasedAt: new Date(),
          stripePaymentId: "demo",
        },
      })
    }
    return NextResponse.json({
      demo: true,
      success: true,
      url: successPath,
      message: "Demo: Genossenschafts-Liste freigeschaltet.",
    })
  }

  // Produktiv-Modus: Stripe Checkout (one-time payment)
  const stripe = getStripe()!
  try {
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: user.stripeCustomerId ? undefined : user.email,
      customer: user.stripeCustomerId ?? undefined,
      line_items: [
        {
          price_data: {
            currency: "chf",
            product_data: {
              name: "Genossenschafts-Liste Zürich",
              description:
                "Einmaliger Kauf: Kontaktliste von 10 Wohnbaugenossenschaften in Zürich mit günstigem Wohnraum.",
            },
            unit_amount: 2990, // 29.90 CHF
          },
          quantity: 1,
        },
      ],
      currency: "chf",
      success_url: successPath,
      cancel_url: cancelPath,
      metadata: {
        userId: user.id,
        email: user.email,
        type: "cooperative_list",
      },
      locale: "de",
    })

    return NextResponse.json({
      success: true,
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    })
  } catch (e: any) {
    console.error("Cooperative checkout error:", e)
    return NextResponse.json(
      { error: e?.message ?? "Checkout fehlgeschlagen" },
      { status: 500 },
    )
  }
}
