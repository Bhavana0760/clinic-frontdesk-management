# Clinic Front Desk Backend

This is the backend service for the Clinic Front Desk application, built with [NestJS](https://nestjs.com/) and TypeORM. It provides RESTful APIs for managing appointments, doctors, patients, queues, and user authentication.

---

## Table of Contents
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [API Modules](#api-modules)
- [Database](#database)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Seeding Data](#seeding-data)
- [Migrations](#migrations)
- [Scripts](#scripts)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- **User Authentication**: JWT-based login and authorization
- **Doctor Management**: CRUD operations for doctors
- **Appointment Scheduling**: Book, update, and manage appointments
- **Queue Management**: Track and update patient queues
- **Role-based Access**: Secure endpoints for different user roles
- **Database Migrations & Seeding**: TypeORM migrations and seed scripts

---

## Tech Stack
- **Framework**: [NestJS](https://nestjs.com/)
- **ORM**: [TypeORM](https://typeorm.io/)
- **Database**: Configurable (PostgreSQL, MySQL, etc.)
- **Language**: TypeScript

---

## Project Structure
```
backend/
│   .env                  # Environment variables
│   nest-cli.json         # NestJS CLI config
│   package.json          # NPM dependencies and scripts
│   tsconfig.json         # TypeScript config
│   tsconfig.build.json   # TypeScript build config
│
└───src/
    │   app.module.ts         # Root module
    │   main.ts               # Entry point
    │   data-source.ts        # TypeORM data source config
    │   seed.ts               # Database seeding script
    │
    ├───appointments/        # Appointments module
    ├───auth/                # Authentication module
    ├───config/              # TypeORM config
    ├───doctors/             # Doctors module
    ├───entities/            # TypeORM entities
    ├───migrations/          # DB migrations
    ├───queue/               # Queue management module
    └───users/               # Users module
```

---

## API Modules

### 1. **Auth Module** (`src/auth/`)
- Handles user login and JWT authentication
- Contains DTOs for login
- Implements JWT strategy for securing endpoints

### 2. **Doctors Module** (`src/doctors/`)
- CRUD operations for doctor profiles
- DTOs for creating and updating doctors

### 3. **Appointments Module** (`src/appointments/`)
- Book, update, and manage appointments
- DTOs for appointment creation and updates

### 4. **Queue Module** (`src/queue/`)
- Manage patient queue entries
- Update queue status
- DTOs for queue entry creation and status updates

### 5. **Entities** (`src/entities/`)
- TypeORM entities for:
  - `Doctor`
  - `Patient`
  - `Appointment`
  - `QueueEntry`
  - `User`
  - `enums.ts` for shared enums

### 6. **Config** (`src/config/`)
- TypeORM configuration for database connection

### 7. **Users Module** (`src/users/`)
- User management (module only, logic may be in other modules)

---

## Database
- **TypeORM** is used for database interaction.
- Entities are defined in `src/entities/`.
- Migrations are in `src/migrations/`.
- Database connection is configured via `.env` and `src/config/typeorm.config.ts`.

---

## Environment Variables
Create a `.env` file in the `backend/` directory. Example:
```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=clinic_front_desk
JWT_SECRET=supersecret_jwt_key_change_me
```

---

## Running the Project

### 1. Install dependencies
```bash
cd backend
npm install
```

### 2. Set up environment variables
- Copy `.env.example` to `.env` and fill in your values (if `.env.example` exists)

### 3. Run database migrations
```bash
npm run typeorm migration:run
```

### 4. Seeding the data
```bash
npm run seed
```

### 5. Start the server
```bash
npm run start:dev
```

The server will start on the port specified in your `.env` or default NestJS port (usually 3000).

---

## Seeding Data
To seed the database with initial data:
```bash
npm run seed
```
This runs `src/seed.ts` to populate tables with sample data.

---

## Migrations
- Migrations are stored in `src/migrations/`.
- To generate a new migration:
  ```bash
  npm run typeorm migration:generate -- -n MigrationName
  ```
- To run migrations:
  ```bash
  npm run typeorm migration:run
  ```

---

## Scripts
Common scripts in `package.json`:
- `start:dev` - Start server in development mode
- `start:prod` - Start server in production mode
- `typeorm` - Run TypeORM CLI commands
- `seed` - Run the database seeder

---
