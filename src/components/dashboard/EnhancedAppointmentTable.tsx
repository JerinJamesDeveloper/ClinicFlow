import React, { useMemo, useState } from 'react';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import {
    FunnelIcon,
    ArrowsUpDownIcon,
    PencilSquareIcon,
    CheckBadgeIcon
} from '@heroicons/react/24/outline';
import StatusBadge from '../common/StatusBadge';
import type { Appointment } from '../../types/api.types';

interface EnhancedAppointmentTableProps {
    appointments: Appointment[];
    isLoading: boolean;
    onSelectAppointment: (appointment: Appointment) => void;
    selectedAppointmentId?: number;
    onCheckIn: (id: number) => void;
    onEdit: (id: number) => void;
}

const EnhancedAppointmentTable: React.FC<EnhancedAppointmentTableProps> = ({
    appointments,
    isLoading,
    onSelectAppointment,
    selectedAppointmentId,
    onCheckIn,
    onEdit,
}) => {
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [doctorFilter, setDoctorFilter] = useState<string>('all');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const filteredAndSortedAppointments = useMemo(() => {
        let result = [...appointments];

        if (statusFilter !== 'all') {
            result = result.filter((a) => a.status === statusFilter);
        }

        if (doctorFilter !== 'all') {
            result = result.filter((a) => a.doctor?.name === doctorFilter);
        }

        result.sort((a, b) => {
            const dateA = new Date(a.appointment_date).getTime();
            const dateB = new Date(b.appointment_date).getTime();
            return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
        });

        return result;
    }, [appointments, statusFilter, doctorFilter, sortOrder]);

    const doctors = useMemo(() => {
        const docNames = new Set(appointments.map(a => a.doctor?.name).filter(Boolean));
        return Array.from(docNames);
    }, [appointments]);

    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                <p className="mt-4 text-gray-500">Loading today's appointments...</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex flex-wrap items-center justify-between gap-4">
                <h2 className="text-lg font-bold text-gray-800 flex items-center">
                    Today's Appointments
                    <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                        {filteredAndSortedAppointments.length}
                    </span>
                </h2>

                <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                        <FunnelIcon className="h-4 w-4 text-gray-400" />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="text-sm border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 py-1"
                        >
                            <option value="all">All Status</option>
                            <option value="scheduled">Booked</option>
                            <option value="checked_in">Checked-In</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>

                        <select
                            value={doctorFilter}
                            onChange={(e) => setDoctorFilter(e.target.value)}
                            className="text-sm border-gray-200 rounded-lg focus:ring-primary-500 focus:border-primary-500 py-1"
                        >
                            <option value="all">All Doctors</option>
                            {doctors.map(doc => (
                                <option key={doc} value={doc}>{doc}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="flex items-center space-x-1 text-sm text-gray-600 hover:text-primary-600 font-medium px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ArrowsUpDownIcon className="h-4 w-4" />
                        <span>Time</span>
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto flex-1">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 uppercase text-[10px] font-bold text-gray-500 tracking-wider sticky top-0">
                        <tr>
                            <th className="px-6 py-3 text-left">Time</th>
                            <th className="px-6 py-3 text-left">Patient</th>
                            <th className="px-6 py-3 text-left">Doctor</th>
                            <th className="px-6 py-3 text-left">Status</th>
                            <th className="px-6 py-3 text-left">Wait / Payment</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredAndSortedAppointments.map((apt) => {
                            const appTime = parseISO(apt.appointment_date);
                            const now = new Date();
                            const diff = differenceInMinutes(now, appTime);
                            const isLate = diff > 5 && apt.status === 'scheduled';

                            // Mock payment
                            const pStatuses = ['Paid', 'Pending', 'Insurance', 'Partial'] as const;
                            const pStatus = pStatuses[apt.id % 4];
                            const pVariants: Record<typeof pStatuses[number], 'success' | 'error' | 'info' | 'warning'> = {
                                Paid: 'success',
                                Pending: 'error',
                                Insurance: 'info',
                                Partial: 'warning'
                            };

                            return (
                                <tr
                                    key={apt.id}
                                    onClick={() => onSelectAppointment(apt)}
                                    className={`hover:bg-primary-50/30 cursor-pointer transition-colors ${selectedAppointmentId === apt.id ? 'bg-primary-50' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 italic">
                                        {format(appTime, 'hh:mm a')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-gray-900 uppercase">
                                            {apt.patient?.name}
                                        </div>
                                        <div className="text-[10px] text-gray-500 font-medium">{apt.patient?.phone}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 italic font-medium">
                                        Dr. {apt.doctor?.name}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <StatusBadge status={apt.status} variant={isLate ? 'error' : undefined} />
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col space-y-1">
                                            <StatusBadge status={pStatus} variant={pVariants[pStatus] as any} />
                                            {(apt.status === 'scheduled' || apt.status === 'checked_in') && (
                                                <span className={`text-[9px] font-bold ${isLate ? 'text-red-600' : 'text-green-600'}`}>
                                                    {diff > 0 ? `${diff}m delay` : 'On Time'}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onEdit(apt.id);
                                                }}
                                                className="p-1 hover:text-primary-600 transition-colors"
                                            >
                                                <PencilSquareIcon className="h-5 w-5" />
                                            </button>
                                            {apt.status === 'scheduled' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onCheckIn(apt.id);
                                                    }}
                                                    className="p-1 hover:text-emerald-600 transition-colors"
                                                >
                                                    <CheckBadgeIcon className="h-5 w-5" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {filteredAndSortedAppointments.length === 0 && (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                                    <div className="flex flex-col items-center">
                                        <span className="text-3xl mb-2">📅</span>
                                        <p>No appointments found for the selected filters.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default EnhancedAppointmentTable;
