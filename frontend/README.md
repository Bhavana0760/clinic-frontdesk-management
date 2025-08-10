
# Clinic Front Desk System - Frontend

A modern, production-ready frontend for the Clinic Front Desk System, built with Next.js 15, TypeScript, Tailwind CSS, and shadcn/ui. This project provides a seamless, responsive, and accessible interface for managing doctors, appointments, and patient queues in a clinical environment.


## ✨ Features

- **Modern UI**: Built with shadcn/ui and Tailwind CSS for a clean, consistent look
- **Responsive Design**: Fully optimized for desktop and mobile devices
- **Real-time Feedback**: Toast notifications for all user actions (success, error, info)
- **Intuitive Navigation**: App navigation with active state indicators and mobile support
- **Comprehensive Management**: Full CRUD for doctors, appointments, and queue
- **Type Safety**: All API responses and data structures are strongly typed with TypeScript
- **Authentication**: Secure JWT-based login and session management
- **Reusable Components**: Modular UI components for rapid development
- **Accessible**: Built with accessibility best practices using Radix UI primitives
- **Custom Hooks**: For mobile detection, toast notifications, and more
- **Theming**: Theme provider for easy dark/light mode support


## 🛠 Tech Stack

- **Next.js 15** – React framework with App Router (app directory)
- **TypeScript** – Type-safe development
- **Tailwind CSS** – Utility-first CSS framework
- **shadcn/ui** – High-quality React components (Radix UI based)
- **Lucide React** – Icon library
- **Radix UI** – Accessible component primitives
- **pnpm** – Fast, disk-efficient package manager (recommended)


## ⚡ Prerequisites

- Node.js 18 or later
- pnpm (recommended) or npm
- A running backend API (see backend README)


## 🚀 Installation & Setup

1. **Install dependencies:**
	```bash
	pnpm install
	# or
	npm install
	```

2. **Set up environment variables:**
	```bash
	cp .env .env.local
	```
	Edit `.env.local` and set:
	```
	NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
	```

3. **Start the development server:**
	```bash
	pnpm dev
	# or
	npm run dev
	```
	The app will be available at [http://localhost:3000](http://localhost:3000).


## 📁 Project Structure

```
frontend/
├── app/                # Next.js App Router pages
│   ├── appointments/   # Appointment management
│   ├── dashboard/      # Dashboard page
│   ├── doctors/        # Doctor management
│   ├── login/          # Authentication
│   ├── queue/          # Queue management
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Root page
├── components/         # Reusable components
│   ├── app-nav.tsx     # Navigation bar
│   ├── status-badges.tsx # Status indicators
│   ├── theme-provider.tsx # Theme context
│   └── ui/             # shadcn/ui components (accordion, button, dialog, etc.)
├── hooks/              # Custom React hooks
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/                # Utilities and types
│   ├── auth.ts         # Auth helpers
│   ├── types.ts        # TypeScript types
│   └── utils.ts        # General utilities
├── public/             # Static assets (images, logos)
├── styles/             # CSS files
│   └── globals.css
├── tailwind.config.ts  # Tailwind CSS config
├── next.config.mjs     # Next.js config
├── package.json
└── README.md
```

### Notable Files & Folders
- `components/ui/` – All shadcn/ui and custom UI components
- `lib/types.ts` – TypeScript interfaces for API and app data
- `hooks/` – Custom React hooks for state and utilities
- `app/` – All route segments and pages (Next.js App Router)


## 🧩 Key Features & Modules

### Dashboard
- Overview of current queue and appointments
- Quick stats and metrics (doctors on duty, patients waiting, etc.)
- Recent activity summary

### Doctor Management
- Add, edit, and delete doctors
- Search and filter by name, specialization, or location
- Specialization and location tracking

### Appointment Management
- Book new appointments (with validation)
- Reschedule or cancel appointments
- Conflict detection and prevention (no double-booking)
- View appointment history and upcoming slots

### Queue Management
- Add walk-in patients to the queue
- Update patient status (waiting, in consultation, completed, etc.)
- Priority/urgent case handling
- Real-time queue status and updates

### Authentication
- JWT-based authentication (login/logout)
- Secure token storage (browser localStorage)
- Automatic redirect on session expiry
- Protected routes for authenticated users only

### Notifications & Feedback
- Toast notifications for all user actions (success, error, info)
- Loading and error states for all forms and API calls

### Accessibility & UX
- Keyboard navigation and focus management
- ARIA attributes via Radix UI
- Responsive layouts for all screen sizes

### Theming
- Theme provider for easy dark/light mode support

### Type Safety
- All API responses and app data are typed using TypeScript interfaces in `lib/types.ts`


## ▶️ Usage

1. **Login:** Use the demo credentials `frontdesk` / `password123`
2. **Dashboard:** View overview and stats
3. **Queue:** Manage walk-in patients and their status
4. **Doctors:** Add/manage doctor profiles
5. **Appointments:** Schedule/manage appointments

> **Tip:** All actions provide instant feedback via toast notifications. Protected routes will redirect to login if not authenticated.


## 🛠️ Development

### Scripts

- `pnpm dev` / `npm run dev` – Start dev server
- `pnpm build` / `npm run build` – Build for production
- `pnpm start` / `npm run start` – Start production server
- `pnpm lint` / `npm run lint` – Run ESLint

### Adding New Components

This project uses shadcn/ui. To add a new component:
```bash
npx shadcn@latest add [component-name]
```

### Styling

- Tailwind CSS with custom design system
- Colors and spacing in `tailwind.config.ts` and `globals.css`
- Easily extendable for custom themes

### Linting & Formatting
- ESLint and Prettier are recommended for code quality and consistency

### Testing
- (Add your preferred testing setup here, e.g., Jest, React Testing Library)


## 🔗 API Integration

- All API calls use `fetch` with JWT authentication headers (see `lib/auth.ts`)
- Endpoints are configured via `NEXT_PUBLIC_API_BASE_URL` in `.env.local`
- API errors and validation issues are surfaced as toast notifications
- Loading states and optimistic UI updates provide user feedback
- All API responses are typed in `lib/types.ts` for safety and autocompletion

### Example API Call
```ts
import { getToken } from '../lib/auth';

async function fetchDoctors() {
	const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/doctors`, {
		headers: { Authorization: `Bearer ${getToken()}` },
	});
	if (!res.ok) throw new Error('Failed to fetch doctors');
	return res.json();
}
```


## 🚢 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Set the `NEXT_PUBLIC_API_BASE_URL` environment variable in Vercel dashboard
4. Deploy

### Other Platforms
1. Build the app:
	```bash
	pnpm build
	# or
	npm run build
	```
2. Start the production server:
	```bash
	pnpm start
	# or
	npm start
	```

### Static Assets
- Place images and logos in `public/` for direct serving

### Environment Variables
- All runtime config is managed via `.env.local` and Vercel dashboard


## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

---

## 🙏 Credits

- [shadcn/ui](https://ui.shadcn.com/)
- [Radix UI](https://www.radix-ui.com/)
- [Lucide Icons](https://lucide.dev/)
- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)

---
