import React from 'react';
import {
    PhoneIcon,
    CurrencyDollarIcon,
    ClipboardDocumentCheckIcon,
    UserCircleIcon,
    ChatBubbleBottomCenterTextIcon,
    ArrowRightCircleIcon
} from '@heroicons/react/24/outline';
import type { Appointment } from '../../types/api.types';

interface ContextualInfoPanelProps {
    appointment: Appointment | null;
    onQuickCall?: (phone: string) => void;
    onViewDetails?: (id: number) => void;
}

const ContextualInfoPanel: React.FC<ContextualInfoPanelProps> = ({
    appointment,
    onQuickCall,
    onViewDetails,
}) => {
    if (!appointment) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 h-full flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                    <UserCircleIcon className="h-10 w-10 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800">No Patient Selected</h3>
                <p className="text-sm text-gray-500 max-w-[200px] mt-2">
                    Select an appointment from the list to view patient details and quick actions.
                </p>
            </div>
        );
    }

    const { patient } = appointment;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-primary-700 font-bold text-lg">
                            {patient?.name.charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 uppercase">
                            {patient?.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {patient?.gender === 'male' ? 'Male' : patient?.gender === 'female' ? 'Female' : 'Other'}, {patient?.age} Years
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Contact Info */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Contact Information</h4>
                    <div className="flex items-center space-x-3 group">
                        <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <PhoneIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{patient?.phone}</p>
                            <p className="text-xs text-gray-500">Mobile</p>
                        </div>
                        <button
                            onClick={() => onQuickCall?.(patient?.phone || '')}
                            className="px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Quick Call
                        </button>
                    </div>
                </div>

                {/* Quick Stats */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Patient Summary</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                            <div className="flex items-center space-x-2 text-gray-500 mb-1">
                                <ClipboardDocumentCheckIcon className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase">Visits</span>
                            </div>
                            <p className="text-lg font-bold text-gray-900">12</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-xl border border-red-100">
                            <div className="flex items-center space-x-2 text-red-500 mb-1">
                                <CurrencyDollarIcon className="h-4 w-4" />
                                <span className="text-[10px] font-bold uppercase">Pending</span>
                            </div>
                            <p className="text-lg font-bold text-red-700">₹450</p>
                        </div>
                    </div>
                </div>

                {/* Latest Note / History */}
                <div>
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Latest Note</h4>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 flex items-start space-x-3">
                        <ChatBubbleBottomCenterTextIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                        <p className="text-sm text-gray-700 leading-relaxed italic">
                            "Patient mentioned mild fever since yesterday. Needs routine checkup."
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50">
                <button
                    onClick={() => appointment && onViewDetails?.(appointment.id)}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 transition-all shadow-sm active:scale-[0.98]"
                >
                    <span>Full Patient Profile</span>
                    <ArrowRightCircleIcon className="h-5 w-5 text-gray-400" />
                </button>
            </div>
        </div>
    );
};

export default ContextualInfoPanel;
