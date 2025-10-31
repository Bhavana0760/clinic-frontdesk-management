import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { AppointmentStatus } from "./enums"
import { Patient } from "./patient.entity"
import { Doctor } from "./doctor.entity"

@Entity({ name: "appointment" })
export class Appointment {
  @PrimaryGeneratedColumn()
  id!: number

  @ManyToOne(() => Patient, { cascade: true, eager: true })
  patient!: Patient

  @ManyToOne(
    () => Doctor,
    (d) => d.appointments,
    { eager: true },
  )
  doctor!: Doctor

  @Column("datetime")
  startAt!: Date

  @Column("datetime")
  endAt!: Date

  @Column({ type: "enum", enum: AppointmentStatus, default: AppointmentStatus.BOOKED })
  status!: AppointmentStatus

  @Column({ default: false })
  urgent!: boolean

  @CreateDateColumn()
  createdAt!: Date
}
