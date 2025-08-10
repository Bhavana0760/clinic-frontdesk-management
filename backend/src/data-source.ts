import "dotenv/config"
import "reflect-metadata"
import { DataSource } from "typeorm"
import { Appointment } from "./entities/appointment.entity"
import { Doctor } from "./entities/doctor.entity"
import { Patient } from "./entities/patient.entity"
import { QueueEntry } from "./entities/queue-entry.entity"
import { User } from "./entities/user.entity"

const AppDataSource = new DataSource({
  type: "mysql",
  socketPath: "/tmp/mysql.sock",
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "clinic_front_desk",
  entities: [User, Doctor, Patient, Appointment, QueueEntry],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
  logging: false,
})

export default AppDataSource
