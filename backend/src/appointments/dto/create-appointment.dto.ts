import { IsDateString, IsEnum, IsInt, Min } from "class-validator"
import { AppointmentStatus } from "../../entities/enums"

export class CreateAppointmentDto {
  @IsInt()
  @Min(1)
  doctorId!: number

  // patient payload simplified
  @IsInt()
  @Min(0)
  patientId!: number // pass 0 to create new patient with provided name?

  // For demo: require name if patientId=0; handled in service

  @IsDateString()
  startAt!: string

  @IsDateString()
  endAt!: string

  @IsEnum(AppointmentStatus)
  status!: AppointmentStatus
}
