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
import { Badge } from "@/components/ui/badge"
import { Plus, Search, Edit, Trash2, UserCheck } from "lucide-react"
import { getTokenOrRedirect } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import type { Doctor } from "@/lib/types"

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
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

    // Log formData before submitting
    console.log('Submitting doctor formData:', formData);

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

      if (!response.ok) throw new Error("Failed to save doctor")

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
        description: "Failed to save doctor",
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

  const openEditDialog = (doctor: Doctor) => {
    setEditingDoctor(doctor)
    setFormData({
      name: doctor.name,
      specialization: doctor.specialization,
      gender: doctor.gender,
      location: doctor.location,
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
                  <TableCell colSpan={5} className="text-center py-8">
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
    </div>
  )
}
