import { ConfigModule, ConfigService } from "@nestjs/config"
import type { TypeOrmModuleAsyncOptions } from "@nestjs/typeorm"
import { DataSource, type DataSourceOptions } from "typeorm"
import { Appointment } from "../entities/appointment.entity"
import { Doctor } from "../entities/doctor.entity"
import { Patient } from "../entities/patient.entity"
import { QueueEntry } from "../entities/queue-entry.entity"
import { User } from "../entities/user.entity"

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  useFactory: async (config: ConfigService) => {
    const host = config.get<string>("DB_HOST") || "localhost"
    const isLocalhost = host === "localhost"
    
    return {
      type: "mysql",
      host: isLocalhost ? undefined : host,
      port: isLocalhost ? undefined : Number.parseInt(config.get<string>("DB_PORT") || "3306", 10),
      socketPath: isLocalhost ? "/tmp/mysql.sock" : undefined,
      username: config.get<string>("DB_USER"),
      password: config.get<string>("DB_PASSWORD"),
      database: config.get<string>("DB_NAME"),
      entities: [User, Doctor, Patient, Appointment, QueueEntry],
      synchronize: false,
      migrationsRun: false,
      logging: false,
    }
  },
  inject: [ConfigService],
}

export const dataSourceOptions = (config: NodeJS.ProcessEnv): DataSourceOptions => ({
  type: "mysql",
  host: config.DB_HOST,
  port: Number.parseInt(config.DB_PORT || "3306", 10),
  username: config.DB_USER,
  password: config.DB_PASSWORD,
  database: config.DB_NAME,
  entities: [User, Doctor, Patient, Appointment, QueueEntry],
  migrations: ["src/migrations/*.ts"],
  synchronize: false,
  logging: false,
})

export const AppDataSource = new DataSource(dataSourceOptions(process.env))
