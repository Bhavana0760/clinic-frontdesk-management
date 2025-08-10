import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { QueueEntry } from "../entities/queue-entry.entity"
import { QueueController } from "./queue.controller"
import { QueueService } from "./queue.service"

@Module({
  imports: [TypeOrmModule.forFeature([QueueEntry])],
  controllers: [QueueController],
  providers: [QueueService],
})
export class QueueModule {}
