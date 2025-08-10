import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { TypeOrmModule } from "@nestjs/typeorm"
import { typeOrmConfigAsync } from "./config/typeorm.config"
import { AuthModule } from "./auth/auth.module"
import { UsersModule } from "./users/users.module"
import { DoctorsModule } from "./doctors/doctors.module"
import { AppointmentsModule } from "./appointments/appointments.module"
import { QueueModule } from "./queue/queue.module"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    AuthModule,
    UsersModule,
    DoctorsModule,
    AppointmentsModule,
    QueueModule,
  ],
})
export class AppModule {}
