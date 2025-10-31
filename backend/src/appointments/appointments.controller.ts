import { Controller, Get, Post, Put, Delete, Body, Param, Query, Patch } from "@nestjs/common"
import { AppointmentsService } from "./appointments.service"
import type { UpdateAppointmentDto } from "./dto/update-appointment.dto"
import { AppointmentStatus } from "../entities/enums"

@Controller("appointments")
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Get()
  list(@Query("doctorId") doctorId?: string, @Query("patientId") patientId?: string, @Query("date") date?: string) {
    return this.service.list({
      doctorId: doctorId ? Number(doctorId) : undefined,
      patientId: patientId ? Number(patientId) : undefined,
      date,
    })
  }

  @Post()
  create(@Body() dto: any) {
    // Accepts CreateAppointmentDto plus optional patientName/phone/email
    return this.service.create(dto)
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: UpdateAppointmentDto) {
    return this.service.update(Number(id), dto)
  }

  @Delete(":id")
  cancel(@Param("id") id: string) {
    return this.service.cancel(Number(id))
  }

  @Patch(":id/status")
  updateStatus(@Param("id") id: string, @Body("status") status: AppointmentStatus) {
    return this.service.updateStatus(Number(id), status)
  }

  @Patch(":id/priority")
  markAsUrgent(@Param("id") id: string) {
    return this.service.markAsUrgent(Number(id))
  }
}
