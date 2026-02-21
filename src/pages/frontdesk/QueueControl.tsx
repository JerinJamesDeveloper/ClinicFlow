import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { AppointmentsService } from '../../services/api/appointments.service';
import {
    ClockIcon,
    UsersIcon,
    CheckBadgeIcon,
    ExclamationCircleIcon,
    HandRaisedIcon
} from '@heroicons/react/24/outline';
import { format, differenceInMinutes, isBefore } from 'date-fns';
import type { Appointment } from '../../types/api.types';
import StatusBadge from '../../components/common/StatusBadge';
import DoctorStatusBoard from '../../components/dashboard/DoctorStatusBoard';

const QueueControl: React.FC = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    // Update clock every minute
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const { data: appointmentsResponse, isLoading } = useQuery(
        'queueAppointments',
        () => AppointmentsService.getTodayAppointments()
    );

    const appointments = (appointmentsResponse as unknown as Appointment[]) || [];

    // Queue Analytics
    const waiting = appointments.filter(a => a.status === 'scheduled');
    const checkedIn = appointments.filter(a => a.status === 'checked_in');
    const inProgress = appointments.filter(a => a.status === 'in_progress');
    const late = appointments.filter(a => {
        const appTime = new Date(a.appointment_date);
        return a.status === 'scheduled' && isBefore(appTime, currentTime);
    });

    const stats = [
        { label: 'Waiting', value: waiting.length, icon: UsersIcon, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: 'Checked In', value: checkedIn.length, icon: CheckBadgeIcon, color: 'text-green-600', bg: 'bg-green-50' },
        { label: 'Late', value: late.length, icon: ExclamationCircleIcon, color: 'text-red-600', bg: 'bg-red-50' },
        { label: 'In Consultation', value: inProgress.length, icon: HandRaisedIcon, color: 'text-purple-600', bg: 'bg-purple-50' },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-full flex flex-col">
            {/* Header with Live Clock */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Queue Control Center</h1>
                    <p className="text-gray-500 text-sm italic">Real-time patient flow management</p>
                </div>

                <div className="bg-primary-950 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center space-x-6">
                    <div className="flex items-center space-x-2 border-r border-primary-800 pr-6">
                        <ClockIcon className="h-6 w-6 text-primary-400" />
                        <span className="text-3xl font-mono font-bold tracking-tighter">
                            {format(currentTime, 'HH:mm')}
                        </span>
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] text-primary-400 uppercase font-bold tracking-widest leading-none">Status</p>
                        <p className="text-sm font-bold text-green-400">Clinic Active</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
                {stats.map((stat, i) => (
                    <div key={i} className={`${stat.bg} ${stat.color} p-6 rounded-3xl flex items-center space-x-4 border border-white shadow-sm`}>
                        <div className="p-3 bg-white rounded-2xl shadow-sm">
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-[10px] uppercase font-bold tracking-wider opacity-70 leading-none mb-1">{stat.label}</p>
                            <p className="text-3xl font-black">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-1 gap-8 overflow-hidden">
                {/* Main Queue View */}
                <div className="flex-[2] flex flex-col space-y-6 overflow-hidden">
                    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 font-serif italic">Live Queue</h3>

                        <div className="overflow-auto flex-1 pr-2 custom-scrollbar">
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white z-10">
                                    <tr className="text-[10px] text-gray-400 uppercase tracking-widest border-b border-gray-50">
                                        <th className="pb-4 font-bold">Time</th>
                                        <th className="pb-4 font-bold">Patient</th>
                                        <th className="pb-4 font-bold">Doctor</th>
                                        <th className="pb-4 font-bold">Status</th>
                                        <th className="pb-4 font-bold text-right">Est. Wait</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {isLoading ? (
                                        <tr><td colSpan={5} className="py-10 text-center text-gray-400">Syncing live queue...</td></tr>
                                    ) : appointments.map((a) => {
                                        const scheduledTime = new Date(a.appointment_date);
                                        const waitTime = differenceInMinutes(currentTime, scheduledTime);
                                        const isLate = waitTime > 0 && a.status === 'scheduled';

                                        return (
                                            <tr key={a.id} className="group hover:bg-gray-50 transition-colors">
                                                <td className="py-4 font-mono text-sm font-bold text-gray-900">
                                                    {format(scheduledTime, 'hh:mm a')}
                                                </td>
                                                <td className="py-4">
                                                    <p className="font-bold text-gray-900 text-sm uppercase">{a.patient?.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-medium tracking-tight">
                                                        {a.type === 'walk_in' ? 'Walk-In Patient' : 'Online Booking'}
                                                    </p>
                                                </td>
                                                <td className="py-4">
                                                    <p className="text-sm italic font-medium text-gray-700">Dr. {a.doctor?.name}</p>
                                                </td>
                                                <td className="py-4">
                                                    <StatusBadge status={a.status} variant={isLate ? 'error' : undefined} />
                                                </td>
                                                <td className="py-4 text-right">
                                                    <span className={`${isLate ? 'text-red-500 text-xs font-bold' : 'text-gray-400 text-[10px]'}`}>
                                                        {isLate ? `${waitTime}m delay` : '--'}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Doctor Intelligence Board */}
                <div className="flex-1 space-y-6 overflow-hidden flex flex-col">
                    <DoctorStatusBoard />

                    <div className="bg-primary-900 rounded-3xl p-6 text-white shadow-xl">
                        <h3 className="text-sm font-bold mb-4 text-primary-300 uppercase tracking-widest">Efficiency Alerts</h3>
                        <div className="space-y-4">
                            <div className="bg-primary-800 p-4 rounded-2xl border border-primary-700">
                                <p className="text-xs text-primary-300 mb-1 font-bold">Dr. Sharma</p>
                                <p className="text-sm font-medium">Running <span className="text-red-400 font-bold">15m behind</span> schedule</p>
                            </div>
                            <div className="bg-primary-800 p-4 rounded-2xl border border-primary-700">
                                <p className="text-xs text-primary-300 mb-1 font-bold">Wait Time Alert</p>
                                <p className="text-sm font-medium">Average wait for General Clinic is increasing.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QueueControl;
