// NextAuth Typ-Erweiterung: custom Felder in Session/Token
import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      subscriptionStatus: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string
    subscriptionStatus?: string
  }
}
