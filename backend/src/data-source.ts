import "dotenv/config"
import "reflect-metadata"
import { DataSource } from "typeorm"
import { Appointment } from "./entities/appointment.entity"
import { Doctor } from "./entities/doctor.entity"
import { Patient } from "./entities/patient.entity"
import { QueueEntry } from "./entities/queue-entry.entity"
import { User } from "./entities/user.entity"
import mysql from "mysql2/promise"

const DB_NAME = process.env.DB_NAME || "clinic_front_desk"
const DB_USER = process.env.DB_USER || "root"
const DB_PASSWORD = process.env.DB_PASSWORD || ""
const SOCKET_PATH = "/tmp/mysql.sock"

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    user: DB_USER,
    password: DB_PASSWORD,
    socketPath: SOCKET_PATH,
  })
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`)
  await connection.end()
}

export const AppDataSourcePromise = (async () => {
  await ensureDatabaseExists()
  return new DataSource({
    type: "mysql",
    socketPath: SOCKET_PATH,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    entities: [User, Doctor, Patient, Appointment, QueueEntry],
    migrations: ["src/migrations/*.ts"],
    synchronize: false,
    logging: false,
  })
})()
