// Geteilte Typen fuer Immobilien (Client/Server)

export interface PropertyContact {
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  /// Echter Flatfox-Listing-Link (immer verfuegbar fuer Premium)
  originalLink: string
  /// Flatfox-Kontaktformular (submit_url)
  submitUrl: string | null
  /// true, wenn direkte Kontaktdaten (Name/E-Mail/Telefon) vorhanden
  hasDirectContact: boolean
}

export interface Property {
  id: string
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
  availableFrom: string
  createdAt: string
  fetchedAt: string
  source: string
  contact: PropertyContact | null
  gated: boolean
}

export interface PropertiesResponse {
  properties: Property[]
  total: number
  hasAccess: boolean
  cached: boolean
  ttlDays: number
}
