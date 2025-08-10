import { IsDateString, IsEnum, IsOptional } from "class-validator"
import { AppointmentStatus } from "../../entities/enums"

export class UpdateAppointmentDto {
  @IsOptional()
  @IsDateString()
  startAt?: string

  @IsOptional()
  @IsDateString()
  endAt?: string

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus
}
