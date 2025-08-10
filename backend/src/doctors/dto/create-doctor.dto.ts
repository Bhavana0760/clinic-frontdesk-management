import { IsOptional, IsString } from "class-validator"

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
  availability?: { day: string; slots: string[] }[]
}
