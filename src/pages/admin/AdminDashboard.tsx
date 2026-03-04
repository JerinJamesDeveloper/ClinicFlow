// src/pages/admin/AdminDashboard.tsx
import React from 'react';
import { useQuery } from 'react-query';
import {
  UsersIcon,
  CalendarIcon,
  BeakerIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import AppointmentChart from '../../components/charts/AppointmentChart';
import StatusBadge from '../../components/common/StatusBadge';
import { DashboardService } from '../../services/api/dashboard.service';

const AdminDashboard: React.FC = () => {
  const { data: metrics, isLoading } = useQuery(
    'dashboardMetrics',
    () => DashboardService.getMetrics()
  );

  const stats = [
    {
      name: 'Total Patients',
      value: metrics?.total_patients || 0,
      icon: UsersIcon,
      change: '+12%',
      changeType: 'positive',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100/50',
    },
    {
      name: "Today's Appointments",
      value: metrics?.appointments_today || 0,
      icon: CalendarIcon,
      change: '+8%',
      changeType: 'positive',
      gradient: 'from-emerald-500 to-emerald-600',
      bgGradient: 'from-emerald-50 to-emerald-100/50',
    },
    {
      name: 'Pending Lab Tests',
      value: metrics?.pending_lab_tests || 0,
      icon: BeakerIcon,
      change: '-3%',
      changeType: 'negative',
      gradient: 'from-amber-500 to-amber-600',
      bgGradient: 'from-amber-50 to-amber-100/50',
    },
    {
      name: 'Pending Prescriptions',
      value: metrics?.pending_prescriptions || 0,
      icon: DocumentTextIcon,
      change: '+5%',
      changeType: 'positive',
      gradient: 'from-violet-500 to-violet-600',
      bgGradient: 'from-violet-50 to-violet-100/50',
    },
  ];

  const recentActivities = [
    { id: 1, type: 'appointment', message: 'New appointment booked for John Doe', time: '10 minutes ago', status: 'scheduled' },
    { id: 2, type: 'lab', message: 'Lab results ready for Sarah Smith', time: '25 minutes ago', status: 'completed' },
    { id: 3, type: 'prescription', message: 'Prescription ready for pickup - Michael Brown', time: '1 hour ago', status: 'ready' },
    { id: 4, type: 'patient', message: 'New patient registered - Emily Johnson', time: '2 hours ago', status: 'new' },
    { id: 5, type: 'appointment', message: 'Appointment cancelled by Patient ID #4521', time: '3 hours ago', status: 'cancelled' },
  ];

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full border-4 border-primary-100 border-t-primary-500 animate-spin" />
          <p className="mt-4 text-surface-500">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Welcome back! 👋</h1>
          <p className="page-subtitle">Here's what's happening at your clinic today.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn-secondary">
            <CalendarIcon className="w-4 h-4 mr-2" />
            Schedule View
          </button>
          <button className="btn-primary">
            <UsersIcon className="w-4 h-4 mr-2" />
            Add Patient
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <div
            key={stat.name}
            className="stat-card card-hover p-6 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.bgGradient}`}>
                <stat.icon className={`h-6 w-6 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`} />
              </div>
              <div className={`flex items-center gap-1 text-sm font-medium ${
                stat.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {stat.changeType === 'positive' ? (
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                ) : (
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                )}
                {stat.change}
              </div>
            </div>
            <div className="mt-4">
              <p className="text-3xl font-bold text-surface-900">{stat.value}</p>
              <p className="text-sm text-surface-500 mt-1">{stat.name}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Appointments Chart */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Appointments Overview</h2>
            <select className="text-sm border border-surface-200 rounded-lg px-3 py-1.5 text-surface-600 focus:outline-none focus:ring-2 focus:ring-primary-500">
              <option>Last 7 days</option>
              <option>Last 30 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
          <div className="h-64">
            <AppointmentChart data={metrics?.appointments_timeline || []} />
          </div>
        </div>

        {/* Popular Tests */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="section-title">Popular Lab Tests</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
          <div className="space-y-4">
            {metrics?.popular_tests?.map((test, index) => (
              <div key={test.test_name} className="animate-slide-up" style={{ animationDelay: `${index * 100}ms` }}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium text-surface-700">{test.test_name}</span>
                  <span className="text-surface-500">{test.count} tests</span>
                </div>
                <div className="w-full bg-surface-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
                    style={{
                      width: `${Math.min((test.count / 100) * 100, 100)}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!metrics?.popular_tests?.length && (
              <div className="text-center py-8 text-surface-500">
                <BeakerIcon className="h-12 w-12 mx-auto mb-3 text-surface-300" />
                <p>No test data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card overflow-hidden">
        <div className="p-6 border-b border-surface-100">
          <div className="flex items-center justify-between">
            <h2 className="section-title">Recent Activity</h2>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
              View all
            </button>
          </div>
        </div>
        <div className="divide-y divide-surface-50">
          {recentActivities.map((activity, index) => (
            <div
              key={activity.id}
              className="p-4 hover:bg-surface-50/50 transition-colors cursor-pointer animate-slide-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${
                  activity.status === 'scheduled' ? 'bg-blue-100 text-blue-600' :
                  activity.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                  activity.status === 'ready' ? 'bg-violet-100 text-violet-600' :
                  activity.status === 'new' ? 'bg-primary-100 text-primary-600' :
                  'bg-red-100 text-red-600'
                }`}>
                  <ClockIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-surface-900">{activity.message}</p>
                  <p className="text-xs text-surface-500 mt-1">{activity.time}</p>
                </div>
                <StatusBadge status={activity.status} variant={
                  activity.status === 'scheduled' ? 'info' :
                  activity.status === 'completed' ? 'success' :
                  activity.status === 'ready' ? 'default' :
                  activity.status === 'new' ? 'warning' :
                  'error'
                } />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
