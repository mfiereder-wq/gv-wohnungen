#!/usr/bin/env tsx
/**
 * GV Wohnungen – Promo-Bilder mit Preis-Overlay generieren
 * 
 * Generiert Social-Media-taugliche Wohnungs-Promo-Bilder mit
 * sichtbaren CHF-Preisen für Instagram, Facebook und Ads.
 *
 * Usage: npx tsx scripts/gen-promo-images.ts
 *
 * Erzeugt:
 *   public/promo/promo-1.png ... promo-12.png (quadratisch, Social Media)
 *   public/promo/wide/ promo-1.png ... (16:9, für Ads / Website)
 */

import ZAI from "z-ai-web-dev-sdk"
import sharp from "sharp"
import fs from "fs"
import path from "path"

interface PromoConfig {
  name: string
  price: string
  location: string
  rooms: string
  label: string // z. B. "Bezahlbarer Wohnraum"
  prompt: string
}

const PROMOS: PromoConfig[] = [
  {
    name: "promo-1",
    price: "CHF 700.–",
    location: "Adliswil, Zürich",
    rooms: "1 Zimmer",
    label: "Günstig wohnen",
    prompt: "Cozy small studio apartment in a Swiss suburb, warm morning light streaming through window, wooden floor, minimalist furniture, view of green garden, affordable living concept, bright and airy, real estate photography, high quality, 4k",
  },
  {
    name: "promo-2",
    price: "CHF 1'200.–",
    location: "Lausanne, Vaud",
    rooms: "2.5 Zimmer",
    label: "Inkl. Nebenkosten",
    prompt: "Modern 2.5 room apartment in Lausanne with view of Lake Geneva, balcony with flowering plants, bright living room with large windows, wooden floor, modern kitchen visible in background, afternoon sun, real estate photography, high quality, 4k",
  },
  {
    name: "promo-3",
    price: "CHF 890.–",
    location: "Bern, Bern",
    rooms: "1.5 Zimmer",
    label: "Zentrumsnah",
    prompt: "Cozy apartment in Bern city center, bay window with seat overlooking historic old town street, warm afternoon light, high ceiling, herringbone parquet floor, blend of modern furniture and classic architecture, real estate photography, high quality",
  },
  {
    name: "promo-4",
    price: "CHF 1'390.–",
    location: "Winterthur, Zürich",
    rooms: "3.5 Zimmer",
    label: "Familienfreundlich",
    prompt: "Spacious family apartment in Winterthur, large bright living room with children's play corner, modern open kitchen, lots of natural light, wooden floor, plants, view of garden, warm atmosphere, family lifestyle, real estate photography, high quality",
  },
  {
    name: "promo-5",
    price: "CHF 580.–",
    location: "Luzern, Luzern",
    rooms: "WG-Zimmer",
    label: "All-Inklusive",
    prompt: "Bright room in a shared apartment in Lucerne, bed with colorful bedding, desk by window, view of rooftops and green hills in distance, personal cozy space, young living, afternoon light, lifestyle photography, high quality, 4k",
  },
  {
    name: "promo-6",
    price: "CHF 1'500.–",
    location: "Basel, Basel-Stadt",
    rooms: "3 Zimmer",
    label: "Genossenschaft",
    prompt: "Modern apartment in a Basel housing cooperative, sustainable wooden building visible through window, bright interior with eco-friendly materials, indoor plants, clean design, morning sun, community living concept, real estate photography, high quality",
  },
  {
    name: "promo-7",
    price: "CHF 950.–",
    location: "St. Gallen, SG",
    rooms: "2 Zimmer",
    label: "Erstbezug",
    prompt: "Brand new apartment in St. Gallen, never lived in before, pristine white walls, modern kitchen with appliances, large window with mountain view, bright daylight, clean empty room ready for new tenant, new beginning, real estate photography, high quality",
  },
  {
    name: "promo-8",
    price: "CHF 1'100.–",
    location: "Zug, Zug",
    rooms: "2.5 Zimmer",
    label: "Seeblick",
    prompt: "Apartment with direct view of Zug lake and mountains from living room window, sunset golden hour, warm interior lighting, modern minimalist furniture, glass of wine on table, peaceful evening atmosphere, aspirational living, real estate photography, high quality, 4k",
  },
  {
    name: "promo-9",
    price: "CHF 650.–",
    location: "Biel, Bern",
    rooms: "1 Zimmer",
    label: "Sofort frei",
    prompt: "Tiny but perfect studio apartment in Biel, clever space design, bed niche with reading light, compact kitchen, bright window with city view, efficient living, cozy atmosphere, warm afternoon light, real estate photography, high quality",
  },
  {
    name: "promo-10",
    price: "CHF 1'250.–",
    location: "Chur, Graubünden",
    rooms: "2.5 Zimmer",
    label: "Bergblick",
    prompt: "Apartment in Chur with stunning view of Swiss Alps through large panoramic window, modern interior with mountain inspired decor, warm wooden accents, morning sun illuminating room, alpine lifestyle, real estate photography, high quality, 4k",
  },
  {
    name: "promo-11",
    price: "CHF 780.–",
    location: "Schaffhausen, SH",
    rooms: "1.5 Zimmer",
    label: "Kultur pur",
    prompt: "Historic apartment in Schaffhausen old town, view of medieval buildings and Rhine river, large window with wooden shutters, cozy interior with modern touches, warm evening light, cultural atmosphere, unique living experience, real estate photography, high quality",
  },
  {
    name: "promo-12",
    price: "CHF 5.90",
    location: "Ganze Schweiz",
    rooms: "Alle Inserate",
    label: "Pro Woche",
    prompt: "Close up of a smartphone showing apartment search app, modern UI design with green accent, Swiss flag in background, blurred cozy apartment background, hand holding phone, digital lifestyle, real estate technology, bright and modern, high quality, 4k",
  },
]

