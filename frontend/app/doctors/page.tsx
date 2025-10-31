"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, UserCheck, AlertCircle } from "lucide-react"
import { getTokenOrRedirect } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import type { Doctor } from "@/lib/types"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [availabilityDialogOpen, setAvailabilityDialogOpen] = useState(false)
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null)
  const [unavailabilityReason, setUnavailabilityReason] = useState("")
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    specialization: "",
    location: "",
  })
  const [formData, setFormData] = useState({
    name: "",
    specialization: "",
    gender: "",
    location: "",
    availabilityStatus: "available" as 'available' | 'unavailable',
    workingHours: [
      { day: "Monday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      { day: "Tuesday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      { day: "Wednesday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      { day: "Thursday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      { day: "Friday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      { day: "Saturday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      { day: "Sunday", isWorking: false, startTime: "09:00", endTime: "17:00" },
    ]
  })

  const token = getTokenOrRedirect()
  const { toast } = useToast()

  useEffect(() => {
    fetchDoctors()
  }, [token])

  useEffect(() => {
    filterDoctors()
  }, [doctors, searchTerm, filters])

  const fetchDoctors = async () => {
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/doctors`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setDoctors(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch doctors",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterDoctors = () => {
    let filtered = doctors

    if (searchTerm) {
      filtered = filtered.filter((doctor) => doctor.name.toLowerCase().includes(searchTerm.toLowerCase()))
    }

    if (filters.specialization) {
      filtered = filtered.filter((doctor) =>
        doctor.specialization.toLowerCase().includes(filters.specialization.toLowerCase()),
      )
    }

    if (filters.location) {
      filtered = filtered.filter((doctor) => doctor.location.toLowerCase().includes(filters.location.toLowerCase()))
    }

    setFilteredDoctors(filtered)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Frontend validation for required fields
    if (!formData.name.trim() || !formData.specialization.trim() || !formData.gender.trim() || !formData.location.trim()) {
      toast({
        title: "Error",
        description: "All fields are required.",
        variant: "destructive",
      })
      return
    }

    // Validate working hours
    const workingDays = formData.workingHours.filter(wh => wh.isWorking)
    if (workingDays.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one working day with valid hours.",
        variant: "destructive",
      })
      return
    }

    // Validate time ranges for working days
    for (const workingDay of workingDays) {
      const startTime = new Date(`1970-01-01T${workingDay.startTime}:00`)
      const endTime = new Date(`1970-01-01T${workingDay.endTime}:00`)
      
      if (endTime <= startTime) {
        toast({
          title: "Error",
          description: `Invalid time range for ${workingDay.day}. End time must be after start time.`,
          variant: "destructive",
        })
        return
      }
    }

    try {
      const url = editingDoctor
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/doctors/${editingDoctor.id}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL}/doctors`

      const method = editingDoctor ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save doctor: ${errorText}`)
      }

      await response.json();

      toast({
        title: "Success",
        description: `Doctor ${editingDoctor ? "updated" : "created"} successfully`,
      })

      setDialogOpen(false)
      resetForm()
      fetchDoctors()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save doctor",
        variant: "destructive",
      })
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this doctor?")) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/doctors/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to delete doctor")

      toast({
        title: "Success",
        description: "Doctor deleted successfully",
      })

      fetchDoctors()
    } catch (error) {
      toast({
        title: "Error",
        description: "Cannot delete doctor with existing appointments",
        variant: "destructive",
      })
    }
  }

  const handleAvailabilityChange = async (doctorId: number, newStatus: 'available' | 'unavailable') => {
    if (newStatus === 'unavailable') {
      // Open dialog to get reason
      const doctor = doctors.find(d => d.id === doctorId)
      if (doctor) {
        setSelectedDoctor(doctor)
        setUnavailabilityReason(doctor.unavailabilityReason || "")
        setAvailabilityDialogOpen(true)
      }
    } else {
      // Directly update to available
      await updateAvailabilityStatus(doctorId, newStatus, "")
    }
  }

  const updateAvailabilityStatus = async (doctorId: number, status: 'available' | 'unavailable', reason: string) => {
    try {
      const body: any = {
        availabilityStatus: status,
      }
      
      if (status === 'unavailable' && reason) {
        body.unavailabilityReason = reason
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/doctors/${doctorId}/availability`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error("Failed to update availability")

      toast({
        title: "Success",
        description: `Doctor marked as ${status}`,
      })

      fetchDoctors()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update availability status",
        variant: "destructive",
      })
    }
  }

  const handleAvailabilitySubmit = async () => {
    if (!selectedDoctor) return

    if (!unavailabilityReason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for unavailability",
        variant: "destructive",
      })
      return
    }

    await updateAvailabilityStatus(selectedDoctor.id, 'unavailable', unavailabilityReason)
    setAvailabilityDialogOpen(false)
    setSelectedDoctor(null)
    setUnavailabilityReason("")
  }

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      gender: doctor.gender,
      location: doctor.location,
      availabilityStatus: doctor.availabilityStatus || 'available',
      workingHours: doctor.workingHours || [
        { day: "Monday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Tuesday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Wednesday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Thursday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Friday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Saturday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Sunday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      ]
    })
    setDialogOpen(true)
  }

  const resetForm = () => {
    setEditingDoctor(null)
    setFormData({
      name: "",
      specialization: "",
      gender: "",
      location: "",
      availabilityStatus: "available",
      workingHours: [
        { day: "Monday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Tuesday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Wednesday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Thursday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Friday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Saturday", isWorking: false, startTime: "09:00", endTime: "17:00" },
        { day: "Sunday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      ]
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading doctors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Doctors</h1>
          <p className="text-muted-foreground">Manage doctor profiles and information</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingDoctor ? "Edit Doctor" : "Add New Doctor"}</DialogTitle>
              <DialogDescription>
                {editingDoctor
                  ? "Update the doctor's information below."
                  : "Fill in the details to add a new doctor to the system."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Dr. John Smith"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="specialization">Specialization</Label>
                  <Input
                    id="specialization"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="Cardiology"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Input
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    placeholder="Male/Female"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Clinic A"
                    required
                  />
                </div>
                
                {/* Working Hours Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-base font-semibold">Working Hours</Label>
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newWorkingHours = formData.workingHours.map(wh => ({
                            ...wh,
                            isWorking: true,
                            startTime: "09:00",
                            endTime: "17:00"
                          }))
                          setFormData({ ...formData, workingHours: newWorkingHours })
                        }}
                      >
                        Set All Weekdays
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const newWorkingHours = formData.workingHours.map(wh => ({
                            ...wh,
                            isWorking: false
                          }))
                          setFormData({ ...formData, workingHours: newWorkingHours })
                        }}
                      >
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {formData.workingHours.map((schedule, index) => {
                      const startTime = schedule.startTime ? new Date(`1970-01-01T${schedule.startTime}:00`) : null
                      const endTime = schedule.endTime ? new Date(`1970-01-01T${schedule.endTime}:00`) : null
                      const hasTimeError = schedule.isWorking && startTime && endTime && endTime <= startTime
                      
                      return (
                        <div key={schedule.day} className={`flex items-center space-x-4 p-3 border rounded-lg ${hasTimeError ? 'border-red-300 bg-red-50' : ''}`}>
                          <div className="flex items-center space-x-2 min-w-[120px]">
                            <Checkbox
                              id={`working-${schedule.day}`}
                              checked={schedule.isWorking}
                              onCheckedChange={(checked) => {
                                const newWorkingHours = [...formData.workingHours]
                                newWorkingHours[index].isWorking = checked as boolean
                                setFormData({ ...formData, workingHours: newWorkingHours })
                              }}
                            />
                            <Label htmlFor={`working-${schedule.day}`} className="text-sm font-medium">
                              {schedule.day}
                            </Label>
                          </div>
                          
                          {schedule.isWorking && (
                            <div className="flex items-center space-x-2 flex-1">
                              <div className="flex items-center space-x-1">
                                <Label htmlFor={`start-${schedule.day}`} className="text-xs">From:</Label>
                                <Input
                                  id={`start-${schedule.day}`}
                                  type="time"
                                  value={schedule.startTime}
                                  onChange={(e) => {
                                    const newWorkingHours = [...formData.workingHours]
                                    newWorkingHours[index].startTime = e.target.value
                                    setFormData({ ...formData, workingHours: newWorkingHours })
                                  }}
                                  className={`w-28 ${hasTimeError ? 'border-red-300' : ''}`}
                                  min="00:00"
                                  max="23:59"
                                />
                              </div>
                              <div className="flex items-center space-x-1">
                                <Label htmlFor={`end-${schedule.day}`} className="text-xs">To:</Label>
                                <Input
                                  id={`end-${schedule.day}`}
                                  type="time"
                                  value={schedule.endTime}
                                  onChange={(e) => {
                                    const newWorkingHours = [...formData.workingHours]
                                    newWorkingHours[index].endTime = e.target.value
                                    setFormData({ ...formData, workingHours: newWorkingHours })
                                  }}
                                  className={`w-28 ${hasTimeError ? 'border-red-300' : ''}`}
                                  min="00:00"
                                  max="23:59"
                                />
                              </div>
                              {hasTimeError && (
                                <span className="text-xs text-red-500">Invalid time range</span>
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">{editingDoctor ? "Update" : "Create"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search by name</Label>
              <Input
                id="search"
                placeholder="Search doctors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization-filter">Specialization</Label>
              <Input
                id="specialization-filter"
                placeholder="Filter by specialization"
                value={filters.specialization}
                onChange={(e) => setFilters({ ...filters, specialization: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location-filter">Location</Label>
              <Input
                id="location-filter"
                placeholder="Filter by location"
                value={filters.location}
                onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("")
                  setFilters({ specialization: "", location: "" })
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Doctors Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Doctors List
            <Badge variant="secondary" className="ml-2">
              {filteredDoctors.length} doctors
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialization</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Availability Status</TableHead>
                <TableHead>Working Hours</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDoctors.map((doctor) => (
                <TableRow key={doctor.id}>
                  <TableCell className="font-medium">{doctor.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{doctor.specialization}</Badge>
                  </TableCell>
                  <TableCell>{doctor.gender}</TableCell>
                  <TableCell>{doctor.location}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-2">
                      <Select
                        value={doctor.availabilityStatus || 'available'}
                        onValueChange={(value) => handleAvailabilityChange(doctor.id, value as 'available' | 'unavailable')}
                      >
                        <SelectTrigger className="w-[160px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="available">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              Available
                            </div>
                          </SelectItem>
                          <SelectItem value="unavailable">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-red-500" />
                              Unavailable
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {doctor.availabilityStatus === 'unavailable' && doctor.unavailabilityReason && (
                        <div className="flex items-start gap-1 text-xs text-muted-foreground">
                          <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{doctor.unavailabilityReason}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs space-y-1">
                      {doctor.workingHours
                        ?.filter(wh => wh.isWorking)
                        .map(wh => (
                          <div key={wh.day} className="flex justify-between">
                            <span className="font-medium">{wh.day.slice(0, 3)}:</span>
                            <span>{wh.startTime} - {wh.endTime}</span>
                          </div>
                        )) || "Not set"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEditDialog(doctor)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(doctor.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDoctors.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      {doctors.length === 0
                        ? "No doctors found. Add your first doctor to get started."
                        : "No doctors match your search criteria."}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Availability Dialog */}
      <Dialog open={availabilityDialogOpen} onOpenChange={setAvailabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Doctor as Unavailable</DialogTitle>
            <DialogDescription>
              Please provide a reason for marking {selectedDoctor?.name} as unavailable.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for Unavailability</Label>
              <Textarea
                id="reason"
                value={unavailabilityReason}
                onChange={(e) => setUnavailabilityReason(e.target.value)}
                placeholder="e.g., On leave, Medical emergency, Conference, etc."
                rows={4}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setAvailabilityDialogOpen(false)
                setSelectedDoctor(null)
                setUnavailabilityReason("")
              }}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleAvailabilitySubmit}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
