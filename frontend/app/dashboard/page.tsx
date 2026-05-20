"use client"

import { useAuth } from "@/contexts/authContext/AuthContext"
import { Button } from "@/components/ui/Button"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push("/login")
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 dark">
      <div className="w-full max-w-2xl">
        <h1 className="text-3xl font-semibold text-foreground mb-4">Dashboard</h1>
        <div className="bg-card border border-border rounded-lg p-6 space-y-4">
          <div>
            <p className="text-sm text-foreground/60">Logged in as:</p>
            <p className="text-lg font-medium text-foreground">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-foreground/60">User ID:</p>
            <p className="text-sm font-mono text-foreground">{user?.id}</p>
          </div>
          <Button
            variant="primary"
            size="md"
            onClick={handleSignOut}
            className="mt-4"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  )
}
