import { type MigrationInterface, type QueryRunner, Table, TableForeignKey, TableIndex } from "typeorm"

export class InitSchema1710000000000 implements MigrationInterface {
  name = "InitSchema1710000000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // user
    await queryRunner.createTable(
      new Table({
        name: "user",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "username", type: "varchar", isUnique: true },
          { name: "passwordHash", type: "varchar" },
          { name: "role", type: "varchar" },
        ],
      }),
    )

    // doctor
    await queryRunner.createTable(
      new Table({
        name: "doctor",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "name", type: "varchar" },
          { name: "specialization", type: "varchar" },
          { name: "gender", type: "varchar" },
          { name: "location", type: "varchar" },
          { name: "availability", type: "text", isNullable: true },
          { name: "workingHours", type: "text", isNullable: true },
          { name: "availabilityStatus", type: "varchar", default: "'available'" },
          { name: "unavailabilityReason", type: "text", isNullable: true },
        ],
      }),
    )

    // patient
    await queryRunner.createTable(
      new Table({
        name: "patient",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "name", type: "varchar" },
          { name: "phone", type: "varchar", isNullable: true },
          { name: "email", type: "varchar", isNullable: true },
        ],
      }),
    )

    // appointment
    await queryRunner.createTable(
      new Table({
        name: "appointment",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "patientId", type: "int" },
          { name: "doctorId", type: "int" },
          { name: "startAt", type: "datetime" },
          { name: "endAt", type: "datetime" },
          {
            name: "status",
            type: "enum",
            enum: ["booked", "completed", "canceled", "skipped", "with_doctor"],
            default: "'booked'",
          },
          { name: "urgent", type: "boolean", default: false },
          { name: "createdAt", type: "datetime", default: "CURRENT_TIMESTAMP" },
        ],
      }),
    )
    await queryRunner.createForeignKey(
      "appointment",
      new TableForeignKey({
        columnNames: ["patientId"],
        referencedTableName: "patient",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    )
    await queryRunner.createForeignKey(
      "appointment",
      new TableForeignKey({
        columnNames: ["doctorId"],
        referencedTableName: "doctor",
        referencedColumnNames: ["id"],
        onDelete: "CASCADE",
      }),
    )
    await queryRunner.createIndex(
      "appointment",
      new TableIndex({
        name: "IDX_APPT_DOC_TIME",
        columnNames: ["doctorId", "startAt"],
      }),
    )

    // queue_entry
    await queryRunner.createTable(
      new Table({
        name: "queue_entry",
        columns: [
          { name: "id", type: "int", isPrimary: true, isGenerated: true, generationStrategy: "increment" },
          { name: "queueNumber", type: "int" },
          { name: "patientName", type: "varchar" },
          { name: "patientPhone", type: "varchar", isNullable: true },
          {
            name: "status",
            type: "enum",
            enum: ["waiting", "with_doctor", "completed", "skipped"],
            default: "'waiting'",
          },
          { name: "linkedAppointmentId", type: "int", isNullable: true },
          { name: "createdAt", type: "datetime", default: "CURRENT_TIMESTAMP" },
          { name: "urgent", type: "boolean", default: false },
        ],
      }),
    )
    await queryRunner.createIndex(
      "queue_entry",
      new TableIndex({
        name: "IDX_QUEUE_CREATED_AT",
        columnNames: ["createdAt"],
      }),
    )
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("queue_entry")
    await queryRunner.dropIndex("appointment", "IDX_APPT_DOC_TIME")
    const apptFks = await queryRunner.getTable("appointment")
    if (apptFks) {
      for (const fk of apptFks.foreignKeys) {
        await queryRunner.dropForeignKey("appointment", fk)
      }
    }
    await queryRunner.dropTable("appointment")
    await queryRunner.dropTable("patient")
    await queryRunner.dropTable("doctor")
    await queryRunner.dropTable("user")
  }
}
