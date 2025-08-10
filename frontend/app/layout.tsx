import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AppNav } from "@/components/app-nav"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Clinic Front Desk System",
  description: "Modern clinic management system for front desk operations",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppNav />
        <main className="container mx-auto py-6">{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
