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
    availability: [
      { day: "Mon", slots: ["09:00", "10:00", "11:00"] },
      { day: "Tue", slots: ["13:00", "14:00"] },
    ],
  })
  const dr2 = doctorRepo.create({
    name: "Dr. Bob Smith",
    specialization: "Dermatology",
    gender: "Male",
    location: "Clinic B",
    availability: [{ day: "Wed", slots: ["09:30", "10:30"] }],
  })
  await doctorRepo.save([dr1, dr2])

  const p1 = await patientRepo.save(
    patientRepo.create({ name: "John Doe", phone: "555-1000", email: "john@example.com" }),
  )
  const p2 = await patientRepo.save(
    patientRepo.create({ name: "Jane Roe", phone: "555-2000", email: "jane@example.com" }),
  )

  const now = new Date()
  const in30 = new Date(now.getTime() + 30 * 60000)
  await apptRepo.save(
    apptRepo.create({
      doctor: dr1,
      patient: p1,
      startAt: now,
      endAt: in30,
      status: AppointmentStatus.BOOKED,
    }),
  )
  await apptRepo.save(
    apptRepo.create({
      doctor: dr2,
      patient: p2,
      startAt: new Date(now.getTime() + 2 * 3600000),
      endAt: new Date(now.getTime() + 3 * 3600000),
      status: AppointmentStatus.BOOKED,
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
