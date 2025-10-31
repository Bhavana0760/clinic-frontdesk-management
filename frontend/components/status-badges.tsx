import { Badge } from "@/components/ui/badge"

export function AppointmentStatusBadge({ status }: { status: string }) {
  const variants = {
    booked: "default" as const,
    completed: "secondary" as const,
    canceled: "destructive" as const,
    skipped: "destructive" as const,
    with_doctor: "outline" as const,
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || "outline"}>
      {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  )
}

export function QueueStatusBadge({ status }: { status: string }) {
  const variants = {
    waiting: "default" as const,
    with_doctor: "secondary" as const,
    completed: "outline" as const,
    skipped: "destructive" as const,
  }

  return (
    <Badge variant={variants[status as keyof typeof variants] || "outline"}>
      {status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
    </Badge>
  )
}
