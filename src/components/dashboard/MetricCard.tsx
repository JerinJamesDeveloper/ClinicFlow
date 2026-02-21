import React from 'react';

interface MetricCardProps {
    title: string;
    value: string | number;
    icon: React.ForwardRefExoticComponent<any>;
    trend?: {
        value: number;
        isUp: boolean;
    };
    color: string;
    description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon: Icon,
    trend,
    color,
    description,
}) => {
    return (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10`}>
                    <Icon className={`h-6 w-6 ${color.replace('bg-', 'text-')}`} />
                </div>
                {trend && (
                    <div className={`flex items-center text-sm font-bold ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
                        <span>{trend.isUp ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
                <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">{value}</span>
                </div>
                {description && <p className="text-gray-400 text-xs mt-2 line-clamp-1">{description}</p>}
            </div>
        </div>
    );
};

export default MetricCard;
