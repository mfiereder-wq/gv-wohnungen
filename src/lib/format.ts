// Schweizer Formatierungs-Helfer

/// Formatiert eine CHF-Schweizer Notation: "CHF 1'250.–" oder "CHF 5.90"
export function formatCHF(amount: number): string {
  // Wenn der Betrag Nachkommastellen hat (z. B. 5.9), mit 2 Dezimalen anzeigen
  const hasDecimals = amount % 1 !== 0
  if (hasDecimals) {
    const formatted = amount.toFixed(2).replace(".", ".")
    return `CHF ${formatted}`
  }
  // Ganze Betraege: Schweizer Format mit Apostroph
  const formatted = amount
    .toLocaleString("de-CH", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
      useGrouping: true,
    })
    .replace(/,/g, "'")
  return `CHF ${formatted}.–`
}

/// Monatsmiete formatiert: "CHF 1'250.– / Monat"
export function formatRentPerMonth(amount: number): string {
  return `${formatCHF(amount)} / Monat`
}

/// Zimmeranzahl Schweizer Stil: "3½ Zimmer"
export function formatRooms(rooms: number): string {
  // Schweizer: Halbzimmer mit ½ (nicht .5)
  const str = Number.isInteger(rooms)
    ? rooms.toString()
    : rooms.toString().replace(".5", "½")
  return `${str} Zimmer`
}

/// Verfuegbarkeitsdatum formatiert: "ab 1. Feb. 2025"
export function formatAvailable(dateStr: string): string {
  if (!dateStr) return "auf Anfrage"
  try {
    const d = new Date(dateStr)
    return `ab ${d.toLocaleDateString("de-CH", {
      day: "1-digit",
      month: "short",
      year: "numeric",
    })}`
  } catch {
    return dateStr
  }
}

/// Flaeche: "92 m²"
export function formatArea(area: number): string {
  return `${area} m²`
}

/// Gesamtmiete (Miete + Nebenkosten)
export function totalMonthly(rent: number, utilities: number): number {
  return rent + utilities
}
