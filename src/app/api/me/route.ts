import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { ensureDbReady } from "@/lib/ensure-db"

/// GET /api/me
/// Liefert die Konto- und Abo-Informationen des eingeloggten Nutzers.
export async function GET() {
  await ensureDbReady()
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ user: null })
  }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    include: { subscription: true },
  })
  if (!user) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      subscriptionStatus: user.subscriptionStatus,
      stripeCustomerId: user.stripeCustomerId,
      subscription: user.subscription
        ? {
            status: user.subscription.status,
            currentPeriodStart: user.subscription.currentPeriodStart,
            currentPeriodEnd: user.subscription.currentPeriodEnd,
            cancelAtPeriodEnd: user.subscription.cancelAtPeriodEnd,
          }
        : null,
    },
  })
}
