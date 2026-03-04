import React from 'react';
import { Link } from 'react-router-dom';
import { UsersIcon, CalendarIcon, QueueListIcon, TvIcon, CurrencyRupeeIcon, ChatBubbleLeftRightIcon, ShieldCheckIcon, UserGroupIcon, DocumentChartBarIcon } from '@heroicons/react/24/outline';

const Card: React.FC<{ title: string; desc: string; to: string; icon: React.ReactNode }> = ({ title, desc, to, icon }) => (
  <Link to={to} className="bg-white rounded-lg shadow p-5 hover:shadow-md transition block">
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-lg bg-primary-50 flex items-center justify-center text-primary-700">
        {icon}
      </div>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600 mt-1">{desc}</p>
      </div>
    </div>
  </Link>
);

const FrontBenchHome: React.FC = () => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Front Bench</h1>
        <p className="text-sm text-gray-500">Front desk CRM, scheduling, walk-ins, and live queue.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card
          title="Patient CRM"
          desc="Register, update details, Aadhaar/insurance, documents, family links, duplicates."
          to="/front-bench/patients"
          icon={<UsersIcon className="h-6 w-6" />}
        />
        <Card
          title="Scheduling"
          desc="Slot-based booking, blocks, overbooking control, waitlist, drag-and-drop reschedule."
          to="/front-bench/appointments"
          icon={<CalendarIcon className="h-6 w-6" />}
        />
        <Card
          title="Walk-in Queue"
          desc="Token generation, status tracking, priority override, room assignment, SMS/WhatsApp."
          to="/front-bench/queue"
          icon={<QueueListIcon className="h-6 w-6" />}
        />
        <Card
          title="Billing"
          desc="GST-ready billing, discounts, split payments, refunds, receipts, daily cash."
          to="/front-bench/billing"
          icon={<CurrencyRupeeIcon className="h-6 w-6" />}
        />
        <Card
          title="CRM Comms"
          desc="Reminders, follow-ups, feedback, complaints, satisfaction ratings (dev placeholders)."
          to="/front-bench/comms"
          icon={<ChatBubbleLeftRightIcon className="h-6 w-6" />}
        />
        <Card
          title="Insurance / TPA"
          desc="Policy verification, pre-auth, claims, pending approvals dashboard."
          to="/front-bench/insurance"
          icon={<ShieldCheckIcon className="h-6 w-6" />}
        />
        <Card
          title="Doctors / Departments"
          desc="Doctor profiles, specialization, rooms, department mapping with color coding."
          to="/front-bench/doctors"
          icon={<UserGroupIcon className="h-6 w-6" />}
        />
        <Card
          title="Reports"
          desc="Daily cash + daily closing report for supervisor."
          to="/front-bench/reports"
          icon={<DocumentChartBarIcon className="h-6 w-6" />}
        />
        <Card
          title="Display Board"
          desc="TV-friendly live queue view (auto-refresh)."
          to="/front-bench/display"
          icon={<TvIcon className="h-6 w-6" />}
        />
      </div>
    </div>
  );
};

export default FrontBenchHome;
