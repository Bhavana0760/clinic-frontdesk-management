import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common"
import type { CreateQueueEntryDto } from "./dto/create-queue-entry.dto"
import { QueueService } from "./queue.service"
import type { UpdateQueueStatusDto } from "./dto/update-queue-status.dto"

@Controller("queue")
export class QueueController {
  constructor(private readonly service: QueueService) {}

  @Get()
  list() {
    return this.service.list()
  }

  @Post()
  async add(@Body() body: any) {
    // Accepts CreateQueueEntryDto fields
    return this.service.add(body)
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body() dto: UpdateQueueStatusDto) {
    return this.service.updateStatus(Number(id), dto.status)
  }

  @Patch(":id/priority")
  prioritize(@Param("id") id: string) {
    return this.service.prioritize(Number(id))
  }
}
