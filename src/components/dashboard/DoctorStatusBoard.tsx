import React from 'react';
import { useQuery } from 'react-query';
import { AdminService } from '../../services/api/admin.service';
import { UserCircleIcon } from '@heroicons/react/24/solid';


const DoctorStatusBoard: React.FC = () => {
    const { data: doctorsData, isLoading } = useQuery(
        'doctorsStatus',
        () => AdminService.getUsers({ role: 'doctor' })
    );

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'available': return 'bg-green-500';
            case 'busy': return 'bg-red-500';
            case 'away': return 'bg-gray-400';
            default: return 'bg-gray-300';
        }
    };
    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                <span>Practitioner Availability</span>
                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-normal">Live Status</span>
            </h3>

            <div className="grid grid-cols-1 gap-4">
                {isLoading ? (
                    <div className="animate-pulse space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-2xl" />)}
                    </div>
                ) : doctorsData?.items.map((doc, idx) => {
                    // Mock status logic for demo purposes
                    const statuses: ('available' | 'busy' | 'away')[] = ['available', 'busy', 'away'];
                    const status = statuses[idx % 3];

                    return (
                        <div key={doc.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-50 hover:bg-gray-50 transition-colors group">
                            <div className="flex items-center space-x-3">
                                <div className="relative">
                                    <UserCircleIcon className="h-12 w-12 text-gray-200 group-hover:text-primary-100 transition-colors" />
                                    <div className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${getStatusColor(status)}`} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900 text-sm italic">Dr. {doc.name}</p>
                                    <p className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{doc.specialization || 'General Physician'}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <span className={`text-[10px] font-bold uppercase py-1 px-2 rounded-md ${status === 'available' ? 'text-green-700 bg-green-50' :
                                    status === 'busy' ? 'text-red-700 bg-red-50' :
                                        'text-gray-600 bg-gray-50'
                                    }`}>
                                    {status}
                                </span>
                                {status === 'busy' && <p className="text-[9px] text-red-400 mt-1 font-medium">In Consultation</p>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DoctorStatusBoard;
