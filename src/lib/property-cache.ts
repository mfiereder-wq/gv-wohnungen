// Caching- und TTL-Logik fuer Immobilien-Inserate.
// Inserate werden nach 10 Tagen automatisch entfernt (veraltete Bestände).
import { db } from "@/lib/db"

/// TTL in Tagen: Inserate aelter als dieser Wert werden entfernt.
export const PROPERTY_TTL_DAYS = 10

/// Entfernt alle Inserate, die vor mehr als PROPERTY_TTL_DAYS Tagen zuletzt
/// von Flatfox abgerufen wurden (fetchedAt). Wird bei jeder Suchanfrage
/// aufgerufen, um die DB aktuell zu halten ohne API-Limits zu belasten.
///
/// Gibt die Anzahl geloeschter Inserate zurueck.
export async function cleanupStaleProperties(): Promise<number> {
  const cutoff = new Date(Date.now() - PROPERTY_TTL_DAYS * 24 * 60 * 60 * 1000)
  const result = await db.property.deleteMany({
    where: { fetchedAt: { lt: cutoff } },
  })
  return result.count
}

/// Aktualisiert das fetchedAt-Datum eines Inserats (beim Upsert automatisch
/// gesetzt, kann aber auch fuer "refresh" verwendet werden).
export async function touchProperty(id: string): Promise<void> {
  await db.property.update({
    where: { id },
    data: { fetchedAt: new Date() },
  })
}
