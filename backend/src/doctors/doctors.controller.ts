import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, Patch } from "@nestjs/common"
import type { Request } from "express"
import { AuthGuard } from "@nestjs/passport"
import { DoctorsService } from "./doctors.service"
import type { CreateDoctorDto } from "./dto/create-doctor.dto"
import type { UpdateDoctorDto } from "./dto/update-doctor.dto"
import { UpdateAvailabilityDto } from "./dto/update-availability.dto"

@UseGuards(AuthGuard("jwt"))
@Controller("doctors")
export class DoctorsController {
  constructor(private readonly service: DoctorsService) {}

  @Post("/test-body")
  testBody(@Body() body: any) {
    console.log('TEST /doctors/test-body raw body:', JSON.stringify(body));
    return body;
  }

  @Get()
  list(specialization?: string, location?: string, q?: string) {
    return this.service.list({ specialization, location, q })
  }

  @Post()
  async create(@Body() body: any) {
    try {
      return await this.service.create(body);
    } catch (error) {
      console.error('Error creating doctor:', error);
      throw error;
    }
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() dto: any) {
    return this.service.update(Number(id), dto)
  }

  @Patch(":id/availability")
  updateAvailability(@Param("id") id: string, @Body() dto: UpdateAvailabilityDto) {
    return this.service.updateAvailability(Number(id), dto)
  }

  @Delete(":id")
  delete(@Param("id") id: string) {
    return this.service.delete(Number(id))
  }
}
