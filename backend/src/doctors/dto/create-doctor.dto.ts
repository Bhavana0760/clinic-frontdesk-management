import { IsOptional, IsString, IsIn, IsArray, ValidateNested } from "class-validator"
import { Type } from "class-transformer"

class WorkingHourDto {
  @IsString()
  day!: string

  @IsOptional()
  isWorking?: boolean

  @IsOptional()
  @IsString()
  startTime?: string

  @IsOptional()
  @IsString()
  endTime?: string
}

export class CreateDoctorDto {
  @IsString()
  name!: string

  @IsString()
  specialization!: string

  @IsString()
  gender!: string

  @IsString()
  location!: string

  @IsOptional()
  @IsArray()
  availability?: { day: string; slots: string[] }[]

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkingHourDto)
  workingHours?: WorkingHourDto[]

  @IsOptional()
  @IsIn(['available', 'unavailable'])
  availabilityStatus?: 'available' | 'unavailable'

  @IsOptional()
  @IsString()
  unavailabilityReason?: string
}
