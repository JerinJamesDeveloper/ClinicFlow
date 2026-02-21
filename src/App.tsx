// // import { useState } from 'react'
// // import reactLogo from './assets/react.svg'
// // import viteLogo from '/vite.svg'
// // import './App.css'

// // function App() {
// //   const [count, setCount] = useState(0)

// //   return (
// //     <>
// //       <div>
// //         <a href="https://vite.dev" target="_blank">
// //           <img src={viteLogo} className="logo" alt="Vite logo" />
// //         </a>
// //         <a href="https://react.dev" target="_blank">
// //           <img src={reactLogo} className="logo react" alt="React logo" />
// //         </a>
// //       </div>
// //       <h1>Vite + React</h1>
// //       <div className="card">
// //         <button onClick={() => setCount((count) => count + 1)}>
// //           count is {count}
// //         </button>
// //         <p>
// //           Edit <code>src/App.tsx</code> and save to test HMR
// //         </p>
// //       </div>
// //       <p className="read-the-docs">
// //         Click on the Vite and React logos to learn more
// //       </p>
// //     </>
// //   )
// // }

// // export default App


// // src/App.tsx
// import React from 'react';
// import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// import { QueryClient, QueryClientProvider } from 'react-query';
// import { Toaster } from 'react-hot-toast';
// import { AuthProvider, useAuth } from './hooks/useAuth';

// // Layout
// import Sidebar from './components/layout/Sidebar';
// import Header from './components/layout/Header';
// import ProtectedRoute from './components/layout/ProtectedRoute';

// // Pages
// import Dashboard from './pages/Dashboard';
// import PatientList from './pages/patients/PatientList';
// import PatientDetails from './pages/patients/PatientDetails';
// import PatientBooking from './pages/patients/PatientBooking';
// import AppointmentCalendar from './pages/appointments/AppointmentCalendar';
// import AppointmentDetails from './pages/appointments/AppointmentDetails';
// import DoctorWorkbench from './pages/doctor/DoctorWorkbench';
// import PatientVisit from './pages/doctor/PatientVisit';
// import LabDashboard from './pages/lab/LabDashboard';
// import TestResults from './pages/lab/TestResults';
// import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
// import DispenseMedicine from './pages/pharmacy/DispenseMedicine';
// import ClinicSettings from './pages/admin/ClinicSettings';
// import UserManagement from './pages/admin/UserManagement';

// const queryClient = new QueryClient({
//   defaultOptions: {
//     queries: {
//       retry: 1,
//       refetchOnWindowFocus: false,
//     },
//   },
// });

// function AppContent() {
//   const { user, isLoading } = useAuth();

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center h-screen">
//         <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   if (!user) {
//     return (
//       <Routes>
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/register-clinic" element={<RegisterClinic />} />
//         <Route path="*" element={<Navigate to="/login" />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="flex h-screen bg-gray-100">
//       <Sidebar />
//       <div className="flex-1 flex flex-col overflow-hidden">
//         <Header />
//         <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
//           <Routes>
//             {/* Dashboard */}
//             <Route path="/" element={<Dashboard />} />

//             {/* Patient Routes */}
//             <Route path="/patients" element={<PatientList />} />
//             <Route path="/patients/:id" element={<PatientDetails />} />
//             <Route path="/patients/new" element={<PatientBooking />} />
//             <Route path="/patients/:id/book" element={<PatientBooking />} />

//             {/* Appointment Routes */}
//             <Route path="/appointments" element={<AppointmentCalendar />} />
//             <Route path="/appointments/:id" element={<AppointmentDetails />} />
//             <Route path="/appointments/book" element={<PatientBooking />} />

//             {/* Doctor Routes */}
//             <Route path="/doctor" element={<DoctorWorkbench />} />
//             <Route path="/doctor/visit/:id" element={<PatientVisit />} />

//             {/* Lab Routes */}
//             <Route path="/lab" element={<LabDashboard />} />
//             <Route path="/lab/results/:id" element={<TestResults />} />

//             {/* Pharmacy Routes */}
//             <Route path="/pharmacy" element={<PharmacyDashboard />} />
//             <Route path="/pharmacy/dispense" element={<DispenseMedicine />} />

//             {/* Admin Routes */}
//             <Route path="/admin/settings" element={<ClinicSettings />} />
//             <Route path="/admin/users" element={<UserManagement />} />

//             {/* Fallback */}
//             <Route path="*" element={<Navigate to="/" />} />
//           </Routes>
//         </main>
//       </div>
//     </div>
//   );
// }

// function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <BrowserRouter>
//         <AuthProvider>
//           <AppContent />
//           <Toaster position="top-right" />
//         </AuthProvider>
//       </BrowserRouter>
//     </QueryClientProvider>
//   );
// }

