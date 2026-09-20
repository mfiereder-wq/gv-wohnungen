// Mappt Flatfox/Apify Rohdaten auf das interne Property-Schema.
// Basiert auf der dokumentierten Output-Struktur des Flatfox-Scrapers.
//
// Wichtige Felder der Flatfox-Antwort:
//   - url / short_url / submit_url    -> Original-Link
//   - public_title / pitch_title      -> Titel
//   - description / description_title -> Beschreibung
//   - rent_gross / rent_net / rent_charges / price_display -> Miete
//   - number_of_rooms                 -> Zimmer (String, z. B. "4.0")
//   - livingspace / surface_living / space_display -> Flaeche
//   - zipcode / city / state / country -> Adresse
//   - images [] / cover_image         -> Bilder
//   - agency { name, street, zipcode, city, logo } -> Kontakt
//   - extracted_emails []             -> Kontakt-E-Mails
//   - moving_date / moving_date_type  -> Verfuegbarkeit
//   - pk / reference                  -> externe ID
//   - balconygarden / garage / petsallowed / floor -> Merkmale

export interface MappedProperty {
  title: string
  description: string
  rent: number
  utilities: number
  rooms: number
  area: number
  zip: string
  city: string
  canton: string
  images: string[]
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  originalLink: string
  submitUrl: string | null
  availableFrom: string
  externalId: string | null
}

/// Schweizer Kantone aus Kuerzel oder PLZ ableiten.
/// Flatfox liefert `state` als Kanton-Kuerzel (z. B. "NE" = Neuchâtel, "ZH" = Zürich).
const STATE_CODE_TO_CANTON: Record<string, string> = {
  ZH: "Zürich",
  BE: "Bern",
  LU: "Luzern",
  UR: "Uri",
  SZ: "Schwyz",
  OW: "Obwalden",
  NW: "Nidwalden",
  GL: "Glarus",
  ZG: "Zug",
  FR: "Fribourg",
  SO: "Solothurn",
  BS: "Basel-Stadt",
  BL: "Basel-Landschaft",
  SH: "Schaffhausen",
  AR: "Appenzell Ausserrhoden",
  AI: "Appenzell Innerrhoden",
  SG: "St. Gallen",
  GR: "Graubünden",
  AG: "Aargau",
  TG: "Thurgau",
  TI: "Ticino",
  VD: "Vaud",
  VS: "Valais",
  NE: "Neuchâtel",
  GE: "Genève",
  JU: "Jura",
}

function cantonFromStateCode(code: string): string {
  if (!code) return ""
  const c = code.trim().toUpperCase()
  return STATE_CODE_TO_CANTON[c] ?? ""
}

/// Fallback: Kanton aus PLZ ableiten (vereinfachte Tabelle).
function cantonFromZip(zip: string): string {
  const z = parseInt(zip, 10)
  if (Number.isNaN(z)) return "Schweiz"
  const map: [number, number, string][] = [
    [1000, 1999, "Vaud"],
    [2000, 2499, "Jura"],
    [2500, 3999, "Bern"],
    [3800, 3999, "Valais"],
    [4000, 4499, "Basel-Landschaft"],
    [4500, 4999, "Solothurn"],
    [5000, 5999, "Aargau"],
    [6000, 6399, "Luzern"],
    [6300, 6399, "Zug"],
    [6400, 6499, "Schwyz"],
    [6500, 6999, "Ticino"],
    [7000, 7499, "Graubünden"],
    [7400, 7999, "St. Gallen"],
    [7800, 7999, "Thurgau"],
    [8000, 8299, "Zürich"],
    [8200, 8299, "Schaffhausen"],
    [8300, 8999, "Thurgau"],
    [8700, 8999, "Zürich"],
    [9000, 9999, "St. Gallen"],
  ]
  for (const [lo, hi, canton] of map) {
    if (z >= lo && z <= hi) return canton
  }
  return "Schweiz"
}

/// Hilfsfunktion: Feld flexibel auslesen (verschiedene Schreibweisen)
function pick(obj: any, keys: string[]): any {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== "") return obj[k]
  }
  return undefined
}

