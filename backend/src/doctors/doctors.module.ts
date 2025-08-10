import { Module } from "@nestjs/common"
import { TypeOrmModule } from "@nestjs/typeorm"
import { Doctor } from "../entities/doctor.entity"
import { DoctorsController } from "./doctors.controller"
import { DoctorsService } from "./doctors.service"

@Module({
  imports: [TypeOrmModule.forFeature([Doctor])],
  controllers: [DoctorsController],
  providers: [DoctorsService],
})
export class DoctorsModule {}
