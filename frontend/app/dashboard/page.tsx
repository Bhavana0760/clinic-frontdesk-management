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

  const activeQueue = queue.filter((q) => q.status === "waiting" || q.status === "with_doctor")
  const completedSkippedQueue = queue.filter((q) => q.status === "completed" || q.status === "skipped")

  const stats = {
    totalQueue: activeQueue.length,
    waitingPatients: queue.filter((q) => q.status === "waiting").length,
    todayAppointments: appointments.filter((a) => {
      const today = new Date().toDateString()
      return new Date(a.startAt).toDateString() === today && a.status !== "canceled" && a.status !== "skipped"
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
            <CardTitle>Active Queue</CardTitle>
            <CardDescription>Patients waiting or with doctor</CardDescription>
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
                {activeQueue.slice(0, 5).map((entry) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">{entry.queueNumber}</TableCell>
                    <TableCell>{entry.patientName}</TableCell>
                    <TableCell>
                      <QueueStatusBadge status={entry.status} />
                    </TableCell>
                    <TableCell>{entry.urgent && <Badge variant="destructive">Urgent</Badge>}</TableCell>
                  </TableRow>
                ))}
                {activeQueue.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No active patients in queue
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {activeQueue.length > 5 && (
              <div className="mt-4 text-center">
                <Button asChild variant="outline">
                  <Link href="/queue">View All ({activeQueue.length})</Link>
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
                  return new Date(a.startAt).toDateString() === today && a.status !== "canceled" && a.status !== "skipped"
                })
                .slice(0, 5)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 ${appointment.urgent ? "bg-red-50 border-red-200" : ""}`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{appointment.patient.name}</p>
                        {appointment.urgent && (
                          <Badge variant="destructive" className="text-xs">Urgent</Badge>
                        )}
                      </div>
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
                return new Date(a.startAt).toDateString() === today && a.status !== "canceled" && a.status !== "skipped"
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

      {/* Completed and Skipped Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Completed & Skipped Patients (Queue)</CardTitle>
          <CardDescription>Queue entries that have been completed or skipped today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedSkippedQueue.slice(0, 10).map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-medium">{entry.queueNumber}</TableCell>
                  <TableCell>{entry.patientName}</TableCell>
                  <TableCell>{entry.patientPhone || "-"}</TableCell>
                  <TableCell>
                    <QueueStatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell>{entry.urgent && <Badge variant="destructive">Urgent</Badge>}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                </TableRow>
              ))}
              {completedSkippedQueue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No completed or skipped patients yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {completedSkippedQueue.length > 10 && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/queue">View All ({completedSkippedQueue.length})</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Completed and Skipped Appointments */}
      <Card>
        <CardHeader>
          <CardTitle>Completed & Skipped Appointments</CardTitle>
          <CardDescription>Appointments that have been completed or skipped today</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments
                .filter((a) => {
                  const today = new Date().toDateString()
                  return new Date(a.startAt).toDateString() === today && (a.status === "completed" || a.status === "skipped")
                })
                .slice(0, 10)
                .map((appointment) => (
                  <TableRow key={appointment.id} className={appointment.urgent ? "bg-red-50" : ""}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(appointment.startAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}{" "}
                        -{" "}
                        {new Date(appointment.endAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{appointment.patient.name}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{appointment.doctor.name}</div>
                        <div className="text-xs text-muted-foreground">{appointment.doctor.specialization}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <AppointmentStatusBadge status={appointment.status} />
                    </TableCell>
                    <TableCell>
                      {appointment.urgent && (
                        <Badge variant="destructive" className="text-xs">Urgent</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              {appointments.filter((a) => {
                const today = new Date().toDateString()
                return new Date(a.startAt).toDateString() === today && (a.status === "completed" || a.status === "skipped")
              }).length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No completed or skipped appointments yet
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {appointments.filter((a) => {
            const today = new Date().toDateString()
            return new Date(a.startAt).toDateString() === today && (a.status === "completed" || a.status === "skipped")
          }).length > 10 && (
            <div className="mt-4 text-center">
              <Button asChild variant="outline">
                <Link href="/appointments">View All</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
