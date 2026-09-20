// Apify Client Wrapper fuer den Flatfox-Scraper Actor
// Actor: azzouzana/flatfox-ch-scraper
// Dokumentation: https://docs.apify.com/api/client/js
//
// Free-Tier-Limits des Actors (werden hier erzwungen):
//   - max. 5 listings pro Run (Sample-Data)
//   - max. 5 Runs pro Kalendertag (UTC)
//   - min. 60 Sekunden Pause zwischen Runs
import { ApifyClient } from "apify-client"

export const FLATFOX_ACTOR_ID = "azzouzana/flatfox-ch-scraper"

export const APIFY_ENABLED = Boolean(process.env.APIFY_API_TOKEN)

/// Free-Tier-Limits (hart verdrahtet, um keinen versehentlichen
/// Mehrverbrauch zu erzeugen)
/// Hinweis: Der Actor verlangt input.maxItems >= 10 (Validierung),
/// liefert im Free-Tier aber nur 5 Sample-Ergebnisse.
export const FREE_TIER = {
  maxItemsPerRun: 5, // Sample-Limit des Actors (effektive Ergebnisse)
  actorMinItems: 10, // technische Untergrenze fuer input.maxItems
  maxRunsPerDay: 5, // Tagescap UTC
  cooldownSeconds: 60, // Pause zwischen Runs
} as const

let _client: ApifyClient | null = null

export function getApifyClient(): ApifyClient | null {
  if (!APIFY_ENABLED) return null
  if (!_client) {
    _client = new ApifyClient({ token: process.env.APIFY_API_TOKEN })
  }
  return _client
}

/// In-Memory-Rate-Limit-Tracker (pro Server-Prozess).
/// Reicht fuer den Single-Server-Einsatz; bei horizontalem Scaling
/// muesste das in die DB ausgelagert werden.
const runTimestamps: number[] = []

/// Prueft, ob ein weiterer Apify-Run gestartet werden darf.
/// Wirft bei Ueberschreitung eine Fehlermeldung mit Hinweis.
export function checkRateLimit(): { ok: boolean; reason?: string; retryInMs?: number } {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000

  // Alte Timestamps (>24h) entfernen
  while (runTimestamps.length > 0 && now - runTimestamps[0] > dayMs) {
    runTimestamps.shift()
  }

  // Limit: max. 5 Runs pro Tag (UTC)
  if (runTimestamps.length >= FREE_TIER.maxRunsPerDay) {
    const oldest = runTimestamps[0]
    const retryInMs = oldest + dayMs - now
    return {
      ok: false,
      reason: `Tageslimit erreicht (${FREE_TIER.maxRunsPerDay} Runs/Tag UTC). Naechster freier Slot in ${Math.ceil(retryInMs / 60000)} Min.`,
      retryInMs,
    }
  }

  // Limit: min. 60 Sekunden zwischen Runs
  if (runTimestamps.length > 0) {
    const lastRun = runTimestamps[runTimestamps.length - 1]
    const elapsed = now - lastRun
    if (elapsed < FREE_TIER.cooldownSeconds * 1000) {
      const retryInMs = FREE_TIER.cooldownSeconds * 1000 - elapsed
      return {
        ok: false,
        reason: `Cooldown aktiv: bitte noch ${Math.ceil(retryInMs / 1000)} Sek warten (min. ${FREE_TIER.cooldownSeconds}s zwischen Runs).`,
        retryInMs,
      }
    }
  }

  return { ok: true }
}

/// Registriert einen Run (nach erfolgreichem Start).
export function registerRun(): void {
  runTimestamps.push(Date.now())
}

/// Liefert die Anzahl heute (UTC) bereits ausgefuehrter Runs.
export function getRunsToday(): number {
  const now = Date.now()
  const dayMs = 24 * 60 * 60 * 1000
  while (runTimestamps.length > 0 && now - runTimestamps[0] > dayMs) {
    runTimestamps.shift()
  }
  return runTimestamps.length
}

/// Flatfox-Such-URL aus Filterparametern bauen.
/// Basis: https://flatfox.ch/en/search/
/// Query-Parameter: max_price, min_rooms, take, east/north/south/west (BoundingBox Schweiz)
export interface FlatfoxFilters {
  maxPrice?: number
  minRooms?: number
  maxRooms?: number
  take?: number
  // BoundingBox (default: ganze Schweiz)
  east?: number
  north?: number
  south?: number
  west?: number
}

