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
    // Get all non-canceled and non-skipped appointments for this doctor
    const existingAppointments = await this.repo.find({
      where: {
        doctor: { id: doctorId },
      },
      relations: ['doctor', 'patient'],
    })

    // Filter out canceled, skipped, and the appointment being updated
    const activeAppointments = existingAppointments.filter(appt => {
      if (excludeId && appt.id === excludeId) {
        return false // Skip the appointment being updated
      }
      // Only consider appointments that are not canceled or skipped
      return appt.status !== AppointmentStatus.CANCELED && appt.status !== AppointmentStatus.SKIPPED
    })

    // Check for any overlapping appointments
    // Two appointments overlap if: (a.start < newEnd && newStart < a.end)
    const overlapping = activeAppointments.find(appt => {
      const existingStart = new Date(appt.startAt).getTime()
      const existingEnd = new Date(appt.endAt).getTime()
      const newStart = startAt.getTime()
      const newEnd = endAt.getTime()
      
      // Check if there's any overlap
      return existingStart < newEnd && newStart < existingEnd
    })

    if (overlapping) {
      const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      }
      
      throw new BadRequestException(
        `This time slot overlaps with an existing appointment for Dr. ${overlapping.doctor.name} ` +
        `(${formatTime(overlapping.startAt)} - ${formatTime(overlapping.endAt)}) ` +
        `with patient ${overlapping.patient.name}`
      )
    }
  }

  private checkWorkingHours(doctor: Doctor, startAt: Date, endAt: Date) {
    if (!doctor.workingHours || doctor.workingHours.length === 0) {
      // If no working hours are set, allow all appointments (backward compatibility)
      return
    }

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const appointmentDay = dayNames[startAt.getDay()]
    
    const workingDay = doctor.workingHours.find(wh => wh.day === appointmentDay)
    
    if (!workingDay || !workingDay.isWorking) {
      const availableDays = doctor.workingHours
        .filter(wh => wh.isWorking)
        .map(wh => `${wh.day} (${wh.startTime} - ${wh.endTime})`)
        .join(', ')
      
      throw new BadRequestException(
        `Dr. ${doctor.name} is not available on ${appointmentDay}. Available days: ${availableDays || 'None set'}`
      )
    }

    // Convert appointment times to minutes for easier comparison
    const appointmentStart = startAt.getHours() * 60 + startAt.getMinutes()
    const appointmentEnd = endAt.getHours() * 60 + endAt.getMinutes()
    
    // Parse working hours
    const [workStartHour, workStartMin] = workingDay.startTime.split(':').map(Number)
    const [workEndHour, workEndMin] = workingDay.endTime.split(':').map(Number)
    const workingStart = workStartHour * 60 + workStartMin
    const workingEnd = workEndHour * 60 + workEndMin
    
    if (appointmentStart < workingStart || appointmentEnd > workingEnd) {
      const appointmentStartStr = String(startAt.getHours()).padStart(2, '0') + ':' + String(startAt.getMinutes()).padStart(2, '0')
      const appointmentEndStr = String(endAt.getHours()).padStart(2, '0') + ':' + String(endAt.getMinutes()).padStart(2, '0')
      
      throw new BadRequestException(
        `Appointment time (${appointmentStartStr} - ${appointmentEndStr}) is outside Dr. ${doctor.name}'s working hours (${workingDay.startTime} - ${workingDay.endTime}) on ${appointmentDay}`
      )
    }
  }

  async create(dto: CreateAppointmentDto & { patientName?: string; patientPhone?: string; patientEmail?: string }) {
    const doctor = await this.doctors.findOne({ where: { id: dto.doctorId } })
    if (!doctor) throw new NotFoundException("Doctor not found")
    const startAt = new Date(dto.startAt)
    const endAt = new Date(dto.endAt)
    if (endAt <= startAt) throw new BadRequestException("endAt must be after startAt")

    // Check if appointment is within doctor's working hours
    this.checkWorkingHours(doctor, startAt, endAt)

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
    const appt = await this.repo.findOne({ 
      where: { id },
      relations: ['doctor']
    })
    if (!appt) throw new NotFoundException("Appointment not found")
    if (dto.startAt || dto.endAt) {
      const newStart = dto.startAt ? new Date(dto.startAt) : appt.startAt
      const newEnd = dto.endAt ? new Date(dto.endAt) : appt.endAt
      if (newEnd <= newStart) throw new BadRequestException("endAt must be after startAt")
      
      // Check if the new times are within doctor's working hours
      this.checkWorkingHours(appt.doctor, newStart, newEnd)
      
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

  async updateStatus(id: number, status: AppointmentStatus) {
    const appt = await this.repo.findOne({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")
    appt.status = status
    return this.repo.save(appt)
  }

  async markAsUrgent(id: number) {
    const appt = await this.repo.findOne({ where: { id } })
    if (!appt) throw new NotFoundException("Appointment not found")
    appt.urgent = true
    return this.repo.save(appt)
  }
}
