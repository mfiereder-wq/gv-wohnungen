import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureDbReady } from "@/lib/ensure-db"
import { hasActiveSubscription } from "@/lib/session"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

/// GET /api/cooperatives
/// Liefert die Liste der Genossenschaften.
/// Kontaktdaten (Telefon, E-Mail) nur fuer User, die das Add-on gekauft haben.
export async function GET() {
  await ensureDbReady()
  const session = await getServerSession(authOptions)

  // Pruefen ob der User das Add-on gekauft hat
  let hasCoopAccess = false
  let userId: string | null = null
  if (session?.user?.email) {
    const user = await db.user.findUnique({
      where: { email: session.user.email },
      include: { cooperativePurchase: true },
    })
    if (user) {
      userId = user.id
      hasCoopAccess = user.cooperativePurchase?.status === "paid"
    }
  }

  const cooperatives = await db.cooperative.findMany({
    orderBy: { name: "asc" },
  })

  const result = cooperatives.map((c) => ({
    id: c.id,
    name: c.name,
    size: c.size,
    address: c.address,
    website: c.website,
    applicationInfo: c.applicationInfo,
    // Geschuetzte Felder nur mit Add-on-Kauf
    phone: hasCoopAccess ? c.phone : null,
    email: hasCoopAccess ? c.email : null,
    gated: !hasCoopAccess,
  }))

  return NextResponse.json({
    cooperatives: result,
    total: result.length,
    hasAccess: hasCoopAccess,
    userId,
  })
}