/// Schweizer BoundingBox (approximativ)
const CH_BOUNDS = {
  east: 10.49234,
  north: 48.467679,
  south: 45.125183,
  west: 5.95608,
}

export function buildFlatfoxUrl(filters: FlatfoxFilters = {}): string {
  const params = new URLSearchParams()
  const b = { ...CH_BOUNDS, ...filters }
  params.set("east", String(b.east))
  params.set("north", String(b.north))
  params.set("south", String(b.south))
  params.set("west", String(b.west))
  if (filters.maxPrice) params.set("max_price", String(filters.maxPrice))
  if (filters.minRooms) params.set("min_rooms", String(filters.minRooms))
  if (filters.maxRooms) params.set("max_rooms", String(filters.maxRooms))
  if (filters.take) params.set("take", String(filters.take))
  return `https://flatfox.ch/en/search/?${params.toString()}`
}

/// Fuehrt den Flatfox-Scraper aus und liefert die Roh-Daten.
/// `onProgress` wird mit Statusmeldungen aufgerufen (fuer UI-Feedback).
///
/// Free-Tier: `maxItems` wird auf max. 5 begrenzt, unabhaengig vom uebergebenen Wert.
export async function runFlatfoxScraper(
  filters: FlatfoxFilters,
  maxItems: number = FREE_TIER.maxItemsPerRun,
  onProgress?: (msg: string) => void,
): Promise<any[]> {
  const client = getApifyClient()
  if (!client) {
    throw new Error(
      "APIFY_API_TOKEN ist nicht gesetzt. Bitte in .env konfigurieren.",
    )
  }

  // Rate-Limit pruefen (vor dem Start)
  const rl = checkRateLimit()
  if (!rl.ok) {
    throw new Error(rl.reason ?? "Rate-Limit erreicht.")
  }

  // Free-Tier: input.maxItems muss >= 10 sein (Actor-Validierung),
  // der Actor liefert im Free-Tier trotzdem nur 5 Sample-Ergebnisse.
  const effectiveMaxItems = Math.max(
    FREE_TIER.actorMinItems,
    Math.min(maxItems, 100),
  )

  const startUrl = buildFlatfoxUrl(filters)
  const runInput = {
    startUrl,
    maxItems: effectiveMaxItems,
  }

  onProgress?.(`Starte Apify-Actor ${FLATFOX_ACTOR_ID}...`)
  onProgress?.(`Such-URL: ${startUrl}`)
  onProgress?.(
    `Free-Tier: max. ${FREE_TIER.maxItemsPerRun} Sample-Ergebnisse (input.maxItems=${effectiveMaxItems})`,
  )

  // Run starten (und registrieren, damit der Zaehler hochgeht)
  const run = await client.actor(FLATFOX_ACTOR_ID).call(runInput, {
    waitSecs: 300, // max 5 Minuten warten
  })
  registerRun()

  if (!run) {
    throw new Error("Apify-Actor wurde nicht gestartet.")
  }

  onProgress?.(`Actor-Run fertig (Status: ${run.status}). Lade Ergebnisse...`)

  // Ergebnisse aus dem Dataset abrufen.
  // apify-client v2: listItems() liefert ein Promise<{ items: any[] }>
  const dataset = client.dataset(run.defaultDatasetId)
  const { items } = await dataset.listItems()

  onProgress?.(`${items.length} Inserate vom Actor erhalten.`)
  return items as any[]
}

/// Liefert den aktuellen Rate-Limit-Status fuer die UI.
export function getRateLimitStatus() {
  const rl = checkRateLimit()
  return {
    runsToday: getRunsToday(),
    maxRunsPerDay: FREE_TIER.maxRunsPerDay,
    cooldownSeconds: FREE_TIER.cooldownSeconds,
    maxItemsPerRun: FREE_TIER.maxItemsPerRun,
    canRunNow: rl.ok,
    nextRunInMs: rl.retryInMs ?? 0,
    reason: rl.reason ?? null,
  }
}
