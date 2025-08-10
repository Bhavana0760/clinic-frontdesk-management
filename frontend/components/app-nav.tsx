"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LogOut, Stethoscope } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { clearToken, getToken } from "@/lib/auth"
import { useEffect, useState } from "react"

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/queue", label: "Queue" },
  { href: "/doctors", label: "Doctors" },
  { href: "/appointments", label: "Appointments" },
]

export function AppNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setToken(getToken())
    setIsLoaded(true)
  }, [])

  const handleLogout = () => {
    clearToken()
    router.push("/login")
  }

  // Don't show header on root page or login page
  if (pathname === "/" || pathname === "/login") {
    return null
  }

  // Show navigation only when authenticated
  const showNav = isLoaded && token

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <Stethoscope className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Clinic Front Desk</span>
        </Link>

        {showNav && (
          <>
            <nav className="mx-6 flex items-center space-x-4 lg:space-x-6">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary",
                    pathname === item.href ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
