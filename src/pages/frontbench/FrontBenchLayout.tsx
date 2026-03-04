import React from 'react';
import { NavLink, Routes, Route, Navigate } from 'react-router-dom';
import FrontBenchHome from './FrontBenchHome';
import PatientCRM from './PatientCRM';
import Scheduler from './Scheduler';
import QueueManagement from './QueueManagement';
import DisplayBoard from './DisplayBoard';
import Billing from './Billing';
import ReceiptPrint from './ReceiptPrint';
import Communications from './Communications';
import InsuranceTPA from './InsuranceTPA';
import DoctorsDepartments from './DoctorsDepartments';
import Reports from './Reports';

const tabs = [
  { name: 'Home', to: '/front-bench' },
  { name: 'Patients', to: '/front-bench/patients' },
  { name: 'Scheduling', to: '/front-bench/appointments' },
  { name: 'Queue', to: '/front-bench/queue' },
  { name: 'Billing', to: '/front-bench/billing' },
  { name: 'Comms', to: '/front-bench/comms' },
  { name: 'Insurance', to: '/front-bench/insurance' },
  { name: 'Doctors', to: '/front-bench/doctors' },
  { name: 'Reports', to: '/front-bench/reports' },
  { name: 'Display', to: '/front-bench/display' },
];

const FrontBenchLayout: React.FC = () => {
  return (
    <div className="h-full">
      <div className="bg-white border-b">
        <nav className="px-6 flex gap-2 overflow-x-auto">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/front-bench'}
              className={({ isActive }) =>
                `px-3 py-3 text-sm font-medium border-b-2 ${
                  isActive ? 'border-primary-600 text-primary-700' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`
              }
            >
              {t.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <Routes>
        <Route path="/" element={<FrontBenchHome />} />
        <Route path="/patients" element={<PatientCRM />} />
        <Route path="/appointments" element={<Scheduler />} />
        <Route path="/queue" element={<QueueManagement />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/billing/receipt/:id" element={<ReceiptPrint />} />
        <Route path="/comms" element={<Communications />} />
        <Route path="/insurance" element={<InsuranceTPA />} />
        <Route path="/doctors" element={<DoctorsDepartments />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/display" element={<DisplayBoard />} />
        <Route path="*" element={<Navigate to="/front-bench" replace />} />
      </Routes>
    </div>
  );
};

export default FrontBenchLayout;
