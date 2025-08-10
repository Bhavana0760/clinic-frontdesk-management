import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { Doctor } from "../entities/doctor.entity"
import type { CreateDoctorDto } from "./dto/create-doctor.dto"
import type { UpdateDoctorDto } from "./dto/update-doctor.dto"

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

  async create(dto: any) {
    console.log('DoctorsService.create received:', JSON.stringify(dto));
    console.log('dto.specialization:', dto?.specialization);
    console.log('typeof dto.specialization:', typeof dto?.specialization);
    if (!dto?.specialization || dto.specialization.trim() === "") {
      throw new BadRequestException("Specialization is required and cannot be empty.");
    }
    const doc = this.repo.create(dto)
    return this.repo.save(doc)
  }

  async update(id: number, dto: UpdateDoctorDto) {
    const doctor = await this.repo.findOne({ where: { id } })
    if (!doctor) throw new NotFoundException("Doctor not found")
    Object.assign(doctor, dto)
    return this.repo.save(doctor)
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