/// Zahl aus String/Number extrahieren (z. B. 990 oder "990" -> 990)
function toNumber(v: any): number {
  if (v === undefined || v === null) return 0
  if (typeof v === "number") return Math.round(v)
  const s = String(v).replace(/[^0-9.]/g, "")
  const n = parseFloat(s)
  return Number.isNaN(n) ? 0 : Math.round(n)
}

/// Float aus String/Number (z. B. "4.0" -> 4.0, "3.5" -> 3.5)
function toFloat(v: any): number {
  if (v === undefined || v === null) return 0
  if (typeof v === "number") return v
  const s = String(v).replace("½", ".5").replace(",", ".")
  const n = parseFloat(s.replace(/[^0-9.]/g, ""))
  return Number.isNaN(n) ? 0 : n
}

/// Bild-Array normalisieren: cover_image + images[] zusammenfuehren, Duplikate entfernen
function normalizeImages(item: any): string[] {
  const imgs: string[] = []
  // cover_image zuerst
  const cover = pick(item, ["cover_image"])
  if (typeof cover === "string" && cover.length > 0) imgs.push(cover)
  // images-Array
  const rawImages = pick(item, ["images", "photos", "gallery", "imageUrls"])
  if (Array.isArray(rawImages)) {
    for (const i of rawImages) {
      const url =
        typeof i === "string" ? i : i?.url || i?.src || i?.image || i?.original
      if (typeof url === "string" && url.length > 0) imgs.push(url)
    }
  }
  // Duplikate entfernen
  return Array.from(new Set(imgs))
}

