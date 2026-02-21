import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import Modal from '../common/Modal';
import { PatientsService } from '../../services/api/patients.service';
import { AdminService } from '../../services/api/admin.service';
import { AppointmentsService } from '../../services/api/appointments.service';
import {
    MagnifyingGlassIcon,
    UserCircleIcon,
    CheckCircleIcon,
    ChevronRightIcon,
    ChevronLeftIcon,
    UserPlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import type { Patient, User } from '../../types/api.types';

interface NewAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    onOpenPatientRegistration: () => void;
}

const NewAppointmentModal: React.FC<NewAppointmentModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
    onOpenPatientRegistration,
}) => {
    const queryClient = useQueryClient();
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [selectedDoctor, setSelectedDoctor] = useState<User | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    // Step 1: Search Patients
    const { data: patientsData, isLoading: isLoadingPatients } = useQuery(
        ['patientsSearch', searchTerm],
        () => PatientsService.getPatients(1, 5, searchTerm),
        { enabled: step === 1 && searchTerm.length > 2 }
    );

    // Step 2: Fetch Doctors
    const { data: doctorsData, isLoading: isLoadingDoctors } = useQuery(
        'doctorsList',
        () => AdminService.getUsers({ role: 'doctor' }),
        { enabled: step === 2 }
    );

    // Step 3: Fetch Available Slots
    const { data: slots, isLoading: isLoadingSlots } = useQuery(
        ['slots', selectedDoctor?.id, selectedDate],
        () => AppointmentsService.getAvailableSlots(selectedDoctor!.id, selectedDate),
        { enabled: step === 3 && !!selectedDoctor }
    );

    const bookAppointmentMutation = useMutation(
        () => AppointmentsService.createAppointment({
            patient_id: selectedPatient!.id,
            doctor_id: selectedDoctor!.id,
            appointment_date: `${selectedDate}T${selectedTime}:00`,
            type: 'in_person',
        }),
        {
            onSuccess: () => {
                toast.success('Appointment booked successfully');
                queryClient.invalidateQueries('todayAppointments');
                onSuccess?.();
                handleClose();
            },
            onError: () => {
                toast.error('Failed to book appointment');
            }
        }
    );

    const handleClose = () => {
        setStep(1);
        setSelectedPatient(null);
        setSelectedDoctor(null);
        setSelectedTime(null);
        setSearchTerm('');
        onClose();
    };

    const nextStep = () => setStep(prev => prev + 1);
    const prevStep = () => setStep(prev => prev - 1);

    const renderStepIndicator = () => (
        <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-all ${step >= i ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-400'
                        }`}>
                        {step > i ? '✓' : i}
                    </div>
                    {i < 4 && <div className={`w-12 h-0.5 mx-2 ${step > i ? 'bg-primary-600' : 'bg-gray-200'}`} />}
                </div>
            ))}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Book New Appointment" maxWidth="2xl">
            {renderStepIndicator()}

            {/* Step 1: Patient Search */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="relative">
                        <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-3" />
                        <input
                            type="text"
                            placeholder="Search by name or phone number..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2 min-h-[200px]">
                        {isLoadingPatients ? (
                            <p className="text-center text-gray-500 py-8">Searching...</p>
                        ) : patientsData?.items.map(p => (
                            <button
                                key={p.id}
                                onClick={() => {
                                    setSelectedPatient(p);
                                    nextStep();
                                }}
                                className="w-full text-left p-4 rounded-lg border border-gray-100 hover:bg-primary-50 hover:border-primary-200 transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center space-x-3">
                                    <UserCircleIcon className="h-10 w-10 text-gray-400 group-hover:text-primary-500" />
                                    <div>
                                        <p className="font-bold text-gray-900 uppercase">{p.name}</p>
                                        <p className="text-sm text-gray-500">{p.phone} • {p.age}y {p.gender}</p>
                                    </div>
                                </div>
                                <ChevronRightIcon className="h-5 w-5 text-gray-300" />
                            </button>
                        ))}
                        {searchTerm.length > 2 && patientsData?.items.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-gray-500 mb-4">No patients found matches "{searchTerm}"</p>
                                <button
                                    onClick={onOpenPatientRegistration}
                                    className="flex items-center mx-auto text-primary-600 font-bold hover:underline"
                                >
                                    <UserPlusIcon className="h-5 w-5 mr-1" />
                                    Register New Patient
                                </button>
                            </div>
                        )}
                        {searchTerm.length <= 2 && (
                            <p className="text-center text-gray-400 py-10">Type at least 3 characters to search</p>
                        )}
                    </div>
                </div>
            )}

            {/* Step 2: Doctor Selection */}
            {step === 2 && (
                <div className="space-y-4">
                    <h4 className="font-bold text-gray-700">Select Medical Practitioner</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {isLoadingDoctors ? (
                            <p className="col-span-2 text-center text-gray-500 py-10">Loading practitioners...</p>
                        ) : doctorsData?.items.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => {
                                    setSelectedDoctor(doc);
                                    nextStep();
                                }}
                                className={`text-left p-4 rounded-xl border transition-all ${selectedDoctor?.id === doc.id ? 'bg-primary-50 border-primary-500' : 'bg-white border-gray-100 hover:border-primary-200'
                                    }`}
                            >
                                <p className="font-bold text-gray-900 italic">Dr. {doc.name}</p>
                                <p className="text-xs text-primary-600 font-bold tracking-wider mt-1">{doc.specialization || 'General Physician'}</p>
                            </button>
                        ))}
                    </div>
                    <div className="pt-6 flex justify-between">
                        <button onClick={prevStep} className="text-gray-500 font-semibold flex items-center hover:text-gray-700">
                            <ChevronLeftIcon className="h-4 w-4 mr-1" /> Back
                        </button>
                    </div>
                </div>
            )}

            {/* Step 3: Date & Time Slot */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h4 className="font-bold text-gray-700">Selection Date & Available Slots</h4>
                        <input
                            type="date"
                            className="border-gray-300 rounded-lg text-sm"
                            value={selectedDate}
                            min={format(new Date(), 'yyyy-MM-dd')}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {isLoadingSlots ? (
                            <p className="col-span-4 text-center text-gray-500 py-10">Fetching slots...</p>
                        ) : slots?.map(slot => {
                            const time = format(new Date(slot), 'HH:mm');
                            return (
                                <button
                                    key={slot}
                                    onClick={() => setSelectedTime(time)}
                                    className={`py-2 px-1 text-xs font-bold rounded-lg border transition-all ${selectedTime === time ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-gray-200 hover:border-primary-300 text-gray-700'
                                        }`}
                                >
                                    {format(new Date(slot), 'hh:mm a')}
                                </button>
                            );
                        })}
                        {slots?.length === 0 && <p className="col-span-4 text-center text-red-500 py-10 italic">No slots available for this date.</p>}
                    </div>

                    <div className="pt-6 flex justify-between">
                        <button onClick={prevStep} className="text-gray-500 font-semibold flex items-center hover:text-gray-700">
                            <ChevronLeftIcon className="h-4 w-4 mr-1" /> Back
                        </button>
                        <button
                            disabled={!selectedTime}
                            onClick={nextStep}
                            className="bg-primary-600 text-white px-8 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-primary-700 transition-all shadow-sm"
                        >
                            Review Booking
                        </button>
                    </div>
                </div>
            )}

            {/* Step 4: Confirmation */}
            {step === 4 && (
                <div className="space-y-6">
                    <div className="bg-primary-50 p-6 rounded-2xl border border-primary-100 italic">
                        <h4 className="text-primary-800 font-bold mb-4 flex items-center">
                            <CheckCircleIcon className="h-5 w-5 mr-2" /> Booking Summary
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-500 mb-1">Patient</p>
                                <p className="font-bold text-gray-900 uppercase">{selectedPatient?.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Doctor</p>
                                <p className="font-bold text-gray-900">Dr. {selectedDoctor?.name}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Date</p>
                                <p className="font-bold text-gray-900">{format(new Date(selectedDate), 'PPPP')}</p>
                            </div>
                            <div>
                                <p className="text-gray-500 mb-1">Time</p>
                                <p className="font-bold text-gray-900">{selectedTime}</p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex justify-between space-x-4">
                        <button onClick={prevStep} className="flex-1 text-gray-500 font-bold py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50">
                            Go Back
                        </button>
                        <button
                            onClick={() => bookAppointmentMutation.mutate()}
                            disabled={bookAppointmentMutation.isLoading}
                            className="flex-[2] bg-primary-600 text-white py-3 px-4 rounded-xl font-bold hover:bg-primary-700 shadow-lg active:scale-[0.98] transition-all disabled:opacity-50"
                        >
                            {bookAppointmentMutation.isLoading ? 'Booking...' : 'Confirm Appointment'}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default NewAppointmentModal;
