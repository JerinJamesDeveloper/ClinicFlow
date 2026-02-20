// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  BeakerIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'doctor', 'lab_staff', 'pharmacist'] },
  { name: 'Patients', href: '/patients', icon: UsersIcon, roles: ['admin', 'doctor'] },
  { name: 'Appointments', href: '/appointments', icon: CalendarIcon, roles: ['admin', 'doctor'] },
  { name: 'Doctor Workbench', href: '/doctor', icon: ClipboardDocumentListIcon, roles: ['doctor'] },
  { name: 'Lab Tests', href: '/lab', icon: BeakerIcon, roles: ['admin', 'lab_staff', 'doctor'] },
  { name: 'Prescriptions', href: '/pharmacy', icon: DocumentTextIcon, roles: ['admin', 'pharmacist'] },
  { name: 'Pharmacy', href: '/pharmacy/dispense', icon: ShoppingBagIcon, roles: ['pharmacist'] },
  { name: 'Admin', href: '/admin', icon: Cog6ToothIcon, roles: ['clinic_admin', 'super_admin'] },
];

const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const filteredNav = navigation.filter(item =>
    item.roles.some(role => hasRole([role]))
  );

  return (
    <div className="hidden md:flex md:w-64 md:flex-col">
      <div className="flex flex-col flex-grow pt-5 bg-white overflow-y-auto border-r">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="text-xl font-bold text-primary-600">ClinicFlow</h1>
        </div>
        <div className="mt-5 flex-1 flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {filteredNav.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon
                  className="mr-3 h-6 w-6 flex-shrink-0"
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;