const OUT = path.resolve(process.cwd(), "public/promo")
const OUT_WIDE = path.resolve(OUT, "wide")
const FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

/// Price text overlay using sharp
async function addPriceOverlay(
  imagePath: string,
  config: PromoConfig,
  outputPath: string,
  wide: boolean = false,
): Promise<void> {
  let img = sharp(imagePath)

  // Get image dimensions
  const meta = await img.metadata()
  const width = meta.width || 1200
  const height = meta.height || 1200

  // SVG overlay with price, location and label
  const fontSize = wide ? "72" : "64"
  const subFontSize = wide ? "36" : "32"
  const labelSize = wide ? "28" : "24"
  const margin = wide ? "60" : "40"
  const overlayHeight = wide ? "280" : "320"

  const svg = `
    <svg width="${width}" height="${height}">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgba(0,0,0,0)"/>
          <stop offset="50%" stop-color="rgba(0,0,0,0.3)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0.75)"/>
        </linearGradient>
      </defs>
      <!-- Dark gradient overlay at bottom -->
      <rect x="0" y="${height - parseInt(overlayHeight)}" width="${width}" height="${overlayHeight}" fill="url(#fade)"/>

      <!-- Label badge -->
      <rect x="${margin}" y="${height - parseInt(overlayHeight) + 20}" width="180" height="34" rx="17" fill="rgba(26,122,76,0.9)"/>
      <text x="${parseInt(margin) + 90}" y="${height - parseInt(overlayHeight) + 42}" font-family="sans-serif" font-size="${labelSize}" font-weight="bold" fill="white" text-anchor="middle">${config.label}</text>

      <!-- Price -->
      <text x="${margin}" y="${height - 90}" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="white" stroke="#000" stroke-width="1">${config.price}</text>
      <text x="${parseInt(margin) + 10 + parseInt(fontSize) * 4}" y="${height - 90 + 8}" font-family="sans-serif" font-size="${subFontSize}" fill="rgba(255,255,255,0.8)">/ Monat</text>

      <!-- Location & Rooms -->
      <text x="${margin}" y="${height - 40}" font-family="sans-serif" font-size="${subFontSize}" fill="rgba(255,255,255,0.9)">${config.location} · ${config.rooms}</text>

      <!-- Corner watermark -->
      <text x="${width - 20}" y="40" font-family="sans-serif" font-size="22" font-weight="bold" fill="rgba(255,255,255,0.7)" text-anchor="end">GV Wohnungen</text>
      <text x="${width - 20}" y="66" font-family="sans-serif" font-size="16" fill="rgba(255,255,255,0.5)" text-anchor="end">gv-wohnungen.online</text>
    </svg>`

  img = img.composite([
    {
      input: Buffer.from(svg),
      top: 0,
      left: 0,
    },
  ])

  // Resize to standard social media size
  const resizeOpts = wide ? { width: 1200, height: 630 } : { width: 1080, height: 1080 }
  await img.resize(resizeOpts.width, resizeOpts.height, { fit: "cover" }).png().toFile(outputPath)
}

