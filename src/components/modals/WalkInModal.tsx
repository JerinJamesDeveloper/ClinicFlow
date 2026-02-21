import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useQueryClient } from 'react-query';
import Modal from '../common/Modal';
import { PatientsService } from '../../services/api/patients.service';
import { AdminService } from '../../services/api/admin.service';
import { AppointmentsService } from '../../services/api/appointments.service';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { UserIcon, PhoneIcon, UserCircleIcon, BoltIcon } from '@heroicons/react/24/outline';

const walkInSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    phone: z.string().min(10, 'Valid phone required'),
    age: z.number().min(0).max(150),
    gender: z.enum(['male', 'female', 'other']),
    doctor_id: z.number().min(1, 'Please select a doctor'),
});

type WalkInFormData = z.infer<typeof walkInSchema>;

interface WalkInModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const WalkInModal: React.FC<WalkInModalProps> = ({ isOpen, onClose, onSuccess }) => {
    const queryClient = useQueryClient();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<WalkInFormData>({
        resolver: zodResolver(walkInSchema),
        defaultValues: { gender: 'male' }
    });

    const { data: doctorsData } = useQuery('doctorsList', () => AdminService.getUsers({ role: 'doctor' }));

    const handleWalkIn = async (data: WalkInFormData) => {
        setIsSubmitting(true);
        try {
            // 1. Register Patient (Minimal)
            const patient = await PatientsService.createPatient({
                name: data.name,
                phone: data.phone,
                age: data.age,
                gender: data.gender,
            });

            // 2. Book Appointment Instantly
            // Marking it as current time + 5 mins (ASAP)
            const now = new Date();
            const appointmentDate = format(now, "yyyy-MM-dd'T'HH:mm:ss");

            await AppointmentsService.createAppointment({
                patient_id: patient.id,
                doctor_id: data.doctor_id,
                appointment_date: appointmentDate,
                type: 'in_person',
                notes: 'Walk-In Patient',
            });

            toast.success('Walk-in patient registered and booked');
            queryClient.invalidateQueries('todayAppointments');
            queryClient.invalidateQueries('queueAppointments');
            onSuccess?.();
            reset();
            onClose();
        } catch (error) {
            toast.error('Failed to process walk-in');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Hospital Walk-In Entry" maxWidth="xl">
            <div className="mb-6 bg-primary-50 p-4 rounded-2xl border border-primary-100 flex items-start space-x-3">
                <BoltIcon className="h-6 w-6 text-primary-600 mt-1" />
                <div>
                    <p className="text-primary-900 font-bold text-sm italic underline">Accelerated Admission Flow</p>
                    <p className="text-primary-700 text-xs">This flow registers the patient and assigns a doctor instantly. Use for on-site arrivals only.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(handleWalkIn)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Patient Full Name *</label>
                        <div className="relative">
                            <UserIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                            <input
                                {...register('name')}
                                placeholder="Enter name"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all uppercase"
                            />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Contact Number *</label>
                        <div className="relative">
                            <PhoneIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
                            <input
                                {...register('phone')}
                                placeholder="9876543210"
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all"
                            />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Age *</label>
                            <input
                                type="number"
                                {...register('age', { valueAsNumber: true })}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1">Gender *</label>
                            <select
                                {...register('gender')}
                                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 bg-gray-50 focus:bg-white transition-all"
                            >
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Assign Doctor Instantly *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {doctorsData?.items.map((doc) => (
                                <label key={doc.id} className="relative flex cursor-pointer p-4 rounded-xl border border-gray-200 hover:border-primary-500 transition-all group has-[:checked]:border-primary-600 has-[:checked]:bg-primary-50">
                                    <input
                                        type="radio"
                                        {...register('doctor_id', { valueAsNumber: true })}
                                        value={doc.id}
                                        className="sr-only peer"
                                    />
                                    <div className="flex items-center space-x-3">
                                        <UserCircleIcon className="h-8 w-8 text-gray-300 group-peer-checked:text-primary-500" />
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 italic">Dr. {doc.name}</p>
                                            <p className="text-[10px] text-primary-600 font-bold uppercase">{doc.specialization || 'Physician'}</p>
                                        </div>
                                    </div>
                                </label>
                            ))}
                        </div>
                        {errors.doctor_id && <p className="text-red-500 text-xs mt-1">{errors.doctor_id.message}</p>}
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-200 rounded-2xl text-gray-600 font-bold hover:bg-gray-50 transition-colors"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 bg-primary-950 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-primary-900 transition-all active:scale-95 disabled:opacity-50 tracking-widest uppercase"
                    >
                        {isSubmitting ? 'Registering...' : 'Confirm Walk-In Admission'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default WalkInModal;
