import { IsString, Validate, ValidatorConstraint, ValidatorConstraintInterface, ValidationArguments } from "class-validator"
import { Expose } from "class-transformer"
import { QueueStatus } from "../../entities/enums"

@ValidatorConstraint({ name: "isQueueStatus", async: false })
class IsQueueStatusConstraint implements ValidatorConstraintInterface {
  validate(status: any, _args: ValidationArguments) {
    return Object.values(QueueStatus).includes(status)
  }
  defaultMessage(_args: ValidationArguments) {
    return "Status must be a valid queue status."
  }
}

export class UpdateQueueStatusDto {
  @IsString()
  @Validate(IsQueueStatusConstraint)
  @Expose()
  status!: string
}
