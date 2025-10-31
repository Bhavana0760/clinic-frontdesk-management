import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "./entities/user.entity"
import { Doctor } from "./entities/doctor.entity"
import { Patient } from "./entities/patient.entity"
import { Appointment } from "./entities/appointment.entity"
import { AppointmentStatus } from "./entities/enums"
import { QueueEntry } from "./entities/queue-entry.entity"
import * as bcrypt from "bcrypt"

const AppDataSource = new DataSource({
  type: "mysql",
  socketPath: "/tmp/mysql.sock",
  username: "root",
  password: "1234", 
  database: "clinic_front_desk",
  entities: [User, Doctor, Patient, Appointment, QueueEntry],
  synchronize: false,
  logging: false,
})

async function run() {
  await AppDataSource.initialize()
  const userRepo = AppDataSource.getRepository(User)
  const doctorRepo = AppDataSource.getRepository(Doctor)
  const patientRepo = AppDataSource.getRepository(Patient)
  const apptRepo = AppDataSource.getRepository(Appointment)

  const existingUser = await userRepo.findOne({ where: { username: "frontdesk" } })
  if (!existingUser) {
    const hash = await bcrypt.hash("password123", 10)
    await userRepo.save(userRepo.create({ username: "frontdesk", passwordHash: hash, role: "frontdesk" }))
  }

  const dr1 = doctorRepo.create({
    name: "Dr. Alice Wang",
    specialization: "Cardiology",
    gender: "Female",
    location: "Clinic A",
    availabilityStatus: "available",
    availability: [
      { day: "Mon", slots: ["09:00", "10:00", "11:00"] },
      { day: "Tue", slots: ["13:00", "14:00"] },
    ],
    workingHours: [
      { day: "Monday", isWorking: true, startTime: "09:00", endTime: "17:00" },
      { day: "Tuesday", isWorking: true, startTime: "09:00", endTime: "17:00" },
      { day: "Wednesday", isWorking: true, startTime: "09:00", endTime: "17:00" },
      { day: "Thursday", isWorking: true, startTime: "09:00", endTime: "17:00" },
      { day: "Friday", isWorking: true, startTime: "09:00", endTime: "17:00" },
      { day: "Saturday", isWorking: false, startTime: "09:00", endTime: "17:00" },
      { day: "Sunday", isWorking: false, startTime: "09:00", endTime: "17:00" },
    ]
  })
  const dr2 = doctorRepo.create({
    name: "Dr. Bob Smith",
    specialization: "Dermatology",
    gender: "Male",
    location: "Clinic B",
    availabilityStatus: "available",
    availability: [{ day: "Wed", slots: ["09:30", "10:30"] }],
    workingHours: [
      { day: "Monday", isWorking: true, startTime: "10:00", endTime: "18:00" },
      { day: "Tuesday", isWorking: true, startTime: "10:00", endTime: "18:00" },
      { day: "Wednesday", isWorking: true, startTime: "10:00", endTime: "18:00" },
      { day: "Thursday", isWorking: true, startTime: "10:00", endTime: "18:00" },
      { day: "Friday", isWorking: true, startTime: "10:00", endTime: "18:00" },
      { day: "Saturday", isWorking: true, startTime: "10:00", endTime: "14:00" },
      { day: "Sunday", isWorking: false, startTime: "10:00", endTime: "18:00" },
    ]
  })
  await doctorRepo.save([dr1, dr2])

  const p1 = await patientRepo.save(
    patientRepo.create({ name: "John Doe", phone: "555-1000", email: "john@example.com" }),
  )
  const p2 = await patientRepo.save(
    patientRepo.create({ name: "Jane Roe", phone: "555-2000", email: "jane@example.com" }),
  )

  // Create appointments within doctors' working hours
  const today = new Date()
  
  // Appointment 1: Dr. Alice Wang (works 09:00-17:00) - 10:00 AM to 11:00 AM today
  const appt1Start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0, 0)
  const appt1End = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0)
  
  await apptRepo.save(
    apptRepo.create({
      doctor: dr1,
      patient: p1,
      startAt: appt1Start,
      endAt: appt1End,
      status: AppointmentStatus.BOOKED,
      urgent: false,
    }),
  )
  
  // Appointment 2: Dr. Bob Smith (works 10:00-18:00) - 2:00 PM to 3:00 PM today
  const appt2Start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0, 0)
  const appt2End = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0, 0)
  
  await apptRepo.save(
    apptRepo.create({
      doctor: dr2,
      patient: p2,
      startAt: appt2Start,
      endAt: appt2End,
      status: AppointmentStatus.BOOKED,
      urgent: false,
    }),
  )

  // eslint-disable-next-line no-console
  console.log("Seed complete. Users, doctors, patients, appointments created.")
  await AppDataSource.destroy()
}

run().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e)
  process.exit(1)
})
