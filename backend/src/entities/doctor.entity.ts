import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { Appointment } from "./appointment.entity"

@Entity({ name: "doctor" })
export class Doctor {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column()
  specialization!: string

  @Column()
  gender!: string

  @Column()
  location!: string

  @Column("simple-json", { nullable: true })
  availability?: { day: string; slots: string[] }[]

  @Column("simple-json", { nullable: true })
  workingHours?: { 
    day: string; 
    isWorking: boolean; 
    startTime: string; 
    endTime: string; 
  }[]

  @Column({ default: 'available' })
  availabilityStatus!: 'available' | 'unavailable'

  @Column({ type: 'text', nullable: true })
  unavailabilityReason?: string

  @OneToMany(
    () => Appointment,
    (a) => a.doctor,
  )
  appointments!: Appointment[]
}
