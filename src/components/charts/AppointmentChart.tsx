// src/components/charts/AppointmentChart.tsx
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AppointmentChartProps {
  data: Array<{
    date: string;
    scheduled: number;
    completed: number;
    cancelled: number;
  }>;
}

const AppointmentChart: React.FC<AppointmentChartProps> = ({ data }) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="scheduled" stroke="#8884d8" />
          <Line type="monotone" dataKey="completed" stroke="#82ca9d" />
          <Line type="monotone" dataKey="cancelled" stroke="#ff7300" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AppointmentChart;