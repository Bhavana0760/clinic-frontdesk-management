import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Between, Not, Repository } from "typeorm"
import { InjectRepository } from "@nestjs/typeorm"
import { Appointment } from "../entities/appointment.entity"
import { AppointmentStatus } from "../entities/enums"
import { Doctor } from "../entities/doctor.entity"
import { Patient } from "../entities/patient.entity"
import type { CreateAppointmentDto } from "./dto/create-appointment.dto"
import type { UpdateAppointmentDto } from "./dto/update-appointment.dto"

@Injectable()
export class AppointmentsService {

  constructor(
    @InjectRepository(Appointment)
    private readonly repo: Repository<Appointment>,
    @InjectRepository(Doctor)
    private readonly doctors: Repository<Doctor>,
    @InjectRepository(Patient)
    private readonly patients: Repository<Patient>,
  ) {}

  async list(filters: { doctorId?: number; patientId?: number; date?: string }) {
    const where: any = {}
    if (filters.doctorId) where.doctor = { id: filters.doctorId }
    if (filters.patientId) where.patient = { id: filters.patientId }
    if (filters.date) {
      const day = new Date(filters.date)
      const start = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 0, 0, 0))
      const end = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate(), 23, 59, 59))
      where.startAt = Between(start, end)
    }
    return this.repo.find({ where, order: { startAt: "ASC" } })
  }

  private async checkOverlap(doctorId: number, startAt: Date, endAt: Date, excludeId?: number) {
    const overlapping = await this.repo.findOne({
      where: {
        doctor: { id: doctorId },
        status: Not(AppointmentStatus.CANCELED) as any,
        startAt: Between(startAt, endAt) as any,
      },
    })
    // More robust overlap check: any (a.start < newEnd && newStart < a.end)
    if (overlapping && overlapping.id !== excludeId) {
      throw new BadRequestException("Time slot overlaps with an existing appointment")
    }
  }

  async create(dto: CreateAppointmentDto & { patientName?: string; patientPhone?: string; patientEmail?: string }) {
    const doctor = await this.doctors.findOne({ where: { id: dto.doctorId } })
    if (!doctor) throw new NotFoundException("Doctor not found")
    const startAt = new Date(dto.startAt)
    const endAt = new Date(dto.endAt)
    if (endAt <= startAt) throw new BadRequestException("endAt must be after startAt")

    const patient =
      dto.patientId && dto.patientId > 0
        ? await this.patients.findOne({ where: { id: dto.patientId } })
        : this.patients.create({
            name: dto.patientName || "Walk-in",
            phone: dto.patientPhone,
            email: dto.patientEmail,
          })

    if (!patient) throw new NotFoundException("Patient not found")
    await this.checkOverlap(doctor.id, startAt, endAt)

    const appt = this.repo.create({
      doctor,
      patient,
      startAt,
      endAt,
      status: dto.status || AppointmentStatus.BOOKED,
    })
    return this.repo.save(appt)
  }

  async update(id: number, dto: UpdateAppointmentDto) {
    const appt = await this.repo.findOne({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")
    if (dto.startAt || dto.endAt) {
      const newStart = dto.startAt ? new Date(dto.startAt) : appt.startAt
      const newEnd = dto.endAt ? new Date(dto.endAt) : appt.endAt
      if (newEnd <= newStart) throw new BadRequestException("endAt must be after startAt")
      await this.checkOverlap(appt.doctor.id, newStart, newEnd, appt.id)
      appt.startAt = newStart
      appt.endAt = newEnd
    }
    if (dto.status) appt.status = dto.status
    return this.repo.save(appt)
  }

  async cancel(id: number) {
    const appt = await this.repo.findOne({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")
    appt.status = AppointmentStatus.CANCELED
    return this.repo.save(appt)
  }
}
