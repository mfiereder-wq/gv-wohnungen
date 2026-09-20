import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { hasActiveSubscription } from "@/lib/session"
import { cleanupStaleProperties } from "@/lib/property-cache"
import { proxyImageUrls } from "@/lib/image-proxy"
import { ensureDbReady } from "@/lib/ensure-db"

function safeParseImages(raw: string): string[] {
  try {
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  await ensureDbReady()
  // TTL-Cleanup (kurz, laeuft im Hintergrund)
  cleanupStaleProperties().catch(() => {})

  const { id } = await params
  const p = await db.property.findUnique({ where: { id } })
  if (!p) {
    return NextResponse.json(
      { error: "Inserat nicht gefunden" },
      { status: 404 },
    )
  }
  const sub = await hasActiveSubscription()
  const hasAccess = sub.active

  const hasDirectContact = Boolean(
    p.contactName || p.contactEmail || p.contactPhone,
  )

  const property = {
    id: p.id,
    title: p.title,
    description: p.description,
    rent: p.rent,
    utilities: p.utilities,
    rooms: p.rooms,
    area: p.area,
    zip: p.zip,
    city: p.city,
    canton: p.canton,
    images: proxyImageUrls(safeParseImages(p.images)),
    availableFrom: p.availableFrom,
    createdAt: p.createdAt,
    fetchedAt: p.fetchedAt,
    source: p.source ?? "flatfox",
    // Geschuetzte Felder: originalLink + submitUrl immer fuer Premium,
    // auch ohne direkte Kontaktdaten.
    contact: hasAccess
      ? {
          contactName: p.contactName || null,
          contactEmail: p.contactEmail || null,
          contactPhone: p.contactPhone || null,
          originalLink: p.originalLink,
          submitUrl: p.submitUrl || null,
          hasDirectContact,
        }
      : null,
    gated: !hasAccess,
  }

  return NextResponse.json({ property, hasAccess })
}