/// Mappt ein Flatfox-Rohdatenelement auf das interne Property-Schema.
export function mapFlatfoxItem(item: any): MappedProperty | null {
  if (!item || typeof item !== "object") return null

  // Original-URL (Pflichtfeld) - bevorzugt die volle URL
  const originalLink =
    pick(item, ["url", "short_url", "submit_url"]) ||
    pick(item, ["link", "href", "sourceUrl"]) ||
    ""
  if (!originalLink) return null

  // Titel - public_title ist am aussagekraeftigsten
  const title =
    pick(item, ["public_title", "pitch_title", "rent_title"]) ||
    pick(item, ["title", "headline", "name"]) ||
    pick(item, ["short_title", "description_title"]) ||
    "Wohnung"

  // Beschreibung - description_title + description kombinieren
  const descTitle = pick(item, ["description_title"])
  const descBody = pick(item, ["description", "desc", "details", "text"]) || ""
  const description = [descTitle, descBody]
    .filter((s) => typeof s === "string" && s.length > 0)
    .join("\n\n")

  // Miete - rent_gross ist die Bruttomiete, price_display der Anzeigepreis
  const rent = toNumber(
    pick(item, ["rent_gross", "price_display", "rent_net", "rent", "monthlyRent"]),
  )
  // Nebenkosten - rent_charges oder Differenz gross-net
  let utilities = toNumber(pick(item, ["rent_charges", "additionalCosts", "charges"]))
  const rentNet = toNumber(pick(item, ["rent_net"]))
  if (utilities === 0 && rentNet > 0 && rent > rentNet) {
    utilities = rent - rentNet
  }

  // Zimmer - number_of_rooms ist ein String ("4.0")
  const rooms = toFloat(
    pick(item, ["number_of_rooms", "rooms", "roomCount", "numberOfRooms"]),
  )

  // Flaeche - livingspace / surface_living / space_display
  const area = toNumber(
    pick(item, ["livingspace", "surface_living", "space_display", "area", "size"]),
  )

  // Adresse
  const zip = String(
    pick(item, ["zipcode", "zip", "zipCode", "postalCode", "plz"]) || "",
  )
  const city = String(pick(item, ["city", "town", "locality"]) || "")
  // Kanton: state-Code (z. B. "NE") -> Name, sonst Fallback ueber PLZ
  const stateCode = String(pick(item, ["state", "canton"]) || "")
  const canton =
    cantonFromStateCode(stateCode) || cantonFromZip(zip) || "Schweiz"

  // Bilder
  const images = normalizeImages(item)

  // Kontaktdaten - NUR echte Daten, keine Fakes.
  // agency-Objekt + extracted_emails + Beschreibung-Extraktion.
  // Wenn nichts gefunden: null (UI zeigt dann Flatfox-Link als Kontaktweg).
  const agency = pick(item, ["agency", "agent", "landlord"])
  const contactName =
    (agency && (agency.name || agency.name_2)) ||
    pick(item, ["contactName", "advertiser"]) ||
    null
  // E-Mail: extracted_emails [] zuerst, dann agency, dann Beschreibung
  const extractedEmails = pick(item, ["extracted_emails"])
  let contactEmail: string | null = null
  if (Array.isArray(extractedEmails) && extractedEmails.length > 0) {
    contactEmail = String(extractedEmails[0])
  } else if (agency) {
    contactEmail =
      pick(agency, ["email", "contactEmail"]) ||
      pick(item, ["contactEmail", "email"]) ||
      null
  } else {
    contactEmail = pick(item, ["contactEmail", "email"]) || null
  }
  // Fallback: E-Mail/Telefon aus Beschreibung extrahieren
  if (!contactEmail && descBody) {
    const emailMatch = String(descBody).match(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    )
    if (emailMatch) contactEmail = emailMatch[0]
  }
  let contactPhone: string | null =
    pick(item, ["contactPhone", "phone", "telephone"]) || null
  if (!contactPhone && descBody) {
    // Schweizer Telefonnummern: +41 XX XXX XX XX oder 0XX XXX XX XX
    const phoneMatch = String(descBody).match(
      /(?:\+41|0041|0)\s*[1-9]\d{1}\s*\d{3}\s*\d{2}\s*\d{2}/,
    )
    if (phoneMatch) contactPhone = phoneMatch[0].trim()
  }

  // submit_url: Flatfox-Kontaktformular (immer vorhanden bei Flatfox-Listings)
  const submitUrl =
    pick(item, ["submit_url"]) ||
    pick(item, ["submitUrl", "applicationUrl"]) ||
    null

  // Verfuegbarkeit - moving_date (ISO) oder moving_date_type ("imm" = sofort)
  const movingDate = pick(item, ["moving_date", "availableFrom", "moveInDate"])
  const movingDateType = pick(item, ["moving_date_type"])
  let availableFrom = ""
  if (movingDate) {
    try {
      availableFrom = new Date(movingDate).toISOString().slice(0, 10)
    } catch {
      availableFrom = String(movingDate).slice(0, 10)
    }
  } else if (movingDateType === "imm") {
    availableFrom = new Date().toISOString().slice(0, 10)
  }

  // Externe ID - pk (Flatfox-Listing-ID) oder reference
  const externalId =
    pick(item, ["pk", "reference", "ref_object", "id", "listingId"]) || null

  // Beschreibung um Merkmale ergaenzen (falls vorhanden)
  const features: string[] = []
  const balconygarden = pick(item, ["balconygarden"])
  const garage = pick(item, ["garage", "parkingspace"])
  const pets = pick(item, ["petsallowed"])
  const floor = pick(item, ["floor"])
  const furnished = pick(item, ["is_furnished"])
  const yearBuilt = pick(item, ["year_built"])
  if (balconygarden) features.push("Balkon/Garten")
  if (garage) features.push("Garage/Parkplatz")
  if (pets) features.push("Haustiere erlaubt")
  if (furnished) features.push("moebliert")
  if (floor) features.push(`${floor}. Stockwerk`)
  if (yearBuilt) features.push(`Baujahr ${yearBuilt}`)

  const fullDescription =
    features.length > 0
      ? `${description}\n\nMerkmale: ${features.join(", ")}`
      : description

  return {
    title: String(title).slice(0, 300),
    description: String(fullDescription).slice(0, 10000),
    rent,
    utilities,
    rooms,
    area,
    zip,
    city,
    canton,
    images,
    contactName: contactName ? String(contactName) : null,
    contactEmail: contactEmail ? String(contactEmail) : null,
    contactPhone: contactPhone ? String(contactPhone) : null,
    originalLink: String(originalLink),
    submitUrl: submitUrl ? String(submitUrl) : null,
    availableFrom,
    externalId: externalId ? String(externalId) : null,
  }
}

/// Filtert ungueltige Eintraege heraus.
export function mapFlatfoxItems(items: any[]): MappedProperty[] {
  const mapped: MappedProperty[] = []
  for (const item of items) {
    const m = mapFlatfoxItem(item)
    if (m) mapped.push(m)
  }
  return mapped
}
