import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { AppointmentsService } from '../../services/api/appointments.service';
import QuickActionBar from '../../components/dashboard/QuickActionBar';
import EnhancedAppointmentTable from '../../components/dashboard/EnhancedAppointmentTable';
import ContextualInfoPanel from '../../components/dashboard/ContextualInfoPanel';
import NewAppointmentModal from '../../components/modals/NewAppointmentModal';
import PatientRegistrationModal from '../../components/modals/PatientRegistrationModal';
import WalkInModal from '../../components/modals/WalkInModal';
import type { Appointment } from '../../types/api.types';
import toast from 'react-hot-toast';

const FrontdeskWorkbench: React.FC = () => {
    const queryClient = useQueryClient();
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [isNewAppointmentModalOpen, setIsNewAppointmentModalOpen] = useState(false);
    const [isPatientRegistrationModalOpen, setIsPatientRegistrationModalOpen] = useState(false);
    const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);

    // Fetch today's appointments
    const { data: appointmentsResponse, isLoading } = useQuery(
        'todayAppointments',
        () => AppointmentsService.getTodayAppointments()
    );

    const appointments = (appointmentsResponse as unknown as Appointment[]) || [];

    // Mutations
    const checkInMutation = useMutation(
        (id: number) => AppointmentsService.updateStatus(id, 'checked_in'),
        {
            onSuccess: () => {
                queryClient.invalidateQueries('todayAppointments');
                toast.success('Patient checked in successfully');
            },
            onError: () => {
                toast.error('Failed to check in patient');
            },
        }
    );

    const handleQuickCall = (phone: string) => {
        toast(`Initiating call to ${phone}...`, { icon: '📞' });
    };

    const handleViewPatientProfile = (id: number) => {
        toast(`Opening patient profile ${id}...`, { icon: '👤' });
    };

    return (
        <div className="p-6 h-full flex flex-col bg-gray-100 overflow-hidden">
            <div className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 font-serif italic">Operational Workbench</h1>
                    <p className="text-gray-500 text-sm">Efficiently manage today's patient workflow</p>
                </div>
                <div className="text-right hidden sm:block">
                    <p className="text-[10px] uppercase font-bold text-primary-600 tracking-widest leading-none">Status</p>
                    <p className="text-lg font-black text-gray-900">Frontdesk Active</p>
                </div>
            </div>

            {/* Quick Actions */}
            <QuickActionBar
                onNewAppointment={() => setIsNewAppointmentModalOpen(true)}
                onRegisterPatient={() => setIsPatientRegistrationModalOpen(true)}
                onSearchPatient={() => setIsNewAppointmentModalOpen(true)} // Open search step
                onQuickCheckIn={() => toast('Quick Check-In coming soon', { icon: '✅' })}
                onWalkIn={() => setIsWalkInModalOpen(true)}
            />

            <div className="flex flex-1 gap-6 overflow-hidden">
                {/* Main Content: Today's Appointments */}
                <div className="flex-[3] flex flex-col overflow-hidden">
                    <EnhancedAppointmentTable
                        appointments={appointments}
                        isLoading={isLoading}
                        onSelectAppointment={setSelectedAppointment}
                        selectedAppointmentId={selectedAppointment?.id}
                        onCheckIn={(id) => checkInMutation.mutate(id)}
                        onEdit={(id) => toast(`Editing appointment ${id}`, { icon: '📝' })}
                    />
                </div>

                {/* Dynamic Side Panel */}
                <div className="flex-1 min-w-[320px] max-w-[400px]">
                    <ContextualInfoPanel
                        appointment={selectedAppointment}
                        onQuickCall={handleQuickCall}
                        onViewDetails={handleViewPatientProfile}
                    />
                </div>
            </div>

            <NewAppointmentModal
                isOpen={isNewAppointmentModalOpen}
                onClose={() => setIsNewAppointmentModalOpen(false)}
                onOpenPatientRegistration={() => {
                    setIsNewAppointmentModalOpen(false);
                    setIsPatientRegistrationModalOpen(true);
                }}
            />

            <PatientRegistrationModal
                isOpen={isPatientRegistrationModalOpen}
                onClose={() => setIsPatientRegistrationModalOpen(false)}
                onSuccess={(patient) => {
                    toast.success(`Patient ${patient.name} registered`);
                }}
            />

            <WalkInModal
                isOpen={isWalkInModalOpen}
                onClose={() => setIsWalkInModalOpen(false)}
                onSuccess={() => {
                    queryClient.invalidateQueries('todayAppointments');
                    queryClient.invalidateQueries('queueAppointments');
                }}
            />
        </div>
    );
};

export default FrontdeskWorkbench;
