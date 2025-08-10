"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, Clock, TrendingUp } from "lucide-react"
import { getTokenOrRedirect } from "@/lib/auth"
import { AppointmentStatusBadge, QueueStatusBadge } from "@/components/status-badges"
import type { QueueEntry, Appointment } from "@/lib/types"

export default function DashboardPage() {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const token = getTokenOrRedirect()

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return

      try {
        const [queueRes, appointmentsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/queue`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ])

        const [queueData, appointmentsData] = await Promise.all([queueRes.json(), appointmentsRes.json()])

        setQueue(queueData)
        setAppointments(appointmentsData)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token])

  const stats = {
    totalQueue: queue.length,
    waitingPatients: queue.filter((q) => q.status === "waiting").length,
    todayAppointments: appointments.filter((a) => {
      const today = new Date().toDateString()
      return new Date(a.startAt).toDateString() === today
    }).length,
    completedToday: appointments.filter((a) => {
      const today = new Date().toDateString()
      return new Date(a.startAt).toDateString() === today && a.status === "completed"
    }).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening at your clinic today.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/queue">Manage Queue</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/appointments">View Appointments</Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalQueue}</div>
            <p className="text-xs text-muted-foreground">{stats.waitingPatients} waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">{stats.completedToday} completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting Patients</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.waitingPatients}</div>
            <p className="text-xs text-muted-foreground">Currently waiting</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.todayAppointments > 0 ? Math.round((stats.completedToday / stats.todayAppointments) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Today's completion</p>
          </CardContent>
        </Card>
      </div>

      {/* Queue and Appointments Overview */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Queue</CardTitle>
            <CardDescription>Patients waiting to be seen</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {queue.slice(0, 5).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.queueNumber}</TableCell>
                    <TableCell>{entry.patientName}</TableCell>
                    <TableCell>
                      <QueueStatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell>{entry.urgent && <Badge variant="destructive">Urgent</Badge>}</TableCell>
                  </TableRow>
                ))}
                {queue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No patients in queue
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {queue.length > 5 && (
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/queue">View All ({queue.length})</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Today's Appointments</CardTitle>
            <CardDescription>Scheduled appointments for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments
                .filter((a) => {
                  const today = new Date().toDateString()
                  return new Date(a.startAt).toDateString() === today
                })
                .slice(0, 5)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{appointment.patient.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(appointment.startAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        - {appointment.doctor.name}
                      </p>
                    </div>
                    <AppointmentStatusBadge status={appointment.status} />
                  </div>
                ))}
              {appointments.filter((a) => {
                const today = new Date().toDateString()
                return new Date(a.startAt).toDateString() === today
              }).length === 0 && (
                <div className="text-center text-muted-foreground py-4">No appointments scheduled for today</div>
              )}
            </div>
            {stats.todayAppointments > 5 && (
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/appointments">View All ({stats.todayAppointments})</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
