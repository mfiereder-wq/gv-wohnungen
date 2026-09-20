/* Importiert Genossenschaften aus der CSV in die Datenbank.
   Ausfuehren mit: bun run prisma/import-cooperatives.ts
*/
import { db } from "../src/lib/db"
import fs from "fs"
import path from "path"

function parseCsvLine(line: string): string[] {
  const fields: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === "," && !inQuotes) {
      fields.push(current)
      current = ""
    } else {
      current += ch
    }
  }
  fields.push(current)
  return fields
}

async function main() {
  const csvPath = path.resolve(process.cwd(), "upload/genossenschaften_zuerich_kontakte.csv")
  if (!fs.existsSync(csvPath)) {
    console.error("CSV nicht gefunden:", csvPath)
    process.exit(1)
  }

  const content = fs.readFileSync(csvPath, "utf-8")
  const lines = content.split("\n").filter((l) => l.trim())
  console.log(`Importiere ${lines.length - 1} Genossenschaften...`)

  // Bestehende loeschen
  await db.cooperative.deleteMany({})

  for (let i = 1; i < lines.length; i++) {
    const f = parseCsvLine(lines[i])
    const name = f[0]
    const size = f[1] || ""
    const address = f[2] || ""
    const phone = f[3] || null
    const email = f[4] || null
    const website = f[5] || ""
    const applicationInfo = f[6] || ""

    await db.cooperative.create({
      data: {
        name,
        size,
        address,
        phone: phone && phone !== "siehe Kontaktformular auf Webseite" ? phone : null,
        email: email && email !== "siehe Kontaktformular auf Webseite" ? email : null,
        website,
        applicationInfo,
      },
    })
    console.log(`  [${i}] ${name}`)
  }

  const count = await db.cooperative.count()
  console.log(`\nFertig: ${count} Genossenschaften in der DB`)
  await db.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
