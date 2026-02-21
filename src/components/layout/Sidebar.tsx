import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  UsersIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  BeakerIcon,
  CircleStackIcon,
  ChartBarIcon,
  WrenchScrewdriverIcon,
  QueueListIcon,
  ClockIcon,
  DocumentTextIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  ClipboardDocumentListIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import clsx from 'clsx';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/', icon: HomeIcon, roles: ['admin', 'doctor', 'lab_staff', 'pharmacist', 'super_admin'] },
    { name: 'Frontdesk Dashboard', href: '/frontdesk', icon: ChartBarIcon, roles: ['clinic_admin', 'super_admin'] },
    { name: 'Frontdesk Workbench', href: '/frontdesk/workbench', icon: ClipboardDocumentCheckIcon, roles: ['clinic_admin', 'super_admin'] },
    { name: 'Queue Control', href: '/frontdesk/queue', icon: QueueListIcon, roles: ['clinic_admin', 'super_admin'] },
    { name: 'Patients', href: '/patients', icon: UsersIcon, roles: ['admin', 'doctor', 'clinic_admin', 'super_admin'] },
    { name: 'Appointments', href: '/appointments', icon: CalendarIcon, roles: ['admin', 'doctor', 'clinic_admin', 'super_admin'] },
    { name: 'Doctor Workbench', href: '/doctor', icon: ClipboardDocumentListIcon, roles: ['doctor', 'super_admin'] },
    { name: 'Inventory', href: '/inventory', icon: ShoppingBagIcon, roles: ['admin', 'pharmacist', 'super_admin'] },
    { name: 'Lab Management', href: '/lab', icon: BeakerIcon, roles: ['admin', 'lab_staff', 'super_admin'] },
    { name: 'Records', href: '/records', icon: DocumentTextIcon, roles: ['admin', 'doctor', 'super_admin'] },
    { name: 'Admin', href: '/admin', icon: WrenchScrewdriverIcon, roles: ['admin', 'super_admin'] },
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon, roles: ['admin', 'doctor', 'lab_staff', 'pharmacist', 'super_admin'] },
  ];

  const filteredNavigation = navigation.filter(
    (item) => !item.roles || item.roles.includes(user?.role as string)
  );

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-100 h-full shadow-sm">
      <div className="flex items-center h-16 px-6 border-b border-gray-50">
        <span className="text-xl font-black text-primary-950 tracking-tighter italic">CLINI<span className="text-primary-600">FLOW</span></span>
      </div>

      <div className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar">
        <nav className="space-y-1">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <NavLink
                key={item.name}
                to={item.href}
                className={clsx(
                  'group flex items-center px-4 py-3 text-sm font-bold rounded-2xl transition-all duration-200',
                  isActive
                    ? 'bg-primary-50 text-primary-950 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={clsx(
                    'mr-3 h-5 w-5 transition-colors',
                    isActive ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-gray-50">
        <div className="flex items-center px-4 py-3 bg-gray-50 rounded-2xl">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
              {user?.name?.charAt(0)}
            </div>
          </div>
          <div className="ml-3 min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900 truncate">{user?.name}</p>
            <p className="text-[10px] text-primary-600 font-bold uppercase tracking-widest truncate">{user?.role?.replace('_', ' ')}</p>
          </div>
          <button
            onClick={logout}
            className="ml-auto p-1 text-gray-400 hover:text-red-600 transition-colors"
          >
            <PowerIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;