// src/components/layout/Header.tsx
import React, { useState, useRef, useEffect } from 'react';
import { BellIcon, MagnifyingGlassIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const notifications = [
    { id: 1, message: 'New lab result ready for Patient John', time: '5 minutes ago', unread: true },
    { id: 2, message: 'Appointment with Sarah in 30 minutes', time: '25 minutes ago', unread: true },
    { id: 3, message: 'Prescription ready for pickup', time: '1 hour ago', unread: false },
  ];

  return (
    <header className="sticky top-0 z-40 glass border-b border-surface-200/50 backdrop-blur-xl">
      <div className="px-6">
        <div className="flex justify-between h-16">
          {/* Search Section */}
          <div className="flex flex-1 items-center">
            <div className="flex-1 max-w-xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
                </div>
                <input
                  id="search"
                  name="search"
                  className="block w-full pl-11 pr-4 py-2.5 bg-surface-50/80 border border-surface-200 rounded-xl leading-5 text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 focus:bg-white transition-all duration-200"
                  placeholder="Search patients, appointments, records..."
                  type="search"
                />
                <div className="absolute inset-y-2 right-2 flex items-center">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs font-medium text-surface-400 bg-surface-100 rounded border border-surface-200">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 ml-4">
            {/* Settings */}
            <button
              type="button"
              className="p-2.5 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
            >
              <Cog6ToothIcon className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                className="p-2.5 rounded-xl text-surface-500 hover:text-surface-700 hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-xl border border-surface-100 overflow-hidden animate-slide-down">
                  <div className="p-4 border-b border-surface-100 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-surface-900">Notifications</h3>
                    <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                      Mark all as read
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 hover:bg-surface-50 border-b border-surface-50 cursor-pointer transition-colors ${
                          notification.unread ? 'bg-primary-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {notification.unread && (
                            <span className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                          )}
                          <div className={notification.unread ? '' : 'ml-5'}>
                            <p className="text-sm text-surface-900">{notification.message}</p>
                            <p className="text-xs text-surface-500 mt-1">{notification.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-surface-100 bg-surface-50">
                    <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="relative ml-2" ref={profileRef}>
              <button
                type="button"
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-surface-100 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-md shadow-primary-500/20">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-surface-900">{user?.name || 'User'}</p>
                  <p className="text-xs text-surface-500 capitalize">{user?.role?.replace('_', ' ') || 'Staff'}</p>
                </div>
                <ChevronDownIcon className="hidden md:block h-4 w-4 text-surface-400" />
              </button>

              {/* Profile Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-xl border border-surface-100 overflow-hidden animate-slide-down">
                  <div className="p-3 border-b border-surface-100">
                    <p className="text-sm font-medium text-surface-900">{user?.name}</p>
                    <p className="text-xs text-surface-500">{user?.email}</p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
