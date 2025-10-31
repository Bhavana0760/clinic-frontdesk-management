export interface Doctor {
  id: number
  name: string
  specialization: string
  gender: string
  location: string
  availability?: { day: string; slots: string[] }[]
  workingHours?: { 
    day: string; 
    isWorking: boolean; 
    startTime: string; 
    endTime: string; 
  }[]
  availabilityStatus?: 'available' | 'unavailable'
  unavailabilityReason?: string
}

export interface Patient {
  id: number
  name: string
  phone?: string
  email?: string
}

export interface Appointment {
  id: number
  doctor: Doctor
  patient: Patient
  startAt: string
  endAt: string
  status: "booked" | "completed" | "canceled" | "skipped" | "with_doctor"
  urgent: boolean
  createdAt: string
}

export interface QueueEntry {
  id: number
  queueNumber: number
  patientName: string
  patientPhone?: string
  status: "waiting" | "with_doctor" | "completed" | "skipped"
  linkedAppointmentId?: number
  createdAt: string
  urgent: boolean
}

export interface User {
  id: number
  username: string
  role: string
}