async function main() {
  console.log("=".repeat(60))
  console.log("GV Wohnungen – Promo-Bilder Generator")
  console.log("=".repeat(60))

  // Ensure output dirs
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })
  if (!fs.existsSync(OUT_WIDE)) fs.mkdirSync(OUT_WIDE, { recursive: true })

  // Generate images using ZAI SDK
  const zai = await ZAI.create()

  for (const promo of PROMOS) {
    const squareOut = path.join(OUT, `${promo.name}.png`)
    const wideOut = path.join(OUT_WIDE, `${promo.name}.png`)

    // Skip if already generated
    if (fs.existsSync(squareOut) && fs.existsSync(wideOut)) {
      console.log(`[skip] ${promo.name} – bereits vorhanden`)
      continue
    }

    // Generate base image (1344x768)
    const tmpPath = path.join(OUT, `_raw-${promo.name}.png`)
    if (!fs.existsSync(tmpPath)) {
      console.log(`[generate] ${promo.name}: "${promo.label}" in ${promo.location}`)
      let ok = false
      for (let attempt = 0; attempt < 3 && !ok; attempt++) {
        try {
          const res = await zai.images.generations.create({
            prompt: promo.prompt,
            size: "1344x768",
          })
          const buf = Buffer.from(res.data[0].base64, "base64")
          fs.writeFileSync(tmpPath, buf)
          console.log(`  → raw image generated (${(buf.length / 1024).toFixed(0)} KB)`)
          ok = true
        } catch (e: any) {
          console.error(`  → retry ${attempt + 1}: ${e?.message ?? e}`)
          await new Promise((r) => setTimeout(r, 8000))
        }
      }
      if (!ok) {
        console.error(`  → FAILED: ${promo.name}`)
        continue
      }
      await new Promise((r) => setTimeout(r, 3000))
    }

    // Add price overlay (square 1080x1080 for Instagram)
    console.log(`[overlay] ${promo.name} – Preis: ${promo.price}`)
    await addPriceOverlay(tmpPath, promo, squareOut, false)
    // Add price overlay (wide 1200x630 for Facebook/Ads)
    await addPriceOverlay(tmpPath, promo, wideOut, true)
    console.log(`  → square: ${squareOut}`)
    console.log(`  → wide: ${wideOut}`)
  }

  console.log("\nFertig! Generiert:")
  console.log(`  ${PROMOS.length} quadratisch (1080×1080) → public/promo/`)
  console.log(`  ${PROMOS.length} breit (1200×630) → public/promo/wide/`)
  console.log("\nZum Hochladen via Telegram:")
  for (const p of PROMOS) {
    console.log(`MEDIA:/root/gv-wohnungen/public/promo/${p.name}.png`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})