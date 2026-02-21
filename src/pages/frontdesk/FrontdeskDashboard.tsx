import React from 'react';
import { useQuery } from 'react-query';
import { DashboardService } from '../../services/api/dashboard.service';
import MetricCard from '../../components/dashboard/MetricCard';
import {
    UsersIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    ClockIcon,
    ArrowRightIcon,
    UserPlusIcon,
    CheckCircleIcon
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

const FrontdeskDashboard: React.FC = () => {
    const { data: metrics } = useQuery(
        ['dashboardMetrics', 'today'],
        () => DashboardService.getMetrics('today')
    );

    const { data: recentActivity, isLoading: isLoadingActivity } = useQuery(
        'recentActivity',
        () => DashboardService.getRecentActivity(5)
    );

    const stats = [
        {
            title: 'Total Patients',
            value: metrics?.total_patients || 0,
            icon: UsersIcon,
            trend: { value: 12, isUp: true },
            color: 'bg-blue-500',
            description: 'Total registered patients in clinic'
        },
        {
            title: 'Appointments Today',
            value: metrics?.appointments_today || 0,
            icon: CalendarIcon,
            trend: { value: 5, isUp: true },
            color: 'bg-purple-500',
            description: 'Scheduled for today'
        },
        {
            title: 'Completed Visits',
            value: metrics?.appointments_completed || 0,
            icon: CheckCircleIcon,
            trend: { value: 8, isUp: true },
            color: 'bg-green-500',
            description: 'Patients served today'
        },
        {
            title: 'Revenue Today',
            value: `₹${metrics?.revenue_today?.toLocaleString() || 0}`,
            icon: CurrencyDollarIcon,
            trend: { value: 15, isUp: true },
            color: 'bg-amber-500',
            description: 'Estimated consultation fees'
        }
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Frontdesk Dashboard</h1>
                    <p className="text-gray-500 text-sm">Patient info and clinic performance overview</p>
                </div>
                <Link
                    to="/frontdesk/workbench"
                    className="flex items-center space-x-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-primary-700 transition-all shadow-md active:scale-95"
                >
                    <span>Open Workbench</span>
                    <ArrowRightIcon className="h-5 w-5" />
                </Link>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <MetricCard key={idx} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CRM Style Recent Activity */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <ClockIcon className="h-5 w-5 mr-2 text-primary-500" />
                            Recent Patient Activity
                        </h3>

                        <div className="space-y-4">
                            {isLoadingActivity ? (
                                <p className="text-center text-gray-400 py-10">Loading activity...</p>
                            ) : recentActivity?.map((activity) => (
                                <div key={activity.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2 rounded-full ${activity.type === 'patient' ? 'bg-blue-100 text-blue-600' :
                                            activity.type === 'appointment' ? 'bg-purple-100 text-purple-600' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {activity.type === 'patient' ? <UserPlusIcon className="h-5 w-5" /> : <CalendarIcon className="h-5 w-5" />}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{activity.description}</p>
                                            <p className="text-xs text-gray-400">{activity.patient_name} • {format(new Date(activity.timestamp), 'hh:mm a')}</p>
                                        </div>
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md ${activity.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {activity.status || 'Success'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* CRM Quick Summary / Actions */}
                <div className="space-y-6">
                    <div className="bg-primary-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <h4 className="text-primary-200 font-bold text-xs uppercase tracking-widest mb-2">Pending CRM Tasks</h4>
                            <p className="text-2xl font-bold mb-4">{metrics?.pending_lab_tests || 0} Open Lab Follow-ups</p>
                            <button className="w-full bg-white text-primary-900 font-bold py-3 rounded-2xl hover:bg-primary-50 transition-all">
                                View Task List
                            </button>
                        </div>
                        <div className="absolute -bottom-6 -right-6 h-32 w-32 bg-primary-700 rounded-full blur-3xl opacity-50 group-hover:scale-125 transition-transform duration-700" />
                    </div>

                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-gray-900 font-bold mb-4">Clinic Efficiency</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Wait Time (Avg)</span>
                                    <span className="font-bold text-gray-900">14 min</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[70%]" />
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-500">Patient Satisfaction</span>
                                    <span className="font-bold text-gray-900">4.8/5.0</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                    <div className="h-full bg-blue-500 w-[95%]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FrontdeskDashboard;
