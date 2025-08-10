import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Appointment } from "../entities/appointment.entity"
import { Doctor } from "../entities/doctor.entity"
import { Patient } from "../entities/patient.entity"
import { AppointmentsController } from "./appointments.controller"
import { AppointmentsService } from "./appointments.service"

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Doctor, Patient])],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
