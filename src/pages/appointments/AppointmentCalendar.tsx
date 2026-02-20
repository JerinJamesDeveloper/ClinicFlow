// src/pages/appointments/AppointmentCalendar.tsx
import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { AppointmentsService } from '../../services/api/appointments.service';
import StatusBadge from '../../components/common/StatusBadge';
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';

const AppointmentCalendar: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [view, setView] = useState<'day' | 'week'>('day');

  // Fetch appointments for selected date
  const { data: appointments, isLoading } = useQuery(
    ['appointments', format(selectedDate, 'yyyy-MM-dd')],
    () => AppointmentsService.getAppointments({
      date_from: format(selectedDate, 'yyyy-MM-dd'),
      date_to: format(selectedDate, 'yyyy-MM-dd'),
    })
  );

  const weekDays = Array.from({ length: 7 }, (_, i) =>
    addDays(startOfWeek(selectedDate), i)
  );

  const timeSlots = Array.from({ length: 12 }, (_, i) => i + 8); // 8 AM to 8 PM

  const getAppointmentsForSlot = (time: number) => {
    return appointments?.items?.filter((apt: any) => {
      const aptHour = new Date(apt.appointment_date).getHours();
      return aptHour === time;
    }) || [];
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
          + New Appointment
        </button>
      </div>

      {/* Calendar Header */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex items-center justify-between border-b">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 border rounded hover:bg-gray-50"
            >
              Today
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, -1))}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                className="p-1 rounded hover:bg-gray-100"
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <h2 className="text-lg font-medium">
              {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setView('day')}
              className={`px-3 py-1 rounded ${
                view === 'day' ? 'bg-primary-600 text-white' : 'border hover:bg-gray-50'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-3 py-1 rounded ${
                view === 'week' ? 'bg-primary-600 text-white' : 'border hover:bg-gray-50'
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="p-4">
          {view === 'day' && (
            <div className="space-y-2">
              {timeSlots.map((hour) => {
                const slotAppointments = getAppointmentsForSlot(hour);
                return (
                  <div key={hour} className="flex">
                    <div className="w-20 text-sm text-gray-500">
                      {hour}:00
                    </div>
                    <div className="flex-1 min-h-[60px] border-l pl-4">
                      {slotAppointments.map((apt: any) => (
                        <div
                          key={apt.id}
                          className="bg-primary-50 p-2 rounded mb-2 cursor-pointer hover:bg-primary-100"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{apt.patient?.name}</p>
                              <p className="text-sm text-gray-600">Dr. {apt.doctor?.name}</p>
                            </div>
                            <StatusBadge status={apt.status} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {view === 'week' && (
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day) => (
                <div key={day.toISOString()} className="text-center">
                  <div className="font-medium">{format(day, 'EEE')}</div>
                  <div className="text-sm text-gray-500">{format(day, 'd')}</div>
                  <div className="mt-2 space-y-1">
                    {/* Add week view appointments */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Appointments List */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-medium mb-4">Upcoming Appointments</h2>
        <div className="space-y-3">
          {appointments?.items?.map((apt: any) => (
            <div key={apt.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-4">
                <CalendarIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{apt.patient?.name}</p>
                  <p className="text-sm text-gray-600">
                    {format(parseISO(apt.appointment_date), 'hh:mm a')} • Dr. {apt.doctor?.name}
                  </p>
                </div>
              </div>
              <StatusBadge status={apt.status} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppointmentCalendar;