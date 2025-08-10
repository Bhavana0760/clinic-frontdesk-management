
# Clinic Front Desk System

A full-stack, monorepo-based Front Desk System for clinics, featuring:

- **Backend:** NestJS + TypeORM + MySQL + JWT
- **Frontend:** Next.js (App Router) + Tailwind CSS
- **Features:**
  - Secure login for front-desk staff
  - Doctor management (CRUD, filter by specialization/location)
  - Walk-in queue management (add, update status, mark urgent)
  - Appointments (book, reschedule, cancel, list, filter)
  - Responsive, modern UI

> **Note:** While Next.js supports several authentication patterns, this project uses custom JWT handling for demonstration, storing tokens in localStorage. For production, use httpOnly cookies and robust session management ([see Next.js docs][1][3]).


## Monorepo Structure

```
.
├── backend/   # NestJS API (REST, JWT, MySQL)
└── frontend/  # Next.js web app (App Router, Tailwind CSS)
```


## Prerequisites

- Node.js 18+
- MySQL 8.x (or compatible)


## Environment Setup

Copy the example environment files and fill in your values:

```sh
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

**Backend `.env`:**
```
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=clinic_front_desk
JWT_SECRET=supersecret_jwt_key_change_me
```

**Frontend `.env.local`:**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```


## Database Setup

1. **Create the database:**
  ```sh
  mysql -u root -p -e "CREATE DATABASE clinic_front_desk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
  ```

2. **Install backend dependencies, run migrations, and seed data:**
  ```sh
  cd backend
  npm install
  npm run migration:run
  npm run seed
  ```
  - Seed creates:
    - User: `frontdesk` / `password123`
    - Two doctors, two patients, two appointments


## Running the Application

### Backend
```sh
cd backend
npm run start:dev
# API available at http://localhost:4000
```

### Frontend
```sh
cd frontend
npm install
npm run dev
# App available at http://localhost:3000
```

**Login at `/login` with:**
```
frontdesk / password123
```


## API Overview

- **Auth**
  - `POST /auth/login` — `{ username, password }` → `{ accessToken, user }`
- **Doctors**
  - `GET /doctors?specialization=&location=&q=`
  - `POST /doctors`
  - `PUT /doctors/:id`
  - `DELETE /doctors/:id`
- **Appointments**
  - `GET /appointments?doctorId=&patientId=&date=YYYY-MM-DD`
  - `POST /appointments` — `{ doctorId, patientId (0=new), patientName?, startAt, endAt, status }`
  - `PUT /appointments/:id` — reschedule/change status
  - `DELETE /appointments/:id` — cancel (sets `status=canceled`)
- **Queue**
  - `GET /queue`
  - `POST /queue` — `{ patientName, patientPhone?, urgent? }`
  - `PATCH /queue/:id/status` — `{ status: waiting|with_doctor|completed|skipped }`
  - `PATCH /queue/:id/priority` — mark urgent

**Auth:** Provide `Authorization: Bearer <token>` on protected endpoints.


## Features & Important Logic

- **No Double-Booking:** Service checks for overlapping appointments for the same doctor before create/reschedule.
- **Queue Numbers:** Generated in a transaction per day; for high concurrency, consider a dedicated counter row with `SELECT ... FOR UPDATE`.
- **Timezones:** Store and send timestamps as ISO strings; clients should display in local time if needed.
- **Security:** JWT is stored in localStorage for simplicity. For production, use httpOnly cookies and robust session handling ([see Next.js docs][1][3]).
- **Frontend Auth:** Custom JWT handling (see `frontend/lib/auth.ts`). For production, consider using a library and secure cookies.


## Testing

- **Backend:** Add Jest tests in `backend/src/**/*.spec.ts` using Nest testing utilities.
- **Frontend:** Test with React Testing Library or Cypress.


## Deployment

- **Backend:** Deploy to Railway, Render, AWS, etc. Set env vars from `.env`.
- **Database:** Use PlanetScale, Railway, RDS, etc. Update `.env` accordingly.
- **Frontend:** Deploy to Vercel. Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL.
- **CORS:** Configure backend for your frontend domain.

[1]: https://nextjs.org/docs/app/guides/authentication
[3]: https://nextjs.org/docs/app/building-your-application/authentication
