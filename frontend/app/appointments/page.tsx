"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Calendar, Clock, Edit, X } from "lucide-react"
import { getTokenOrRedirect } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { AppointmentStatusBadge } from "@/components/status-badges"
import type { Appointment, Doctor } from "@/lib/types"

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null)

  const [createForm, setCreateForm] = useState({
    doctorId: "",
    patientId: "0",
    patientName: "",
    patientPhone: "",
    patientEmail: "",
    startAt: "",
    endAt: "",
  })

  const [rescheduleForm, setRescheduleForm] = useState({
    startAt: "",
    endAt: "",
  })

  const token = getTokenOrRedirect()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [token])

  const fetchData = async () => {
    if (!token) return

    try {
      const [appointmentsRes, doctorsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/doctors`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      const [appointmentsData, doctorsData] = await Promise.all([appointmentsRes.json(), doctorsRes.json()])

      setAppointments(appointmentsData)
      setDoctors(doctorsData)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...createForm,
          doctorId: Number(createForm.doctorId),
          patientId: Number(createForm.patientId),
          status: "booked",
        }),
      })

      if (!response.ok) throw new Error("Failed to create appointment")

      toast({
        title: "Success",
        description: "Appointment created successfully",
      })

      setCreateDialogOpen(false)
      resetCreateForm()
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create appointment. Please check for time conflicts.",
        variant: "destructive",
      })
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rescheduleForm),
      })

      if (!response.ok) throw new Error("Failed to reschedule appointment")

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      })

      setRescheduleDialogOpen(false)
      setSelectedAppointment(null)
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reschedule appointment. Please check for time conflicts.",
        variant: "destructive",
      })
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm("Are you sure you want to cancel this appointment?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to cancel appointment")

      toast({
        title: "Success",
        description: "Appointment cancelled successfully",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel appointment",
        variant: "destructive",
      })
    }
  }

  const openRescheduleDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    setRescheduleForm({
      startAt: new Date(appointment.startAt).toISOString().slice(0, 16),
      endAt: new Date(appointment.endAt).toISOString().slice(0, 16),
    })
    setRescheduleDialogOpen(true)
  }

  const resetCreateForm = () => {
    setCreateForm({
      doctorId: "",
      patientId: "0",
      patientName: "",
      patientPhone: "",
      patientEmail: "",
      startAt: "",
      endAt: "",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading appointments...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">Manage patient appointments and schedules</p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetCreateForm}>
              <Plus className="mr-2 h-4 w-4" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Book New Appointment</DialogTitle>
              <DialogDescription>Schedule a new appointment for a patient</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAppointment}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="doctor">Doctor</Label>
                    <Select
                      value={createForm.doctorId}
                      onValueChange={(value) => setCreateForm({ ...createForm, doctorId: value })}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select doctor" />
                      </SelectTrigger>
                      <SelectContent>
                        {doctors.map((doctor) => (
                          <SelectItem key={doctor.id} value={doctor.id.toString()}>
                            {doctor.name} - {doctor.specialization}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientId">Patient ID (0 for new)</Label>
                    <Input
                      id="patientId"
                      type="number"
                      value={createForm.patientId}
                      onChange={(e) => setCreateForm({ ...createForm, patientId: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={createForm.patientName}
                    onChange={(e) => setCreateForm({ ...createForm, patientName: e.target.value })}
                    placeholder="Patient full name"
                    required={createForm.patientId === "0"}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Phone (optional)</Label>
                    <Input
                      id="patientPhone"
                      value={createForm.patientPhone}
                      onChange={(e) => setCreateForm({ ...createForm, patientPhone: e.target.value })}
                      placeholder="Patient phone number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientEmail">Email (optional)</Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      value={createForm.patientEmail}
                      onChange={(e) => setCreateForm({ ...createForm, patientEmail: e.target.value })}
                      placeholder="Patient email"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">Start Time</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={createForm.startAt}
                      onChange={(e) => setCreateForm({ ...createForm, startAt: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endAt">End Time</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      value={createForm.endAt}
                      onChange={(e) => setCreateForm({ ...createForm, endAt: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Book Appointment</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            All Appointments
            <Badge variant="secondary" className="ml-2">
              {appointments.length} total
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => (
                <TableRow key={appointment.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{new Date(appointment.startAt).toLocaleDateString()}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
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
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{appointment.patient.name}</div>
                      {appointment.patient.phone && (
                        <div className="text-sm text-muted-foreground">{appointment.patient.phone}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{appointment.doctor.name}</div>
                      <div className="text-sm text-muted-foreground">{appointment.doctor.specialization}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AppointmentStatusBadge status={appointment.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {appointment.status !== "canceled" && (
                        <Button variant="outline" size="sm" onClick={() => openRescheduleDialog(appointment)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {appointment.status !== "canceled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancel(appointment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No appointments found. Book your first appointment to get started.
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Reschedule Dialog */}
      <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule Appointment</DialogTitle>
            <DialogDescription>Update the appointment time for {selectedAppointment?.patient.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReschedule}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="reschedule-start">Start Time</Label>
                <Input
                  id="reschedule-start"
                  type="datetime-local"
                  value={rescheduleForm.startAt}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, startAt: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-end">End Time</Label>
                <Input
                  id="reschedule-end"
                  type="datetime-local"
                  value={rescheduleForm.endAt}
                  onChange={(e) => setRescheduleForm({ ...rescheduleForm, endAt: e.target.value })}
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setRescheduleDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Reschedule</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
