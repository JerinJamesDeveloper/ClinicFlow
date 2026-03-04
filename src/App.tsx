import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';

import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import ProtectedRoute from './components/layout/ProtectedRoute';

import Dashboard from './pages/Dashboard';
import FrontBenchLayout from './pages/frontbench/FrontBenchLayout';
import DoctorWorkbench from './pages/doctor/DoctorWorkbench';
import PatientVisit from './pages/doctor/PatientVisit';
import PatientSummary from './pages/doctor/PatientSummary';
import LabDashboard from './pages/lab/LabDashboard';
import TestResults from './pages/lab/TestResults';
import PharmacyDashboard from './pages/pharmacy/PharmacyDashboard';
import DispenseMedicine from './pages/pharmacy/DispenseMedicine';
import ClinicSettings from './pages/admin/ClinicSettings';
import UserManagement from './pages/admin/UserManagement';
import PreDoctorConsultation from './pages/nurse/PreDoctorConsultation';
import { AuthProvider } from './providers/AuthProvider';
import { ClinicProvider } from './providers/ClinicProvider';
import { useAuth } from './hooks/useAuth';

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
    <div className="min-h-screen bg-surface-50">
      <Sidebar />
      <div className="md:pl-72 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'doctor', 'lab_staff', 'pharmacist', 'front_desk', 'nurse']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nurse/pre-doctor"
              element={
                <ProtectedRoute allowedRoles={['admin', 'clinic_admin', 'nurse']}>
                  <PreDoctorConsultation />
                </ProtectedRoute>
              }
            />

            <Route
              path="/front-bench/*"
              element={
                <ProtectedRoute allowedRoles={['admin', 'front_desk']}>
                  <FrontBenchLayout />
                </ProtectedRoute>
              }
            />

            <Route
              path="/doctor/*"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'doctor']}>
                  <DoctorWorkbench />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/visit/:id"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'doctor']}>
                  <PatientVisit />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/patient/:id"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'doctor']}>
                  <PatientSummary />
                </ProtectedRoute>
              }
            />

            <Route
              path="/lab"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'lab_staff', 'doctor']}>
                  <LabDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/lab/results/:id"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'lab_staff']}>
                  <TestResults />
                </ProtectedRoute>
              }
            />

            <Route
              path="/pharmacy"
              element={
                <ProtectedRoute allowedRoles={['pharmacist', 'clinic_admin']}>
                  <PharmacyDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pharmacy/dispense"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'pharmacist']}>
                  <DispenseMedicine />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                  <ClinicSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                  <UserManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute allowedRoles={['clinic_admin', 'super_admin']}>
                  <ClinicSettings />
                </ProtectedRoute>
              }
            />

            <Route path="/unauthorized" element={<Unauthorized />} />
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
          <ClinicProvider>
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
