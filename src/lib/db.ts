import { PrismaClient } from '@prisma/client'

/// Datenbank-Client.
/// Auf Vercel: verwendet Neon PostgreSQL (persistent, via DATABASE_URL env var).
/// Lokal: verwendet die DATABASE_URL aus .env (PostgreSQL oder SQLite).
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

// Immer cachen (auch in production, fuer serverless reuse)
if (!globalForPrisma.prisma) globalForPrisma.prisma = db
