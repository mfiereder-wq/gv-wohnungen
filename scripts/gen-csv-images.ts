// Generiert Bilder fuer die CSV-Importierten Inserate
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const OUT = path.resolve(process.cwd(), 'public/images')
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const listings = [
  { id: 1, prompt: 'Cozy furnished single room in a shared WG apartment in Zurich Oerlikon, bed with white linens, desk by window, warm natural light, Swiss student housing, real estate photo, high quality' },
  { id: 2, prompt: 'Modern coliving suite with private bathroom in Zurich, compact studio with built-in bed, minimalist design, clean white walls, large window, Swiss apartment, real estate photo, high quality' },
  { id: 3, prompt: 'Modern furnished coliving room with en-suite bathroom in Zurich, contemporary design, wooden accents, glass shower, bright and clean, Swiss apartment, real estate photo, high quality' },
  { id: 4, prompt: 'Small apartment room in Zurich, top offer, simple but neat, single bed, wardrobe, large window with city view, Swiss real estate photo, high quality' },
  { id: 5, prompt: 'Furnished studio apartment in Zurich city center, modern urban design, compact kitchenette, queen bed, neutral tones, large window, Swiss serviced apartment, real estate photo, high quality' },
  { id: 6, prompt: 'Mini studio serviced apartment in Zurich Wiedikon, compact but well-designed, single bed, small kitchen, modern furniture, weekly cleaning service, Swiss apartment, real estate photo, high quality' },
  { id: 7, prompt: 'Mini studio serviced apartment near Zurich Oerlikon station, compact layout, modern furniture, single bed, kitchenette, bright and clean, Swiss apartment, real estate photo, high quality' },
  { id: 8, prompt: 'Newly renovated loft apartment with large terrace in Zurich, top floor, open plan, wooden floor, modern kitchen, skylights, terrace with plants and seating, Swiss real estate photo, high quality' },
  { id: 9, prompt: 'Furnished apartment with balcony in Zurich Oerlikon, modern design, living area with sofa, kitchen, balcony with view, parking space, Swiss serviced apartment, real estate photo, high quality' },
  { id: 10, prompt: 'Mini studio serviced apartment in Zurich 4th district near Langstrasse, compact, modern, furnished, single bed, kitchenette, urban living, Swiss apartment, real estate photo, high quality' },
]

async function main() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })
  const zai = await ZAI.create()

  for (const l of listings) {
    const outPath = path.join(OUT, `csv-listing-${l.id}.png`)
    if (fs.existsSync(outPath)) {
      console.log(`[skip] csv-listing-${l.id}.png`)
      continue
    }
    let ok = false
    for (let a = 0; a < 4 && !ok; a++) {
      try {
        console.log(`[gen ${a + 1}] csv-listing-${l.id}...`)
        const res = await zai.images.generations.create({
          prompt: l.prompt,
          size: '1344x768',
        })
        const buf = Buffer.from(res.data[0].base64, 'base64')
        fs.writeFileSync(outPath, buf)
        console.log(`[ok] csv-listing-${l.id}.png (${(buf.length / 1024).toFixed(0)} KB)`)
        ok = true
      } catch (e: any) {
        console.error(`[err] csv-listing-${l.id}: ${e?.message?.slice(0, 80)}`)
        await sleep(12000)
      }
    }
    await sleep(8000)
  }
  console.log('Fertig.')
}

main().catch((e) => { console.error(e); process.exit(1) })
