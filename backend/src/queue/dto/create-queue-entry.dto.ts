import { IsBoolean, IsOptional, IsString } from "class-validator"

export class CreateQueueEntryDto {
  @IsString()
  patientName!: string

  @IsOptional()
  @IsString()
  patientPhone?: string

  @IsOptional()
  @IsBoolean()
  urgent?: boolean
}
