import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Stethoscope, Users, Calendar, Clock } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center space-y-8">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <Stethoscope className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight">Clinic Front Desk</h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Streamline your clinic operations with our comprehensive front desk management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        <Card>
          <CardHeader className="text-center">
            <Users className="h-8 w-8 mx-auto text-primary" />
            <CardTitle>Queue Management</CardTitle>
            <CardDescription>Efficiently manage walk-in patients and queue priorities</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Calendar className="h-8 w-8 mx-auto text-primary" />
            <CardTitle>Appointments</CardTitle>
            <CardDescription>Book, reschedule, and manage patient appointments</CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="text-center">
            <Clock className="h-8 w-8 mx-auto text-primary" />
            <CardTitle>Doctor Schedules</CardTitle>
            <CardDescription>Manage doctor profiles and availability schedules</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>Get Started</CardTitle>
          <CardDescription>Please login to access the dashboard</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Button asChild size="lg" className="w-full">
            <Link href="/login">Login to Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
