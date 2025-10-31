import { IsIn, IsOptional, IsString } from "class-validator"

export class UpdateAvailabilityDto {
  @IsIn(['available', 'unavailable'])
  availabilityStatus!: 'available' | 'unavailable'

  @IsOptional()
  @IsString()
  unavailabilityReason?: string
}
