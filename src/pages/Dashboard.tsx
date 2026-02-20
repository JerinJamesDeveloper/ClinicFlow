// // src/pages/Dashboard.tsx
// import React from 'react';
// import { useQuery } from 'react-query';
// import {
//   UsersIcon,
//   CalendarIcon,
//   BeakerIcon,
//   DocumentTextIcon,
// } from '@heroicons/react/24/outline';
// import AppointmentChart from '../components/charts/AppointmentChart';
// import StatusBadge from '../components/common/StatusBadge';
// import { DashboardService } from '../services/api/dashboard.service';

// const Dashboard: React.FC = () => {
//   const { data: metrics, isLoading } = useQuery(
//     'dashboardMetrics',
//     () => DashboardService.getMetrics()
//   );

//   const stats = [
//     {
//       name: 'Total Patients',
//       value: metrics?.total_patients || 0,
//       icon: UsersIcon,
//       change: '+12%',
//       changeType: 'positive',
//     },
//     {
//       name: 'Today\'s Appointments',
//       value: metrics?.appointments_today || 0,
//       icon: CalendarIcon,
//       change: '+8%',
//       changeType: 'positive',
//     },
//     {
//       name: 'Pending Lab Tests',
//       value: metrics?.pending_lab_tests || 0,
//       icon: BeakerIcon,
//       change: '-3%',
//       changeType: 'negative',
//     },
//     {
//       name: 'Pending Prescriptions',
//       value: metrics?.pending_prescriptions || 0,
//       icon: DocumentTextIcon,
//       change: '+5%',
//       changeType: 'positive',
//     },
//   ];

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
//       </div>
//     );
//   }

//   return (
//     <div className="p-6">
//       <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

//       {/* Stats Grid */}
//       <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
//         {stats.map((stat) => (
//           <div
//             key={stat.name}
//             className="bg-white overflow-hidden shadow rounded-lg"
//           >
//             <div className="p-5">
//               <div className="flex items-center">
//                 <div className="flex-shrink-0">
//                   <stat.icon className="h-6 w-6 text-gray-400" />
//                 </div>
//                 <div className="ml-5 w-0 flex-1">
//                   <dl>
//                     <dt className="text-sm font-medium text-gray-500 truncate">
//                       {stat.name}
//                     </dt>
//                     <dd className="text-lg font-medium text-gray-900">
//                       {stat.value}
//                     </dd>
//                   </dl>
//                 </div>
//               </div>
//             </div>
//             <div className="bg-gray-50 px-5 py-3">
//               <div className="text-sm">
//                 <span
//                   className={
//                     stat.changeType === 'positive'
//                       ? 'text-green-600'
//                       : 'text-red-600'
//                   }
//                 >
//                   {stat.change}
//                 </span>{' '}
//                 <span className="text-gray-500">from last month</span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>

//       {/* Charts */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
//         <div className="bg-white rounded-lg shadow p-6">
//           <h2 className="text-lg font-medium mb-4">Appointments Overview</h2>
//           <AppointmentChart
//             data={metrics?.appointments_timeline || []}
//           />
//         </div>

//         <div className="bg-white rounded-lg shadow p-6">
//           <h2 className="text-lg font-medium mb-4">Popular Tests</h2>
//           <div className="space-y-4">
//             {metrics?.popular_tests?.map((test) => (
//               <div key={test.test_name}>
//                 <div className="flex justify-between text-sm mb-1">
//                   <span>{test.test_name}</span>
//                   <span className="font-medium">{test.count} tests</span>
//                 </div>
//                 <div className="w-full bg-gray-200 rounded-full h-2">
//                   <div
//                     className="bg-primary-600 h-2 rounded-full"
//                     style={{
//                       width: `${(test.count / 100) * 100}%`,
//                     }}
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>

//       {/* Recent Activity */}
//       <div className="bg-white rounded-lg shadow p-6">
//         <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
//         <div className="space-y-4">
//           {[1, 2, 3, 4, 5].map((i) => (
//             <div key={i} className="flex items-center justify-between py-2 border-b">
//               <div>
//                 <p className="text-sm font-medium">New appointment booked</p>
//                 <p className="text-xs text-gray-500">Patient: John Doe • 10 minutes ago</p>
//               </div>
//               <StatusBadge status="scheduled" variant="info" />
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Dashboard;


// src/pages/Dashboard.tsx
import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Role-specific dashboard components
import AdminDashboard from './admin/AdminDashboard';
import DoctorDashboard from './doctor/DoctorWorkbench';
import LabDashboard from './lab/LabDashboard';
import PharmacyDashboard from './pharmacy/PharmacyDashboard';
import PrescriptionManagement from './pharmacy/PrescriptionManagement';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // Define role-specific routes
  const roleRoutes = {
    doctor: (
      <Routes>
        <Route path="/" element={<DoctorDashboard />} />
        <Route path="/doctor/*" element={<DoctorDashboard />} />
      </Routes>
    ),
    lab_staff: (
      <Routes>
        <Route path="/" element={<LabDashboard />} />
        <Route path="/lab/*" element={<LabDashboard />} />
      </Routes>
    ),
    pharmacist: (
      <Routes>
        <Route path="/pharmacy/prescriptions" element={<PrescriptionManagement />} />
      </Routes>
    ),
    clinic_admin: (
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    ),
    super_admin: (
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    ),
  };

  return roleRoutes[user?.role as keyof typeof roleRoutes] || <Navigate to="/unauthorized" />;
};

export default Dashboard;