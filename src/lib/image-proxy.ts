/// Wandelt externe Bild-URLs in Proxy-URLs um.
/// flatfox.ch/media/... Bilder erfordern User-Agent und koennen nicht
/// direkt im <img>-Tag geladen werden. Der Proxy /api/img loest das.

/// Prueft, ob eine URL ueber den Proxy geleitet werden muss.
function needsProxy(url: string): boolean {
  try {
    const parsed = new URL(url)
    return (
      parsed.host === "flatfox.ch" ||
      parsed.host === "www.flatfox.ch"
      // cdn.flatfox.ch funktioniert direkt, kein Proxy noetig
    )
  } catch {
    return false
  }
}

/// Wandelt eine Bild-URL in eine Proxy-URL um (wenn noetig).
/// Lokale Pfade (/images/...) und cdn.flatfox.ch bleiben direkt.
export function proxyImageUrl(url: string): string {
  if (!url) return "/images/placeholder.svg"
  // Lokale Pfade direkt
  if (url.startsWith("/")) return url
  // cdn.flatfox.ch funktioniert direkt
  if (url.includes("cdn.flatfox.ch")) return url
  // flatfox.ch/media/... braucht Proxy
  if (needsProxy(url)) {
    return `/api/img?url=${encodeURIComponent(url)}`
  }
  // Andere URLs direkt (falls vorhanden)
  return url
}

/// Wandelt ein Array von Bild-URLs um.
export function proxyImageUrls(urls: string[]): string[] {
  return urls.map(proxyImageUrl)
}
