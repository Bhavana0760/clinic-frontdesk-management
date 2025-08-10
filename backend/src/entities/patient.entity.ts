import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"

@Entity({ name: "patient" })
export class Patient {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ nullable: true })
  phone?: string

  @Column({ nullable: true })
  email?: string
}
