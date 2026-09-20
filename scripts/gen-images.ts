// Generiert Immobilienbilder fuer GV Wohnungen (sequenziell, mit Delay)
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUT = path.resolve(process.cwd(), 'public/images')

const prompts: { name: string; prompt: string }[] = [
  { name: 'wohnung-1', prompt: 'Exterior of a modern Swiss apartment building in Bern, beige facade with balconies, blue sky, residential street, architectural photography, high quality, realistic' },
  { name: 'wohnung-2', prompt: 'Bright living room interior of a Swiss apartment, wooden floor, large windows with daylight, modern minimalist furniture, neutral colors, real estate photography, high quality' },
  { name: 'wohnung-3', prompt: 'Modern apartment building exterior in Zurich, contemporary architecture, glass and concrete, green surroundings, daytime, real estate photo, high quality' },
  { name: 'wohnung-4', prompt: 'Cozy apartment kitchen with modern appliances, wooden cabinets, white countertop, Swiss apartment style, natural light, real estate photography, high quality' },
  { name: 'wohnung-5', prompt: 'Swiss residential building facade with multiple balconies, traditional architecture with modern touches, clean facade, daytime, real estate photo, high quality' },
  { name: 'wohnung-6', prompt: 'Apartment balcony with plants and seating, view of Swiss city rooftops, sunny day, cozy outdoor space, real estate photography, high quality' },
  { name: 'wohnung-7', prompt: 'Modern apartment bedroom with large bed, wooden floor, neutral tones, large window with curtains, minimalist Swiss design, natural light, real estate photo, high quality' },
  { name: 'wohnung-8', prompt: 'Swiss apartment building entrance with clean modern design, glass door, stone facade, residential area, daytime, architectural photography, high quality' },
  { name: 'wohnung-9', prompt: 'Spacious living-dining room in Swiss apartment, open plan, wooden floor, modern furniture, large windows, bright daylight, real estate photography, high quality' },
  { name: 'wohnung-10', prompt: 'Apartment bathroom with modern fixtures, walk-in shower, tiles, clean minimal design, Swiss apartment style, bright, real estate photo, high quality' },
  { name: 'wohnung-11', prompt: 'Exterior view of Swiss apartment complex with garden, playground, green trees, modern residential buildings, sunny day, real estate photography, high quality' },
  { name: 'wohnung-12', prompt: 'Cozy apartment living room corner with reading chair, bookshelf, plant, wooden floor, warm lighting, Swiss interior design, real estate photo, high quality' },
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })
  const zai = await ZAI.create()

  for (const p of prompts) {
    const outPath = path.join(OUT, `${p.name}.png`)
    if (fs.existsSync(outPath)) {
      console.log(`[skip] ${p.name}.png existiert bereits`)
      continue
    }
    let ok = false
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        const res = await zai.images.generations.create({
          prompt: p.prompt,
          size: '1344x768',
        })
        const buf = Buffer.from(res.data[0].base64, 'base64')
        fs.writeFileSync(outPath, buf)
        console.log(`[ok] ${p.name}.png (${(buf.length / 1024).toFixed(0)} KB)`)
        ok = true
      } catch (e: any) {
        console.error(`[retry ${attempt + 1}] ${p.name}: ${e?.message ?? e}`)
        await sleep(8000 * (attempt + 1))
      }
    }
    await sleep(4000)
  }
  console.log('Fertig.')
}

main().catch((e) => { console.error(e); process.exit(1) })
