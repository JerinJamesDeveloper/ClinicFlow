import React from 'react';
import {
    PlusIcon,
    UserPlusIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    BoltIcon,
} from '@heroicons/react/24/outline';

interface QuickActionBarProps {
    onNewAppointment: () => void;
    onRegisterPatient: () => void;
    onSearchPatient: () => void;
    onQuickCheckIn: () => void;
    onWalkIn?: () => void;
}

const QuickActionBar: React.FC<QuickActionBarProps> = ({
    onNewAppointment,
    onRegisterPatient,
    onSearchPatient,
    onQuickCheckIn,
    onWalkIn,
}) => {
    const actions = [
        {
            name: 'New Appointment',
            icon: PlusIcon,
            onClick: onNewAppointment,
            color: 'bg-primary-600',
            hoverColor: 'hover:bg-primary-700',
        },
        {
            name: 'Walk-In Admission',
            icon: BoltIcon,
            onClick: onWalkIn || (() => { }),
            color: 'bg-primary-950',
            hoverColor: 'hover:bg-black',
        },
        {
            name: 'Register Patient',
            icon: UserPlusIcon,
            onClick: onRegisterPatient,
            color: 'bg-emerald-600',
            hoverColor: 'hover:bg-emerald-700',
        },
        {
            name: 'Search Patient',
            icon: MagnifyingGlassIcon,
            onClick: onSearchPatient,
            color: 'bg-blue-600',
            hoverColor: 'hover:bg-blue-700',
        },
        {
            name: 'Quick Check-In',
            icon: CheckCircleIcon,
            onClick: onQuickCheckIn,
            color: 'bg-amber-600',
            hoverColor: 'hover:bg-amber-700',
        },
    ];

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {actions.map((action) => (
                <button
                    key={action.name}
                    onClick={action.onClick}
                    className={`group flex flex-col items-center justify-center px-4 py-6 rounded-3xl shadow-sm transition-all duration-300 ${action.color} ${action.hoverColor} hover:shadow-xl hover:-translate-y-1 active:scale-95 text-white`}
                >
                    <div className="p-3 bg-white/20 rounded-2xl mb-3 group-hover:scale-110 transition-transform">
                        <action.icon className="h-7 w-7" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-center">
                        {action.name}
                    </span>
                </button>
            ))}
        </div>
    );
};

export default QuickActionBar;
