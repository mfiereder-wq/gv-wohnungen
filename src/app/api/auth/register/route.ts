import { NextResponse } from "next/server"
import bcryptjs from "bcryptjs"
import { db } from "@/lib/db"
import { ensureDbReady } from "@/lib/ensure-db"

export async function POST(req: Request) {
  try {
    await ensureDbReady()
    const body = await req.json()
    const email = (body.email as string | undefined)?.toLowerCase().trim()
    const password = body.password as string | undefined
    const name = (body.name as string | undefined)?.trim()

    if (!email || !password) {
      return NextResponse.json(
        { error: "E-Mail und Passwort erforderlich" },
        { status: 400 },
      )
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Bitte eine gueltige E-Mail-Adresse eingeben" },
        { status: 400 },
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Passwort muss mindestens 8 Zeichen lang sein" },
        { status: 400 },
      )
    }

    const exists = await db.user.findUnique({ where: { email } })
    if (exists) {
      return NextResponse.json(
        { error: "Es existiert bereits ein Konto mit dieser E-Mail" },
        { status: 409 },
      )
    }

    const passwordHash = await bcryptjs.hash(password, 10)
    await db.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        subscriptionStatus: "none",
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Serverfehler bei der Registrierung" },
      { status: 500 },
    )
  }
}