// export default App;

// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

// Layout
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import Dashboard from './pages/Dashboard';
import FrontdeskDashboard from './pages/frontdesk/FrontdeskDashboard';
import FrontdeskWorkbench from './pages/frontdesk/FrontdeskWorkbench';
import QueueControl from './pages/frontdesk/QueueControl';
import PatientList from './pages/patients/PatientList';
import PatientDetails from './pages/patients/PatientDetails';
import PatientBooking from './pages/patients/PatientBooking';
import AppointmentCalendar from './pages/appointments/AppointmentCalendar';
import AppointmentDetails from './pages/appointments/AppointmentDetails';
import DoctorWorkbench from './pages/doctor/DoctorWorkbench';
import PatientVisit from './pages/doctor/PatientVisit';
import LabDashboard from './pages/lab/LabDashboard';
import TestResults from './pages/lab/TestResults';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import DispenseMedicine from './pages/pharmacy/DispenseMedicine';
import ClinicSettings from './pages/admin/ClinicSettings';
import UserManagement from './pages/admin/UserManagement';
import { AuthProvider } from './providers/AuthProvider';
import { ClinicProvider } from './providers/ClinicProvider';
import { useAuth } from './hooks/useAuth';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterClinic from './pages/auth/RegisterClinic';
import ForgotPassword from './pages/auth/ForgotPassword';
import Unauthorized from './pages/Unauthorized';


function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-clinic" element={<RegisterClinic />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <Routes>
            {/* Dashboard */}
            <Route path="/" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'lab_staff', 'pharmacist', 'super_admin']}>
                <Dashboard />
              </ProtectedRoute>
            } />

            <Route path="/frontdesk" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                <FrontdeskDashboard />
              </ProtectedRoute>
            } />

            <Route path="/frontdesk/workbench" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                <FrontdeskWorkbench />
              </ProtectedRoute>
            } />

            <Route path="/frontdesk/queue" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                <QueueControl />
              </ProtectedRoute>
            } />


            {/* Patient Routes */}
            <Route path="/patients" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'super_admin']}>
                <PatientList />
              </ProtectedRoute>
            } />
            <Route path="/patients/:id" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'super_admin']}>
                <PatientDetails />
              </ProtectedRoute>
            } />
            <Route path="/patients/new" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'super_admin']}>
                <PatientBooking />
              </ProtectedRoute>
            } />
            <Route path="/patients/:id/book" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'super_admin']}>
                <PatientBooking />
              </ProtectedRoute>
            } />

            {/* Appointment Routes */}
            <Route path="/appointments" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'patient', 'super_admin']}>
                <AppointmentCalendar />
              </ProtectedRoute>
            } />
            <Route path="/appointments/:id" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'patient', 'super_admin']}>
                <AppointmentDetails />
              </ProtectedRoute>
            } />
            <Route path="/appointments/book" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'patient', 'super_admin']}>
                <PatientBooking />
              </ProtectedRoute>
            } />

            {/* Doctor Routes */}
            <Route path="/doctor" element={
              <ProtectedRoute allowedRoles={['doctor', 'super_admin']}>
                <DoctorWorkbench />
              </ProtectedRoute>
            } />
            <Route path="/doctor/visit/:id" element={
              <ProtectedRoute allowedRoles={['doctor', 'super_admin']}>
                <PatientVisit />
              </ProtectedRoute>
            } />

            {/* Lab Routes */}
            <Route path="/lab" element={
              <ProtectedRoute allowedRoles={['lab_staff', 'doctor', 'super_admin']}>
                <LabDashboard />
              </ProtectedRoute>
            } />
            <Route path="/lab/results/:id" element={
              <ProtectedRoute allowedRoles={['lab_staff', 'super_admin']}>
                <TestResults />
              </ProtectedRoute>
            } />

            {/* Pharmacy Routes */}
            <Route path="/pharmacy" element={
              <ProtectedRoute allowedRoles={['pharmacist', 'clinic_admin', 'super_admin']}>
                <PharmacyDashboard />
              </ProtectedRoute>
            } />
            <Route path="/pharmacy/dispense" element={
              <ProtectedRoute allowedRoles={['pharmacist', 'super_admin']}>
                <DispenseMedicine />
              </ProtectedRoute>
            } />

            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                <ClinicSettings />
              </ProtectedRoute>
            } />
            <Route path="/admin/users" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/admin/settings" element={
              <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                <ClinicSettings />
              </ProtectedRoute>
            } />

            {/* Unauthorized */}
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function App() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ClinicProvider> {/* ClinicProvider inside AuthProvider */}
            <AppContent />
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
              }}
            />
          </ClinicProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;