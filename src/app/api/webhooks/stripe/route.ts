import { NextResponse } from "next/server"
import { headers } from "next/headers"
import { db } from "@/lib/db"
import { ensureDbReady } from "@/lib/ensure-db"
import { getStripe, STRIPE_ENABLED } from "@/lib/stripe"
import bcryptjs from "bcryptjs"

/// POST /api/webhooks/stripe
/// Verarbeitet Stripe-Webhooks und aktualisiert die Nutzerberechtigung sofort.
/// Behandelte Events:
///  - checkout.session.completed   -> Abo aktivieren
///  - customer.subscription.updated -> Status aktualisieren
///  - customer.subscription.deleted -> Abo deaktivieren
///  - invoice.payment_failed       -> Status auf past_due
export async function POST(req: Request) {
  await ensureDbReady()
  const body = await req.text()
  const headersList = await headers()
  const sig = headersList.get("stripe-signature")

  // Demo-Modus: ohne Stripe wird dieser Endpunkt nicht von Stripe aufgerufen.
  if (!STRIPE_ENABLED) {
    return NextResponse.json({
      received: true,
      demo: true,
      message: "Demo-Modus: Webhook nicht aktiv (keine echten Stripe-Keys).",
    })
  }

  const stripe = getStripe()!
  let event: any

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig ?? "",
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err: any) {
    return NextResponse.json(
      { error: `Webhook-Signatur ungueltig: ${err.message}` },
      { status: 400 },
    )
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const cs = event.data.object
        const userId = cs.metadata?.userId ?? cs.client_reference_id
        const customerId = cs.customer as string
        const subscriptionId = cs.subscription as string
        const email = cs.customer_email || cs.customer_details?.email || cs.metadata?.email
        const paymentType = cs.metadata?.type

        // Einmaliger Kauf: Genossenschafts-Liste
        if (paymentType === "cooperative_list" && userId) {
          await upsertCooperativePurchase(userId, cs.id, email)
          // Stripe Customer-ID am User speichern (falls neu)
          if (customerId) {
            await db.user.update({
              where: { id: userId },
              data: { stripeCustomerId: customerId },
            }).catch(() => {})
          }
          break
        }

        // Normale Subscription
        if (!subscriptionId) break
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const status = mapStripeStatus(subscription.status)

        await upsertSubscription({
          userId: userId || undefined,
          stripeCustomerId: customerId,
          stripeSubscriptionId: subscriptionId,
          status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          email: email || undefined,
        })
        break
      }

      case "customer.subscription.updated": {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        const email = sub.metadata?.email
        const status = mapStripeStatus(sub.status)
        if (userId) {
          // Upsert: falls Subscription-Eintrag fehlt, erstellen
          const existing = await db.subscription.findUnique({ where: { userId } })
          if (existing) {
            await db.subscription.update({
              where: { userId },
              data: {
                status,
                currentPeriodStart: new Date(sub.current_period_start * 1000),
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end,
                stripeSubscriptionId: sub.id,
              },
            })
          } else {
            await db.subscription.create({
              data: {
                userId,
                stripeSubscriptionId: sub.id,
                status,
                currentPeriodStart: new Date(sub.current_period_start * 1000),
                currentPeriodEnd: new Date(sub.current_period_end * 1000),
                cancelAtPeriodEnd: sub.cancel_at_period_end,
              },
            })
          }
          await db.user.update({
            where: { id: userId },
            data: { subscriptionStatus: status },
          })
        }
        break
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object
        const userId = sub.metadata?.userId
        if (userId) {
          await db.subscription.update({
            where: { userId },
            data: {
              status: "canceled",
              cancelAtPeriodEnd: false,
            },
          })
          await db.user.update({
            where: { id: userId },
            data: { subscriptionStatus: "canceled" },
          })
        }
        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object
        const customerId = invoice.customer as string
        const user = await db.user.findFirst({
          where: { stripeCustomerId: customerId },
        })
        if (user) {
          await db.user.update({
            where: { id: user.id },
            data: { subscriptionStatus: "past_due" },
          })
          if (user.subscription) {
            await db.subscription.update({
              where: { userId: user.id },
              data: { status: "past_due" },
            })
          }
        }
        break
      }

      case "checkout.session.completed": {
        // Diese Event wird oben schon behandelt, aber hier fuer
        // one-time payments (Genossenschafts-Liste) ergaenzen.
        // Wird nur erreicht wenn der erste Handler es nicht war.
        break
      }

      default:
        // Ignoriere nicht behandelte Events
        break
    }

    return NextResponse.json({ received: true })
  } catch (e: any) {
    console.error("Webhook-Verarbeitungsfehler:", e)
    return NextResponse.json(
      { error: e?.message ?? "Webhook-Verarbeitungsfehler" },
      { status: 500 },
    )
  }
}

function mapStripeStatus(s: string): string {
  switch (s) {
    case "active":
      return "active"
    case "trialing":
      return "trialing"
    case "past_due":
      return "past_due"
    case "canceled":
      return "canceled"
    case "incomplete":
    case "incomplete_expired":
      return "incomplete"
    default:
      return "none"
  }
}

async function upsertSubscription(args: {
  userId?: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  email?: string
}) {
  // User finden (per userId oder stripeCustomerId)
  let user = args.userId
    ? await db.user.findUnique({ where: { id: args.userId } })
    : await db.user.findFirst({ where: { stripeCustomerId: args.stripeCustomerId } })

  // Falls nicht gefunden und E-Mail vorhanden: per E-Mail suchen oder erstellen
  if (!user && args.email) {
    user = await db.user.findUnique({ where: { email: args.email } })
    if (!user) {
      // Neuen User anlegen (Webhook kommt vor Login)
      user = await db.user.create({
        data: {
          email: args.email,
          passwordHash: await bcryptjs.hash(Math.random().toString(36).slice(2), 10),
          subscriptionStatus: args.status,
          stripeCustomerId: args.stripeCustomerId,
        },
      })
    }
  }

  if (!user) {
    console.error("Webhook: User nicht gefunden und keine E-Mail")
    return
  }

  await db.user.update({
    where: { id: user.id },
    data: {
      stripeCustomerId: args.stripeCustomerId,
      subscriptionStatus: args.status,
    },
  })
  const existing = await db.subscription.findUnique({
    where: { userId: user.id },
  })
  if (existing) {
    await db.subscription.update({
      where: { userId: user.id },
      data: {
        stripeSubscriptionId: args.stripeSubscriptionId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      },
    })
  } else {
    await db.subscription.create({
      data: {
        userId: user.id,
        stripeSubscriptionId: args.stripeSubscriptionId,
        status: args.status,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      },
    })
  }
}

/// Erstellt oder aktualisiert den Genossenschafts-Kauf fuer einen User.
async function upsertCooperativePurchase(
  userId: string,
  paymentId: string,
  email?: string,
) {
  // User finden
  let user = await db.user.findUnique({ where: { id: userId } })
  if (!user && email) {
    user = await db.user.findUnique({ where: { email } })
  }
  if (!user) {
    console.error("Coop-Purchase: User nicht gefunden")
    return
  }

  const existing = await db.cooperativePurchase.findUnique({
    where: { userId: user.id },
  })
  if (existing) {
    await db.cooperativePurchase.update({
      where: { userId: user.id },
      data: {
        status: "paid",
        purchasedAt: new Date(),
        stripePaymentId: paymentId,
      },
    })
  } else {
    await db.cooperativePurchase.create({
      data: {
        userId: user.id,
        status: "paid",
        purchasedAt: new Date(),
        stripePaymentId: paymentId,
      },
    })
  }
}
