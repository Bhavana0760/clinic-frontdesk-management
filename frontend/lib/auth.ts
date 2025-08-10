"use client"

export function saveToken(token: string) {
  localStorage.setItem("token", token)
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("token")
}

export function getTokenOrRedirect(): string {
  const token = getToken()
  if (!token && typeof window !== "undefined") {
    window.location.href = "/login"
  }
  return token || ""
}

export function clearToken() {
  localStorage.removeItem("token")
}
