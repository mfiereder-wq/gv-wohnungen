import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { getStripe, STRIPE_ENABLED } from "@/lib/stripe"

/// POST /api/portal
/// Erstellt eine Stripe Billing Portal Session (Abo kündigen / Zahlungsart anpassen).
/// Im Demo-Modus wird das Abo sofort gekuendigt.
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Nicht eingeloggt" },
      { status: 401 },
    )
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
  })
  if (!user) {
    return NextResponse.json({ error: "Nutzer nicht gefunden" }, { status: 404 })
  }
  if (user.subscriptionStatus !== "active" && user.subscriptionStatus !== "trialing") {
    return NextResponse.json(
      { error: "Kein aktives Abo vorhanden" },
      { status: 400 },
    )
  }

  // === DEMO-MODUS ===
  if (!STRIPE_ENABLED) {
    await db.subscription.update({
      where: { userId: user.id },
      data: {
        status: "canceled",
        cancelAtPeriodEnd: false,
      },
    })
    await db.user.update({
      where: { id: user.id },
      data: { subscriptionStatus: "canceled" },
    })
    return NextResponse.json({
      demo: true,
      canceled: true,
      message: "Demo: Abo wurde sofort gekuendigt.",
    })
  }

  // === PRODUKTIV-MODUS ===
  const stripe = getStripe()!
  if (!user.stripeCustomerId) {
    return NextResponse.json(
      { error: "Keine Stripe-Kunden-ID hinterlegt" },
      { status: 400 },
    )
  }
  const baseUrl =
    process.env.NEXTAUTH_URL && !process.env.NEXTAUTH_URL.includes("vercel.app")
      ? process.env.NEXTAUTH_URL
      : `https://${req.headers.get("x-forwarded-host") || req.headers.get("host") || "www.gv-wohnungen.online"}`
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${baseUrl}/?account=1`,
  })
  return NextResponse.json({ url: portalSession.url })
}
