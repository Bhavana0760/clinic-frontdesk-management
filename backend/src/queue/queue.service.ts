import { Injectable, NotFoundException } from "@nestjs/common"
import { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { QueueEntry } from "../entities/queue-entry.entity"
import { QueueStatus } from "../entities/enums"
import type { CreateQueueEntryDto } from "./dto/create-queue-entry.dto"

@Injectable()
export class QueueService {
  constructor(
    @InjectRepository(QueueEntry)
    private readonly repo: Repository<QueueEntry>,
  ) {}

  async list() {
    return this.repo.find({ order: { urgent: "DESC", queueNumber: "ASC" } })
  }

  async add(dto: any) {
    // Accepts CreateQueueEntryDto fields
    return this.repo.manager.transaction(async (manager) => {
      const today = new Date()
      const yyyy = today.getUTCFullYear()
      const mm = today.getUTCMonth()
      const dd = today.getUTCDate()
      const start = new Date(Date.UTC(yyyy, mm, dd, 0, 0, 0))
      const end = new Date(Date.UTC(yyyy, mm, dd, 23, 59, 59))

      // Get max queueNumber for today
      const result = await manager
        .createQueryBuilder(QueueEntry, "q")
        .select("MAX(q.queueNumber)", "max")
        .where("q.createdAt BETWEEN :start AND :end", { start, end })
        .getRawOne<{ max: number | null }>()

      const nextNumber = (result?.max || 0) + 1
      const entry = manager.create(QueueEntry, {
        patientName: dto.patientName,
        patientPhone: dto.patientPhone,
        urgent: !!dto.urgent,
        queueNumber: nextNumber,
        status: QueueStatus.WAITING,
      })
      return manager.save(entry)
    })
  }

  async updateStatus(id: number, status: QueueStatus | string) {
    const entry = await this.repo.findOne({ where: { id } })
    if (!entry) throw new NotFoundException("Queue entry not found")
    // Convert string status to QueueStatus enum if needed
    let newStatus: QueueStatus
    if (typeof status === "string") {
      // Accept both enum values and their string representations
      const statusKey = Object.keys(QueueStatus).find(
        (key) => QueueStatus[key as keyof typeof QueueStatus] === status || key === status
      )
      if (!statusKey) {
        throw new Error(`Invalid status value: ${status}`)
      }
      newStatus = QueueStatus[statusKey as keyof typeof QueueStatus]
    } else {
      newStatus = status
    }
    entry.status = newStatus
    return this.repo.save(entry)
  }

  async prioritize(id: number) {
    const entry = await this.repo.findOne({ where: { id } })
    if (!entry) throw new NotFoundException("Queue entry not found")
    entry.urgent = true
    return this.repo.save(entry)
  }
}
