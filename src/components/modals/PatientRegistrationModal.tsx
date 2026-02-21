import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '../common/Modal';
import { usePatients } from '../../hooks/usePatients';
import toast from 'react-hot-toast';

const patientSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    age: z.number().min(0).max(150),
    gender: z.enum(['male', 'female', 'other']),
    phone: z.string().min(10, 'Valid phone number required'),
    email: z.string().email().optional().or(z.literal('')),
    address: z.string().optional(),
    notes: z.string().optional(),
});

type PatientFormData = z.infer<typeof patientSchema>;

interface PatientRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (patient: any) => void;
}

const PatientRegistrationModal: React.FC<PatientRegistrationModalProps> = ({
    isOpen,
    onClose,
    onSuccess,
}) => {
    const { createPatient } = usePatients();

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<PatientFormData>({
        resolver: zodResolver(patientSchema),
        defaultValues: {
            gender: 'male',
        }
    });

    const onSubmit = async (data: PatientFormData) => {
        try {
            const patient = await createPatient(data);
            toast.success('Patient registered successfully');
            onSuccess?.(patient);
            reset();
            onClose();
        } catch (error) {
            toast.error('Failed to register patient');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Register New Patient" maxWidth="xl">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Full Name *</label>
                        <input
                            {...register('name')}
                            placeholder="John Doe"
                            className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 transition-all ${errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Phone Number *</label>
                        <input
                            {...register('phone')}
                            placeholder="9876543210"
                            className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email (Optional)</label>
                        <input
                            {...register('email')}
                            type="email"
                            placeholder="john@example.com"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Age *</label>
                        <input
                            type="number"
                            {...register('age', { valueAsNumber: true })}
                            className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 transition-all ${errors.age ? 'border-red-500' : 'border-gray-300'
                                }`}
                        />
                        {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Gender *</label>
                        <select
                            {...register('gender')}
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 transition-all"
                        >
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Address</label>
                        <textarea
                            {...register('address')}
                            rows={2}
                            placeholder="123 Street Name, City"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 mb-1">Administrative Notes</label>
                        <textarea
                            {...register('notes')}
                            rows={2}
                            placeholder="Allergies, chronic conditions, etc."
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 transition-all"
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-8 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50"
                    >
                        {isSubmitting ? 'Registering...' : 'Register Patient'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default PatientRegistrationModal;
