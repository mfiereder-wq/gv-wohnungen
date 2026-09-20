import { NextResponse } from "next/server"

/// GET /api/img?url=<encoded-image-url>
/// Proxy fuer externe Bilder (flatfox.ch/media/... erfordern User-Agent).
/// Verhindert Hotlink-Schutz und CORS-Probleme.
/// Nur flatfox.ch und cdn.flatfox.ch URLs erlaubt (Sicherheit).
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const targetUrl = searchParams.get("url")

  if (!targetUrl) {
    return NextResponse.json(
      { error: "url Parameter erforderlich" },
      { status: 400 },
    )
  }

  // Security: nur flatfox.ch und cdn.flatfox.ch erlauben
  let parsed: URL
  try {
    parsed = new URL(targetUrl)
  } catch {
    return NextResponse.json({ error: "ungueltige URL" }, { status: 400 })
  }
  if (
    parsed.host !== "flatfox.ch" &&
    parsed.host !== "cdn.flatfox.ch" &&
    parsed.host !== "www.flatfox.ch"
  ) {
    return NextResponse.json(
      { error: "nur flatfox.ch Bilder erlaubt" },
      { status: 403 },
    )
  }

  try {
    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/*,*/*;q=0.8",
        Referer: "https://flatfox.ch/",
      },
      // Kurzes Timeout verhindert haengende Requests
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      // Fallback: Placeholder-Bild zurueckgeben
      return NextResponse.redirect(
        new URL("/images/placeholder.svg", req.url),
        { status: 302 },
      )
    }

    const contentType = res.headers.get("content-type") || "image/jpeg"
    const buffer = await res.arrayBuffer()

    // 1 Stunde cachen (Browser + CDN)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
        "X-Content-Type-Options": "nosniff",
      },
    })
  } catch (e: any) {
    // Bei Fehler: Placeholder
    return NextResponse.redirect(
      new URL("/images/placeholder.svg", req.url),
      { status: 302 },
    )
  }
}
