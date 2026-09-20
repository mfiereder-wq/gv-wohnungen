import type { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcryptjs from "bcryptjs"
import { db } from "@/lib/db"
import { ensureDbReady } from "@/lib/ensure-db"

export const authOptions: NextAuthOptions = {
  // JWT-Strategie: keine externe Session-DB noetig
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 Tage
  },
  // trustHost: leitet die URL aus dem Request-Header ab (fuer Vercel)
  trustHost: true,
  // Secret explizit setzen (Fallback fuer Vercel)
  secret: process.env.NEXTAUTH_SECRET || "gv-wohnungen-prod-secret-key-2025-very-secure-fallback",
  // Cookies ohne __Host-/__Secure- Prefix (kompatibler auf Vercel)
  cookies: {
    sessionToken: {
      name: "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    callbackUrl: {
      name: "next-auth.callback-url",
      options: {
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
    csrfToken: {
      name: "next-auth.csrf-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: true,
      },
    },
  },
  pages: {
    signIn: "/",
  },
  providers: [
    CredentialsProvider({
      name: "E-Mail & Passwort",
      credentials: {
        email: { label: "E-Mail", type: "email" },
        password: { label: "Passwort", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }
        try {
          await ensureDbReady()
          const user = await db.user.findUnique({
            where: { email: credentials.email.toLowerCase().trim() },
            include: { subscription: true },
          })
          if (!user) {
            return null
          }
          const valid = await bcryptjs.compare(
            credentials.password,
            user.passwordHash,
          )
          if (!valid) {
            return null
          }
          return {
            id: user.id,
            email: user.email,
            name: user.name ?? undefined,
            subscriptionStatus: user.subscriptionStatus,
          } as any
        } catch (e) {
          console.error("Auth error:", e)
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.subscriptionStatus = (user as any).subscriptionStatus ?? "none"
      }
      // Bei jedem Aufruf den aktuellen Abo-Status aus der DB laden (vermeidet veraltete Tokens)
      if (token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
          select: { id: true, subscriptionStatus: true, name: true },
        })
        if (dbUser) {
          token.id = dbUser.id
          token.subscriptionStatus = dbUser.subscriptionStatus
          token.name = dbUser.name ?? token.name
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).subscriptionStatus =
          token.subscriptionStatus ?? "none"
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}
