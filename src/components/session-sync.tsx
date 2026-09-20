"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { useGV } from "@/store/gv"

/// Synchronisiert die NextAuth-Session mit dem Zustand-Store.
/// Wird einmal im Root der App eingebunden.
export function SessionSync() {
  const { data: session, status } = useSession()
  const setSession = useGV((s) => s.setSession)
  const setSessionLoading = useGV((s) => s.setSessionLoading)

  useEffect(() => {
    setSessionLoading(status === "loading")
    if (status === "authenticated" && session?.user) {
      setSession({
        id: (session.user as any).id,
        email: session.user.email!,
        name: session.user.name,
        subscriptionStatus:
          (session.user as any).subscriptionStatus ?? "none",
      })
    } else if (status === "unauthenticated") {
      setSession(null)
    }
  }, [session, status, setSession, setSessionLoading])

  return null
}
