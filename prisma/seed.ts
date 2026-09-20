/* GV Wohnungen - Seed-Skript
   Erstellt nur Demo-Nutzerkonten (keine Fake-Inserate mehr).
   Echte Inserate werden ueber die Flatfox/Apify-Synchronisation geladen.
   Ausfuehren mit: bun run db:seed
*/
import { db } from "../src/lib/db"
import bcryptjs from "bcryptjs"

async function main() {
  console.log("Loesche bestehende Daten...")
  await db.subscription.deleteMany()
  await db.property.deleteMany()
  await db.session.deleteMany()
  await db.user.deleteMany()

  console.log("Erstelle Demo-Nutzer (ohne Fake-Inserate)...")
  const passwordHash = await bcryptjs.hash("demo1234", 10)
  await db.user.create({
    data: {
      email: "demo@gv-wohnungen.ch",
      name: "Demo Nutzer",
      passwordHash,
      subscriptionStatus: "none",
    },
  })

  // Ein Nutzer mit aktivem Abo (fuer Demo)
  const activeHash = await bcryptjs.hash("abo1234", 10)
  await db.user.create({
    data: {
      email: "abo@gv-wohnungen.ch",
      name: "Abo Demo",
      passwordHash: activeHash,
      subscriptionStatus: "active",
      stripeCustomerId: "cus_demo_active",
      subscription: {
        create: {
          stripeSubscriptionId: "sub_demo_active",
          status: "active",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          cancelAtPeriodEnd: false,
        },
      },
    },
  })

  console.log("Seed erfolgreich abgeschlossen (nur Nutzer, keine Inserate).")
  console.log("---")
  console.log("Demo-Zugang (ohne Abo):    demo@gv-wohnungen.ch / demo1234")
  console.log("Demo-Zugang (mit Abo):     abo@gv-wohnungen.ch / abo1234")
  console.log("")
  console.log("Hinweis: Echte Inserate ueber Konto -> Flatfox-Synchronisation laden.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
