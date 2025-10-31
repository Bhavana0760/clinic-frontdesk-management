import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { Doctor } from "../entities/doctor.entity"
import type { CreateDoctorDto } from "./dto/create-doctor.dto"
import type { UpdateDoctorDto } from "./dto/update-doctor.dto"
import type { UpdateAvailabilityDto } from "./dto/update-availability.dto"

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private readonly repo: Repository<Doctor>
  ) {}

  async list(params: { specialization?: string; location?: string; q?: string }) {
    const where: any = {}
    if (params.specialization) where.specialization = { $ilike: `%${params.specialization}%` }
    if (params.location) where.location = { $ilike: `%${params.location}%` }
    if (params.q) where.name = { $ilike: `%${params.q}%` }
    return this.repo.find({ where, order: { name: "ASC" } })
  }

  private validateWorkingHours(workingHours?: any[]) {
    if (!workingHours) return // Optional field
    
    for (const wh of workingHours) {
      if (wh.isWorking) {
        if (!wh.startTime || !wh.endTime) {
          throw new BadRequestException(`Working hours must have both start and end times for ${wh.day}`)
        }
        
        // Validate time format (HH:MM)
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(wh.startTime) || !timeRegex.test(wh.endTime)) {
          throw new BadRequestException(`Invalid time format for ${wh.day}. Use HH:MM format`)
        }
        
        // Validate that end time is after start time
        const [startHour, startMin] = wh.startTime.split(':').map(Number)
        const [endHour, endMin] = wh.endTime.split(':').map(Number)
        const startMinutes = startHour * 60 + startMin
        const endMinutes = endHour * 60 + endMin
        
        if (endMinutes <= startMinutes) {
          throw new BadRequestException(`End time must be after start time for ${wh.day}`)
        }
      }
    }
  }

  async create(dto: any) {
    if (!dto?.specialization || dto.specialization.trim() === "") {
      throw new BadRequestException("Specialization is required and cannot be empty.");
    }
    
    // Validate working hours if provided
    if (dto.workingHours) {
      this.validateWorkingHours(dto.workingHours)
    }
    
    const doc = this.repo.create(dto)
    return this.repo.save(doc)
  }

  async update(id: number, dto: UpdateDoctorDto) {
    const doctor = await this.repo.findOne({ where: { id } })
    if (!doctor) throw new NotFoundException("Doctor not found")
    
    // Validate working hours if provided
    if (dto.workingHours) {
      this.validateWorkingHours(dto.workingHours)
    }
    
    Object.assign(doctor, dto)
    return this.repo.save(doctor)
  }

  async updateAvailability(id: number, dto: UpdateAvailabilityDto) {
    const doctor = await this.repo.findOne({ where: { id } })
    if (!doctor) throw new NotFoundException("Doctor not found")
    
    // Prepare update data
    const updateData: any = {
      availabilityStatus: dto.availabilityStatus,
    }
    
    // Set or clear unavailabilityReason based on status
    if (dto.availabilityStatus === 'unavailable') {
      updateData.unavailabilityReason = dto.unavailabilityReason
    } else {
      updateData.unavailabilityReason = null
    }
    
    // Use update query for direct database update
    await this.repo.update(id, updateData)
    
    // Return updated doctor
    return this.repo.findOne({ where: { id } })
  }

  async delete(id: number) {
    const doctor = await this.repo.findOne({ where: { id } })
    if (!doctor) throw new NotFoundException("Doctor not found")
    try {
      await this.repo.remove(doctor)
    } catch (e) {
      throw new BadRequestException("Cannot delete doctor with existing appointments")
    }
    return { success: true }
  }
}
