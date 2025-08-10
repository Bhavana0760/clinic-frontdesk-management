"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Plus, Users, Clock, AlertTriangle, CheckCircle, SkipForward } from "lucide-react"
import { getTokenOrRedirect } from "@/lib/auth"
import { useToast } from "@/components/ui/use-toast"
import { QueueStatusBadge } from "@/components/status-badges"
import type { QueueEntry } from "@/lib/types"

export default function QueuePage() {
  const [queue, setQueue] = useState<QueueEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [addForm, setAddForm] = useState({
    patientName: "",
    patientPhone: "",
    urgent: false,
  })

  const token = getTokenOrRedirect()
  const { toast } = useToast()

  useEffect(() => {
    fetchQueue()
  }, [token])

  const fetchQueue = async () => {
    if (!token) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/queue`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setQueue(data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch queue",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToQueue = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/queue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(addForm),
      })

      if (!response.ok) throw new Error("Failed to add to queue")

      const newEntry = await response.json()

      toast({
        title: "Added to Queue",
        description: `${addForm.patientName} assigned queue number ${newEntry.queueNumber}`,
      })

      setAddForm({ patientName: "", patientPhone: "", urgent: false })
      fetchQueue()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add patient to queue",
        variant: "destructive",
      })
    }
  }

  const updateStatus = async (id: number, status: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/queue/${id}/status`, {
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
        description: `Patient status changed to ${status.replace("_", " ")}`,
      })

      fetchQueue()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update patient status",
        variant: "destructive",
      })
    }
  }

  const markUrgent = async (id: number) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/queue/${id}/priority`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to mark as urgent")

      toast({
        title: "Marked as Urgent",
        description: "Patient has been prioritized in the queue",
      })

      fetchQueue()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark patient as urgent",
        variant: "destructive",
      })
    }
  }

  const queueStats = {
    total: queue.length,
    waiting: queue.filter((q) => q.status === "waiting").length,
    withDoctor: queue.filter((q) => q.status === "with_doctor").length,
    urgent: queue.filter((q) => q.urgent).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Queue Management</h1>
          <p className="text-muted-foreground">Manage walk-in patients and queue priorities</p>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total in Queue</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Waiting</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.waiting}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Doctor</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.withDoctor}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgent Cases</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{queueStats.urgent}</div>
          </CardContent>
        </Card>
      </div>

      {/* Add to Queue Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add Walk-in Patient
          </CardTitle>
          <CardDescription>Add a new patient to the queue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddToQueue} className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="patientName">Patient Name</Label>
              <Input
                id="patientName"
                value={addForm.patientName}
                onChange={(e) => setAddForm({ ...addForm, patientName: e.target.value })}
                placeholder="Enter patient name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientPhone">Phone Number</Label>
              <Input
                id="patientPhone"
                value={addForm.patientPhone}
                onChange={(e) => setAddForm({ ...addForm, patientPhone: e.target.value })}
                placeholder="Optional phone number"
              />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="urgent"
                  checked={addForm.urgent}
                  onChange={(e) => setAddForm({ ...addForm, urgent: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="urgent" className="text-sm">
                  Mark as urgent
                </Label>
              </div>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Add to Queue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Current Queue
            <Badge variant="secondary" className="ml-2">
              {queue.length} patients
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Queue #</TableHead>
                <TableHead>Patient Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((entry) => (
                <TableRow key={entry.id} className={entry.urgent ? "bg-red-50" : ""}>
                  <TableCell className="font-bold text-lg">#{entry.queueNumber}</TableCell>
                  <TableCell className="font-medium">{entry.patientName}</TableCell>
                  <TableCell>{entry.patientPhone || "-"}</TableCell>
                  <TableCell>
                    <QueueStatusBadge status={entry.status} />
                  </TableCell>
                  <TableCell>
                    {entry.urgent && (
                      <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                        <AlertTriangle className="h-3 w-3" />
                        Urgent
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1 flex-wrap">
                      {entry.status === "waiting" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(entry.id, "with_doctor")}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {entry.status === "with_doctor" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(entry.id, "completed")}
                          className="text-green-600 hover:text-green-700"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(entry.status === "waiting" || entry.status === "with_doctor") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(entry.id, "skipped")}
                          className="text-orange-600 hover:text-orange-700"
                        >
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      )}
                      {!entry.urgent && entry.status === "waiting" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markUrgent(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {queue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="text-muted-foreground">
                      No patients in queue. Add walk-in patients to get started.
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
