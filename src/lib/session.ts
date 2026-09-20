import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return null
  return session.user as {
    id: string
    email: string
    name?: string | null
    subscriptionStatus: string
  }
}

/// Prueft, ob der aktuelle Nutzer ein aktives Abo hat.
export async function hasActiveSubscription(): Promise<{
  active: boolean
  userId: string | null
  email: string | null
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) return { active: false, userId: null, email: null }
  const user = await db.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, email: true, subscriptionStatus: true },
  })
  if (!user) return { active: false, userId: null, email: null }
  return {
    active: user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing",
    userId: user.id,
    email: user.email,
  }
}
