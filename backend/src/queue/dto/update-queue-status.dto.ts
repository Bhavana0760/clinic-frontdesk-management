import { IsEnum } from "class-validator"
import { QueueStatus } from "../../entities/enums"

export class UpdateQueueStatusDto {
  @IsEnum(QueueStatus)
  status!: QueueStatus
}
