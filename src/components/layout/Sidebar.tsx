// src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { isDevAdmin } from '../../utils/roles';
import {
  HomeIcon,
  BeakerIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  ClipboardDocumentCheckIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'doctor', 'lab_staff', 'pharmacist', 'front_desk', 'nurse'] },
  { name: 'Pre-Doctor', href: '/nurse/pre-doctor', icon: ClipboardDocumentCheckIcon, roles: ['admin', 'clinic_admin', 'nurse', 'front_desk'] },
  { name: 'Front Bench', href: '/front-bench', icon: ClipboardDocumentListIcon, roles: ['admin', 'front_desk'] },
  { name: 'Doctor Workbench', href: '/doctor', icon: ClipboardDocumentListIcon, roles: [ 'doctor'] },
  { name: 'Lab Tests', href: '/lab', icon: BeakerIcon, roles: [ 'lab_staff', 'doctor'] },
  { name: 'Prescriptions', href: '/pharmacy', icon: DocumentTextIcon, roles: [ 'pharmacist'] },
  { name: 'Pharmacy', href: '/pharmacy/dispense', icon: ShoppingBagIcon, roles: [ 'pharmacist'] },
  { name: 'Admin', href: '/admin', icon: Cog6ToothIcon, roles: [ 'super_admin'] },
];

const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  const filteredNav = isDevAdmin(user)
    ? navigation
    : navigation.filter(item => item.roles.some(role => hasRole([role])));

  return (
    <aside className="hidden md:flex md:w-72 md:flex-col fixed inset-y-0 left-0 z-50">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-surface-50 to-surface-100" />
      
      {/* Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-500/10 to-accent-500/5 rounded-br-full blur-3xl" />
      <div className="absolute bottom-0 right-0 w-48 h-48 bg-primary-500/5 rounded-full blur-3xl" />
      
      {/* Content */}
      <div className="relative flex flex-col flex-1 pt-6 pb-4 overflow-y-auto">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 mb-8">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-lg shadow-primary-500/30">
            <HeartIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent">
              ClinicFlow
            </h1>
            <p className="text-xs text-surface-500">Healthcare Platform</p>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-6 mb-6 h-px bg-gradient-to-r from-transparent via-surface-200 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-4 space-y-1.5">
          {filteredNav.map((item, index) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25'
                    : 'text-surface-600 hover:bg-white hover:text-surface-900 hover:shadow-md hover:shadow-surface-200/50'
                }`
              }
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                      isActive ? '' : 'group-hover:scale-110'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="truncate">{item.name}</span>
                  
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="mt-auto px-4 pt-4">
          <div className="mx-4 p-4 rounded-xl bg-gradient-to-br from-surface-50 to-white border border-surface-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-surface-500 truncate">
                  {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Staff'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

