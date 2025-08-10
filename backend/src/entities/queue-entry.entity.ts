import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm"
import { QueueStatus } from "./enums"

@Entity({ name: "queue_entry" })
export class QueueEntry {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  queueNumber!: number

  @Column()
  patientName!: string

  @Column({ nullable: true })
  patientPhone?: string

  @Column({ type: "enum", enum: QueueStatus, default: QueueStatus.WAITING })
  status!: QueueStatus

  @Column({ nullable: true })
  linkedAppointmentId?: number

  @CreateDateColumn()
  createdAt!: Date

  @Column({ default: false })
  urgent!: boolean
}
