# ClinicFlow Web - Clinic Management System

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-blue" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.2-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-5.0-purple" alt="Vite">
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8" alt="Tailwind">
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License">
</p>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [User Roles](#user-roles)
- [Getting Started](#getting-started)
- [Configuration](#configuration)
- [API Integration](#api-integration)
- [Key Components](#key-components)
- [Customization](#customization)

---

## Overview

**ClinicFlow Web** is a comprehensive clinic management system designed to streamline healthcare operations. It provides a multi-role platform for managing patients, appointments, consultations, laboratory tests, and pharmacy operations all in one unified application.

The system supports various healthcare workflows including:
- Patient registration and history management
- Appointment scheduling and calendar management
- Doctor consultation with SOAP notes and e-prescriptions
- Laboratory test ordering and result tracking
- Pharmacy prescription management and dispensing
- Front desk operations (queue management, billing, insurance)
- Administrative controls and settings

---

## Features

### 👨‍⚕️ Doctor Module
- **Patient Consultation**: SOAP notes, ICD-10 coding, vital signs recording
- **E-Prescription**: Drug database search, interaction warnings, allergy alerts
- **Lab Orders**: Test panel presets, urgency levels, result tracking
- **Patient Summary**: Medical history, previous visits, prescriptions
- **Voice-to-Text**: Voice input for clinical notes
- **Template System**: Reusable SOAP note templates

### 🏥 Patient Management
- Patient registration and profile management
- Patient history and medical records
- Appointment booking and scheduling
- Patient search and filtering

### 📅 Appointments
- Calendar view with daily/weekly/monthly views
- Appointment status tracking
- Booking for new and follow-up visits
- Appointment details and history

### 🔬 Laboratory Module
- Lab test dashboard
- Test result entry and tracking
- Abnormal result highlighting
- Sample collection status

### 💊 Pharmacy Module
- Prescription management
- Medicine dispensing workflow
- Stock tracking (coming soon)
- Prescription printing

### 🖥️ Front Bench Module
- Queue Management
- Patient CRM
- Scheduling
- Billing
- Insurance/TPA Management
- Display Board
- Reports

### ⚙️ Admin Module
- Clinic Settings
- User Management
- Subscription Management
- Audit Logs

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Frontend Framework** | React 18.2 |
| **Language** | TypeScript 5.2 |
| **Build Tool** | Vite 5.0 |
| **Styling** | Tailwind CSS 3.4 |
| **Routing** | React Router DOM 6.20 |
| **State Management** | React Query 3.39 |
| **Forms** | React Hook Form 7.48 |
| **Validation** | Zod 3.22 |
| **HTTP Client** | Axios 1.6 |
| **Icons** | Heroicons React 2.0 |
| **UI Components** | Headless UI 1.7 |
| **Charts** | Recharts 2.10 |
| **Date Handling** | date-fns 2.30 |
| **Notifications** | React Hot Toast 2.4 |

---

## Project Structure

```
clinic-flow-web/
├── public/                     # Static assets
├── src/
│   ├── assets/                # Images, icons, etc.
│   ├── components/             # Reusable UI components
│   │   ├── charts/            # Chart components
│   │   ├── common/           # Common UI components
│   │   │   ├── DataTable.tsx
│   │   │   ├── Pagination.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── SearchInput.tsx
│   │   │   ├── StatusBadge.tsx
│   │   │   └── NotificationToast.tsx
│   │   └── layout/           # Layout components
│   │       ├── Header.tsx
│   │       ├── Sidebar.tsx
│   │       └── ProtectedRoute.tsx
│   ├── context/               # React Context providers
│   │   ├── AuthContext.ts
│   │   └── ClinicContext.ts
│   ├── hooks/                 # Custom React hooks
│   │   ├── useApi.ts
│   │   ├── useAuth.tsx
│   │   ├── useAppointments.ts
│   │   ├── usePatients.ts
│   │   ├── useClinic.ts
│   │   ├── useWebSocket.ts
│   │   ├── doctor/
│   │   │   └── useDoctorStore.ts
│   │   └── frontbench/
│   │       ├── useFrontBenchAdmin.ts
│   │       ├── useFrontBenchBilling.ts
│   │       ├── useFrontBenchComms.ts
│   │       ├── useFrontBenchInsurance.ts
│   │       ├── useFrontBenchPatients.ts
│   │       ├── useFrontBenchQueue.ts
│   │       └── useFrontBenchScheduling.ts
│   ├── pages/                 # Page components
│   │   ├── admin/            # Admin pages
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── ClinicSettings.tsx
│   │   │   └── UserManagement.tsx
│   │   ├── appointments/    # Appointment pages
│   │   │   ├── AppointmentCalendar.tsx
│   │   │   └── AppointmentDetails.tsx
│   │   ├── auth/            # Authentication pages
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterClinic.tsx
│   │   │   └── ForgotPassword.tsx
│   │   ├── doctor/          # Doctor pages
│   │   │   ├── DoctorWorkbench.tsx
│   │   │   ├── PatientVisit.tsx
│   │   │   └── PatientSummary.tsx
│   │   ├── frontbench/      # Front bench pages
│   │   │   ├── FrontBench.tsx
│   │   │   ├── FrontBenchHome.tsx
│   │   │   ├── FrontBenchLayout.tsx
│   │   │   ├── QueueManagement.tsx
│   │   │   ├── Scheduler.tsx
│   │   │   ├── PatientCRM.tsx
│   │   │   ├── Billing.tsx
│   │   │   ├── InsuranceTPA.tsx
│   │   │   ├── DisplayBoard.tsx
│   │   │   ├── Reports.tsx
│   │   │   └── Communications.tsx
│   │   ├── lab/             # Lab pages
│   │   │   ├── LabDashboard.tsx
│   │   │   └── TestResults.tsx
│   │   ├── patients/        # Patient pages
│   │   │   ├── PatientList.tsx
│   │   │   ├── PatientDetails.tsx
│   │   │   └── PatientBooking.tsx
│   │   └── pharmacy/        # Pharmacy pages
│   │       ├── PharmacyDashboard.tsx
│   │       ├── DispenseMedicine.tsx
│   │       └── PrescriptionManagement.tsx
│   ├── providers/           # Context providers
│   │   ├── AuthProvider.tsx
│   │   └── ClinicProvider.tsx
│   ├── services/            # API and business logic
│   │   ├── api/            # API services
│   │   │   ├── admin.service.ts
│   │   │   ├── appointments.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── client.ts
│   │   │   ├── dashboard.service.ts
│   │   │   ├── doctor.service.ts
│   │   │   ├── endpoints.ts
│   │   │   ├── lab.service.ts
│   │   │   ├── patients.service.ts
│   │   │   └── pharmacy.service.ts
│   │   ├── config/         # Configuration
│   │   │   └── environment.ts
│   │   ├── local/          # Local storage
│   │   │   ├── doctor.store.ts
│   │   │   └── frontbench.store.ts
│   │   ├── mock/           # Mock data
│   │   │   └── auth.mock.ts
│   │   └── websocket/      # WebSocket services
│   │       └── socket.service.ts
│   ├── types/               # TypeScript types
│   │   ├── api.types.ts
│   │   ├── clinic.types.ts
│   │   ├── doctor.types.ts
│   │   ├── error.types.ts
│   │   ├── frontbench.types.ts
│   │   └── index.ts
│   ├── utils/              # Utility functions
│   │   └── roles.ts
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `clinic_admin` | Clinic Administrator | Full access to all features, settings, user management |
| `super_admin` | Super Administrator | System-wide admin access |
| `doctor` | Doctor/Physician | Patient consultations, prescriptions, lab orders |
| `lab_staff` | Laboratory Staff | Lab test management, result entry |
| `pharmacist` | Pharmacist | Prescription dispensing, pharmacy management |
| `front_desk` | Front Desk Staff | Queue management, scheduling, billing, patient registration |
| `patient` | Patient | View own appointments and records (limited) |

### Role-Based Access Control

The application uses a protected route system to enforce role-based access:

```tsx
<ProtectedRoute allowedRoles={['clinic_admin', 'doctor']}>
  <DoctorWorkbench />
</ProtectedRoute>
```

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd clinic-flow-web
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Build for production**
   ```bash
   npm run build
   ```

5. **Preview production build**
   ```bash
   npm run preview
   ```

### Development Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=http://localhost:3000/api
VITE_WS_URL=ws://localhost:3000
```

### Tailwind Configuration

The project uses Tailwind CSS with custom configuration in `tailwind.config.js`:

- **Custom Colors**: Primary (blue), Accent (purple), Surface (gray)
- **Custom Shadows**: soft, card, card-hover, glow, inner-soft
- **Custom Animations**: fade-in, slide-up, slide-down, scale-in, etc.
- **Border Radius**: xl, 2xl, 3xl

### API Configuration

API endpoints are defined in `src/services/api/endpoints.ts`. Update the base URL in `src/services/config/environment.ts` to point to your backend API.

---

## API Integration

### Service Modules

| Service | Purpose |
|---------|---------|
| `auth.service.ts` | Authentication (login, register, forgot password) |
| `patients.service.ts` | Patient CRUD operations |
| `appointments.service.ts` | Appointment management |
| `doctor.service.ts` | Doctor-specific operations |
| `lab.service.ts` | Laboratory operations |
| `pharmacy.service.ts` | Pharmacy operations |
| `admin.service.ts` | Admin operations |
| `dashboard.service.ts` | Dashboard statistics |

### API Client

The axios client is configured in `src/services/api/client.ts` with:
- Base URL from environment
- Request/response interceptors
- Error handling
- Authentication token attachment

---

## Key Components

### Layout Components

- **Sidebar**: Navigation menu with role-based menu items
- **Header**: Top navigation with notifications, user menu
- **ProtectedRoute**: Route wrapper with role-based access control

### Common Components

- **DataTable**: Sortable, paginated data table with search
- **SearchBar/SearchInput**: Search functionality
- **StatusBadge**: Visual status indicators
- **Pagination**: Table pagination
- **NotificationToast**: Toast notifications

### Charts

- **AppointmentChart**: Appointment statistics visualization

---

## Customization

### Adding New Pages

1. Create the page component in `src/pages/<module>/`
2. Add route in `src/App.tsx`
3. Add navigation item in `Sidebar.tsx`

### Adding New API Services

1. Create service file in `src/services/api/`
2. Define endpoints in `src/services/api/endpoints.ts`
3. Export and use in components with React Query

### Styling

The project uses Tailwind CSS. Custom styles can be added in:
- `src/index.css` - Global styles
- `tailwind.config.js` - Tailwind configuration

### Extending Types

Add new types in `src/types/` files and export from `src/types/index.ts`.

---

## License

MIT License - See LICENSE file for details.

---

## Support

For support and questions, please contact the development team.

---

<p align="center">Built with ❤️ using React, TypeScript, and Tailwind CSS</p>

