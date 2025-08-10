import { Body, Controller, Get, Param, Patch, Post, ValidationPipe } from "@nestjs/common"
import type { CreateQueueEntryDto } from "./dto/create-queue-entry.dto"
import { QueueService } from "./queue.service"
import { UpdateQueueStatusDto } from "./dto/update-queue-status.dto"

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
  updateStatus(
    @Param("id") id: string,
    @Body(new ValidationPipe({ transform: true, whitelist: true })) dto: UpdateQueueStatusDto,
    @Body() rawBody: any
  ) {
    console.log(`PATCH /queue/${id}/status called with status:`, dto.status)
    console.log('Full dto:', dto)
    console.log('Raw request body:', rawBody)
    if (!dto.status) {
      console.error('Status is undefined in request body:', dto, rawBody)
      throw new Error('Status is required')
    }
    return this.service.updateStatus(Number(id), dto.status)
  }

  @Patch(":id/priority")
  prioritize(@Param("id") id: string) {
    return this.service.prioritize(Number(id))
  }
}
