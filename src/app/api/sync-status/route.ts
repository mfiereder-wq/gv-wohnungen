import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { APIFY_ENABLED, getRateLimitStatus } from "@/lib/apify"
import { ensureDbReady } from "@/lib/ensure-db"

/// GET /api/sync-status
/// Liefert Statusinformationen zum Flatfox-Sync inkl. Rate-Limit.
export async function GET() {
  await ensureDbReady()
  const [flatfoxCount, manualCount, totalCount] = await Promise.all([
    db.property.count({ where: { source: "flatfox" } }),
    db.property.count({ where: { source: "manual" } }),
    db.property.count(),
  ])

  return NextResponse.json({
    apifyEnabled: APIFY_ENABLED,
    flatfoxCount,
    manualCount,
    totalCount,
    rateLimit: getRateLimitStatus(),
  })
}
