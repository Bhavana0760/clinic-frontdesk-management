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
import { Plus, Calendar, Clock, Edit, X, AlertCircle, CheckCircle, SkipForward, AlertTriangle, User } from "lucide-react"
import { getTokenOrRedirect } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { AppointmentStatusBadge } from "@/components/status-badges"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rescheduleErrors, setRescheduleErrors] = useState<Record<string, string>>({})

  const token = getTokenOrRedirect()
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
  }, [token])

  // Real-time validation when form fields change
  useEffect(() => {
    if (createDialogOpen && (createForm.doctorId || createForm.startAt || createForm.endAt)) {
      validateFormRealtime()
    }
  }, [createForm.doctorId, createForm.startAt, createForm.endAt, createDialogOpen, appointments])

  // Real-time validation for reschedule dialog
  useEffect(() => {
    if (rescheduleDialogOpen && selectedAppointment && (rescheduleForm.startAt || rescheduleForm.endAt)) {
      validateRescheduleRealtime()
    }
  }, [rescheduleForm.startAt, rescheduleForm.endAt, rescheduleDialogOpen, selectedAppointment, appointments])

  const validateRescheduleRealtime = () => {
    if (!selectedAppointment) return
    
    const newErrors: Record<string, string> = {}
    
    // Check for overlapping appointments (excluding current appointment)
    if (rescheduleForm.startAt && rescheduleForm.endAt) {
      const newStart = new Date(rescheduleForm.startAt).getTime()
      const newEnd = new Date(rescheduleForm.endAt).getTime()
      
      const overlappingAppt = appointments.find(appt => {
        // Skip the current appointment being rescheduled
        if (appt.id === selectedAppointment.id) return false
        // Only check appointments for the same doctor
        if (appt.doctor.id !== selectedAppointment.doctor.id) return false
        // Skip canceled and skipped appointments
        if (appt.status === 'canceled' || appt.status === 'skipped') return false
        
        const existingStart = new Date(appt.startAt).getTime()
        const existingEnd = new Date(appt.endAt).getTime()
        
        // Check if there's any overlap: (a.start < newEnd && newStart < a.end)
        return existingStart < newEnd && newStart < existingEnd
      })
      
      if (overlappingAppt) {
        const formatTime = (dateStr: string) => {
          return new Date(dateStr).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }
        newErrors.startAt = `This time slot overlaps with an existing appointment (${formatTime(overlappingAppt.startAt)} - ${formatTime(overlappingAppt.endAt)}) with ${overlappingAppt.patient.name}`
      }
    }
    
    // Check working hours
    if (rescheduleForm.startAt && rescheduleForm.endAt && !newErrors.startAt) {
      const doctor = selectedAppointment.doctor
      if (doctor.workingHours) {
        const appointmentDate = new Date(rescheduleForm.startAt)
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const appointmentDay = dayNames[appointmentDate.getDay()]
        
        const workingDay = doctor.workingHours.find(wh => wh.day === appointmentDay)
        
        if (!workingDay || !workingDay.isWorking) {
          newErrors.startAt = `Dr. ${doctor.name} is not available on ${appointmentDay}`
        } else {
          const appointmentStartTime = appointmentDate.toTimeString().slice(0, 5)
          const appointmentEndTime = new Date(rescheduleForm.endAt).toTimeString().slice(0, 5)
          
          if (appointmentStartTime < workingDay.startTime || appointmentEndTime > workingDay.endTime) {
            newErrors.startAt = `Appointment time must be between ${workingDay.startTime} and ${workingDay.endTime} on ${appointmentDay}`
          }
        }
      }
    }
    
    // Validate end time is after start time
    if (rescheduleForm.startAt && rescheduleForm.endAt) {
      const startTime = new Date(rescheduleForm.startAt)
      const endTime = new Date(rescheduleForm.endAt)
      if (endTime <= startTime) {
        newErrors.endAt = "End time must be after start time"
      }
    }
    
    setRescheduleErrors(newErrors)
  }

  const validateFormRealtime = () => {
    const newErrors: Record<string, string> = {}
    
    // Check if doctor is unavailable
    if (createForm.doctorId) {
      const selectedDoctor = doctors.find(d => d.id === Number(createForm.doctorId))
      if (selectedDoctor && selectedDoctor.availabilityStatus === 'unavailable') {
        newErrors.doctorId = `Dr. ${selectedDoctor.name} is currently unavailable${selectedDoctor.unavailabilityReason ? ': ' + selectedDoctor.unavailabilityReason : ''}`
      }
    }
    
    // Check for overlapping appointments
    if (createForm.doctorId && createForm.startAt && createForm.endAt) {
      const newStart = new Date(createForm.startAt).getTime()
      const newEnd = new Date(createForm.endAt).getTime()
      
      const overlappingAppt = appointments.find(appt => {
        // Only check appointments for the same doctor
        if (appt.doctor.id !== Number(createForm.doctorId)) return false
        // Skip canceled and skipped appointments
        if (appt.status === 'canceled' || appt.status === 'skipped') return false
        
        const existingStart = new Date(appt.startAt).getTime()
        const existingEnd = new Date(appt.endAt).getTime()
        
        // Check if there's any overlap: (a.start < newEnd && newStart < a.end)
        return existingStart < newEnd && newStart < existingEnd
      })
      
      if (overlappingAppt) {
        const formatTime = (dateStr: string) => {
          return new Date(dateStr).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }
        newErrors.startAt = `This time slot overlaps with an existing appointment (${formatTime(overlappingAppt.startAt)} - ${formatTime(overlappingAppt.endAt)}) with ${overlappingAppt.patient.name}`
      }
    }
    
    // Working hours validation
    if (createForm.doctorId && createForm.startAt && createForm.endAt && !newErrors.startAt) {
      const selectedDoctor = doctors.find(d => d.id === Number(createForm.doctorId))
      if (selectedDoctor && selectedDoctor.workingHours) {
        const appointmentDate = new Date(createForm.startAt)
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const appointmentDay = dayNames[appointmentDate.getDay()]
        
        const workingDay = selectedDoctor.workingHours.find(wh => wh.day === appointmentDay)
        
        if (!workingDay || !workingDay.isWorking) {
          newErrors.startAt = `Dr. ${selectedDoctor.name} is not available on ${appointmentDay}`
        } else {
          // Check time ranges
          const appointmentStartTime = appointmentDate.toTimeString().slice(0, 5) // HH:MM format
          const appointmentEndTime = new Date(createForm.endAt).toTimeString().slice(0, 5)
          
          if (appointmentStartTime < workingDay.startTime || appointmentEndTime > workingDay.endTime) {
            newErrors.startAt = `Appointment time must be between ${workingDay.startTime} and ${workingDay.endTime} on ${appointmentDay}`
          }
        }
      }
    }
    
    // Validate end time is after start time
    if (createForm.startAt && createForm.endAt) {
      const startTime = new Date(createForm.startAt)
      const endTime = new Date(createForm.endAt)
      if (endTime <= startTime) {
        newErrors.endAt = "End time must be after start time"
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }))
  }

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
    if (!validateForm()) return

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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || "Failed to create appointment"
        throw new Error(errorMessage)
      }

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
        description: error instanceof Error ? error.message : "Failed to create appointment. Please check for time conflicts.",
        variant: "destructive",
      })
    }
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAppointment) return
    
    // Check for validation errors
    if (Object.keys(rescheduleErrors).length > 0) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors before rescheduling",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments/${selectedAppointment.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(rescheduleForm),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const errorMessage = errorData?.message || "Failed to reschedule appointment"
        throw new Error(errorMessage)
      }

      toast({
        title: "Success",
        description: "Appointment rescheduled successfully",
      })

      setRescheduleDialogOpen(false)
      setSelectedAppointment(null)
      setRescheduleErrors({})
      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reschedule appointment. Please check for time conflicts.",
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

  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments/${id}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })

      if (!response.ok) throw new Error("Failed to update status")

      toast({
        title: "Status Updated",
        description: `Appointment status changed to ${status.replace("_", " ")}`,
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update appointment status",
        variant: "destructive",
      })
    }
  }

  const markUrgent = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/appointments/${id}/priority`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to mark as urgent")

      toast({
        title: "Marked as Urgent",
        description: "Appointment has been marked as urgent",
      })

      fetchData()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark appointment as urgent",
        variant: "destructive",
      })
    }
  }

  const isAppointmentTimeArrived = (appointment: Appointment) => {
    const now = new Date()
    const appointmentStart = new Date(appointment.startAt)
    return now >= appointmentStart
  }

  const openRescheduleDialog = (appointment: Appointment) => {
    setSelectedAppointment(appointment)
    
    // Convert to local datetime string format for datetime-local input
    const formatDateTimeLocal = (dateString: string) => {
      const date = new Date(dateString)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hours = String(date.getHours()).padStart(2, '0')
      const minutes = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day}T${hours}:${minutes}`
    }
    
    setRescheduleForm({
      startAt: formatDateTimeLocal(appointment.startAt),
      endAt: formatDateTimeLocal(appointment.endAt),
    })
    setRescheduleErrors({})
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
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    // Check if doctor is unavailable
    if (createForm.doctorId) {
      const selectedDoctor = doctors.find(d => d.id === Number(createForm.doctorId))
      if (selectedDoctor && selectedDoctor.availabilityStatus === 'unavailable') {
        newErrors.doctorId = `Dr. ${selectedDoctor.name} is currently unavailable${selectedDoctor.unavailabilityReason ? ': ' + selectedDoctor.unavailabilityReason : ''}`
      }
    }
    
    // Basic validation
    if (createForm.patientPhone && !/^\d{10}$/.test(createForm.patientPhone)) {
      newErrors.patientPhone = "Phone number must be exactly 10 digits."
    }
    if (createForm.patientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(createForm.patientEmail)) {
      newErrors.patientEmail = "Please enter a valid email address."
    }
    
    // Check for overlapping appointments
    if (createForm.doctorId && createForm.startAt && createForm.endAt) {
      const newStart = new Date(createForm.startAt).getTime()
      const newEnd = new Date(createForm.endAt).getTime()
      
      const overlappingAppt = appointments.find(appt => {
        // Only check appointments for the same doctor
        if (appt.doctor.id !== Number(createForm.doctorId)) return false
        // Skip canceled and skipped appointments
        if (appt.status === 'canceled' || appt.status === 'skipped') return false
        
        const existingStart = new Date(appt.startAt).getTime()
        const existingEnd = new Date(appt.endAt).getTime()
        
        // Check if there's any overlap: (a.start < newEnd && newStart < a.end)
        return existingStart < newEnd && newStart < existingEnd
      })
      
      if (overlappingAppt) {
        const formatTime = (dateStr: string) => {
          return new Date(dateStr).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          })
        }
        newErrors.startAt = `This time slot overlaps with an existing appointment (${formatTime(overlappingAppt.startAt)} - ${formatTime(overlappingAppt.endAt)}) with ${overlappingAppt.patient.name}`
      }
    }
    
    // Working hours validation
    if (createForm.doctorId && createForm.startAt && createForm.endAt && !newErrors.startAt) {
      const selectedDoctor = doctors.find(d => d.id === Number(createForm.doctorId))
      if (selectedDoctor && selectedDoctor.workingHours) {
        const appointmentDate = new Date(createForm.startAt)
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const appointmentDay = dayNames[appointmentDate.getDay()]
        
        const workingDay = selectedDoctor.workingHours.find(wh => wh.day === appointmentDay)
        
        if (!workingDay || !workingDay.isWorking) {
          newErrors.startAt = `Dr. ${selectedDoctor.name} is not available on ${appointmentDay}`
        } else {
          // Check time ranges
          const appointmentStartTime = appointmentDate.toTimeString().slice(0, 5) // HH:MM format
          const appointmentEndTime = new Date(createForm.endAt).toTimeString().slice(0, 5)
          
          if (appointmentStartTime < workingDay.startTime || appointmentEndTime > workingDay.endTime) {
            newErrors.startAt = `Appointment time must be between ${workingDay.startTime} and ${workingDay.endTime} on ${appointmentDay}`
          }
        }
      }
    }
    
    // Validate end time is after start time
    if (createForm.startAt && createForm.endAt) {
      const startTime = new Date(createForm.startAt)
      const endTime = new Date(createForm.endAt)
      if (endTime <= startTime) {
        newErrors.endAt = "End time must be after start time"
      }
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
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
                        {doctors.map((doctor) => {
                          const isUnavailable = doctor.availabilityStatus === 'unavailable'
                          return (
                            <SelectItem 
                              key={doctor.id} 
                              value={doctor.id.toString()}
                              disabled={isUnavailable}
                              className={isUnavailable ? "opacity-50" : ""}
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                <span className="flex-1">
                                  {doctor.name} - {doctor.specialization}
                                </span>
                                {isUnavailable && (
                                  <Badge variant="destructive" className="ml-2 text-xs">
                                    <AlertCircle className="h-3 w-3 mr-1" />
                                    Unavailable
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    {errors.doctorId && (
                      <p className="text-sm text-destructive flex items-start gap-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {errors.doctorId}
                      </p>
                    )}
                  </div>
                  
                  {/* Display Doctor's Working Hours and Availability */}
                  {createForm.doctorId && (() => {
                    const selectedDoctor = doctors.find(d => d.id === Number(createForm.doctorId))
                    if (selectedDoctor) {
                      const isUnavailable = selectedDoctor.availabilityStatus === 'unavailable'
                      
                      return (
                        <div className={`space-y-2 p-3 rounded-lg border ${isUnavailable ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                          <div className="flex items-center justify-between">
                            <Label className={`text-sm font-semibold ${isUnavailable ? 'text-red-800' : 'text-blue-800'}`}>
                              {selectedDoctor.name}
                            </Label>
                            {isUnavailable && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Unavailable
                              </Badge>
                            )}
                          </div>
                          
                          {isUnavailable ? (
                            <div className="bg-white p-2 rounded border border-red-200">
                              <p className="text-xs text-red-700 font-medium">
                                This doctor is currently unavailable
                              </p>
                              {selectedDoctor.unavailabilityReason && (
                                <p className="text-xs text-red-600 mt-1">
                                  Reason: {selectedDoctor.unavailabilityReason}
                                </p>
                              )}
                            </div>
                          ) : selectedDoctor.workingHours ? (
                            <>
                              <Label className="text-xs text-blue-700">Available Hours:</Label>
                              {(() => {
                                const workingDays = selectedDoctor.workingHours.filter(wh => wh.isWorking)
                                return workingDays.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {workingDays.map((workingDay) => (
                                      <div key={workingDay.day} className="flex justify-between items-center text-xs bg-white p-2 rounded border">
                                        <span className="font-medium">{workingDay.day}:</span>
                                        <span>{workingDay.startTime} - {workingDay.endTime}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-blue-600">No working hours set for this doctor</p>
                                )
                              })()}
                            </>
                          ) : (
                            <p className="text-xs text-blue-600">No working hours set for this doctor</p>
                          )}
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patientName">Patient Name</Label>
                  <Input
                    id="patientName"
                    value={createForm.patientName}
                    onChange={(e) => setCreateForm({ ...createForm, patientName: e.target.value })}
                    placeholder="Patient full name"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientPhone">Phone (optional)</Label>
                    <Input
                      id="patientPhone"
                      value={createForm.patientPhone}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, patientPhone: e.target.value })
                        setErrors(prev => ({ ...prev, patientPhone: "" }))
                      }}
                      placeholder="Patient phone number"
                    />
                    {errors.patientPhone && <p className="text-red-500 text-sm">{errors.patientPhone}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="patientEmail">Email (optional)</Label>
                    <Input
                      id="patientEmail"
                      type="email"
                      value={createForm.patientEmail}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, patientEmail: e.target.value })
                        setErrors(prev => ({ ...prev, patientEmail: "" }))
                      }}
                      placeholder="Patient email"
                    />
                    {errors.patientEmail && <p className="text-red-500 text-sm">{errors.patientEmail}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startAt">Start Time</Label>
                    <Input
                      id="startAt"
                      type="datetime-local"
                      value={createForm.startAt}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, startAt: e.target.value })
                        setErrors(prev => ({ ...prev, startAt: "" }))
                      }}
                      required
                    />
                    {errors.startAt && (
                      <p className="text-sm text-destructive flex items-start gap-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {errors.startAt}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endAt">End Time</Label>
                    <Input
                      id="endAt"
                      type="datetime-local"
                      value={createForm.endAt}
                      onChange={(e) => {
                        setCreateForm({ ...createForm, endAt: e.target.value })
                        setErrors(prev => ({ ...prev, endAt: "" }))
                      }}
                      required
                    />
                    {errors.endAt && (
                      <p className="text-sm text-destructive flex items-start gap-1">
                        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        {errors.endAt}
                      </p>
                    )}
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
                <TableHead>Priority</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {appointments.map((appointment) => {
                const timeArrived = isAppointmentTimeArrived(appointment)
                return (
                  <TableRow key={appointment.id} className={appointment.urgent ? "bg-red-50" : ""}>
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
                    <TableCell>
                      {appointment.urgent && (
                        <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                          <AlertTriangle className="h-3 w-3" />
                          Urgent
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <TooltipProvider>
                        <div className="flex justify-end gap-1 flex-wrap">
                          {/* With Doctor button - only for booked status */}
                          {appointment.status === "booked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(appointment.id, "with_doctor")}
                                  disabled={!timeArrived}
                                  className="text-blue-600 hover:text-blue-700 disabled:opacity-50"
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{timeArrived ? "Mark as with doctor" : "Available when appointment time arrives"}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Complete button - only for with_doctor status */}
                          {appointment.status === "with_doctor" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(appointment.id, "completed")}
                                  disabled={!timeArrived}
                                  className="text-green-600 hover:text-green-700 disabled:opacity-50"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{timeArrived ? "Mark as completed" : "Available when appointment time arrives"}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Skip button - only for booked status */}
                          {appointment.status === "booked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => updateStatus(appointment.id, "skipped")}
                                  disabled={!timeArrived}
                                  className="text-orange-600 hover:text-orange-700 disabled:opacity-50"
                                >
                                  <SkipForward className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{timeArrived ? "Skip appointment" : "Available when appointment time arrives"}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Mark as urgent button - only for booked status and not already urgent */}
                          {!appointment.urgent && appointment.status === "booked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => markUrgent(appointment.id)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <AlertTriangle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Mark as urgent</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Reschedule button - only for booked status */}
                          {appointment.status === "booked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => openRescheduleDialog(appointment)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reschedule appointment</p>
                              </TooltipContent>
                            </Tooltip>
                          )}

                          {/* Cancel button - only for booked status (not available once with_doctor) */}
                          {appointment.status === "booked" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancel(appointment.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Cancel appointment</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TooltipProvider>
                    </TableCell>
                  </TableRow>
                )
              })}
              {appointments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
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
            <DialogDescription>
              Update the appointment time for {selectedAppointment?.patient.name} with Dr. {selectedAppointment?.doctor.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleReschedule}>
            <div className="grid gap-4 py-4">
              {/* Display Doctor's Working Hours */}
              {selectedAppointment?.doctor.workingHours && (
                <div className="p-3 rounded-lg border bg-blue-50 border-blue-200">
                  <Label className="text-xs text-blue-700">Dr. {selectedAppointment.doctor.name}'s Available Hours:</Label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {selectedAppointment.doctor.workingHours
                      .filter(wh => wh.isWorking)
                      .map((workingDay) => (
                        <div key={workingDay.day} className="flex justify-between items-center text-xs bg-white p-2 rounded border">
                          <span className="font-medium">{workingDay.day}:</span>
                          <span>{workingDay.startTime} - {workingDay.endTime}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="reschedule-start">Start Time</Label>
                <Input
                  id="reschedule-start"
                  type="datetime-local"
                  value={rescheduleForm.startAt}
                  onChange={(e) => {
                    setRescheduleForm({ ...rescheduleForm, startAt: e.target.value })
                    setRescheduleErrors(prev => ({ ...prev, startAt: "" }))
                  }}
                  required
                />
                {rescheduleErrors.startAt && (
                  <p className="text-sm text-destructive flex items-start gap-1">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {rescheduleErrors.startAt}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reschedule-end">End Time</Label>
                <Input
                  id="reschedule-end"
                  type="datetime-local"
                  value={rescheduleForm.endAt}
                  onChange={(e) => {
                    setRescheduleForm({ ...rescheduleForm, endAt: e.target.value })
                    setRescheduleErrors(prev => ({ ...prev, endAt: "" }))
                  }}
                  required
                />
                {rescheduleErrors.endAt && (
                  <p className="text-sm text-destructive flex items-start gap-1">
                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {rescheduleErrors.endAt}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setRescheduleDialogOpen(false)
                setRescheduleErrors({})
              }}>
                Cancel
              </Button>
              <Button type="submit" disabled={Object.keys(rescheduleErrors).length > 0}>
                Reschedule
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
