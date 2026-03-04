// src/pages/patients/PatientList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import type { Patient } from '../../types/api.types';
import { PlusIcon, UsersIcon, FunnelIcon } from '@heroicons/react/24/outline';

const PatientList: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { patients, total, isLoading, deletePatient } = usePatients(page, search);

  const columns = [
    { key: 'name', header: 'Patient Name' },
    { key: 'age', header: 'Age' },
    { 
      key: 'gender', 
      header: 'Gender',
      render: (value: string) => (
        <StatusBadge 
          status={value === 'male' ? 'Male' : value === 'female' ? 'Female' : 'Other'} 
          variant={value === 'male' ? 'info' : value === 'female' ? 'success' : 'default'}
        />
      )
    },
    { key: 'phone', header: 'Contact' },
    { key: 'blood_group', header: 'Blood Group' },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (_: unknown, row: Patient) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/patients/${row.id}`)}
            className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
          >
            View
          </button>
          <button
            onClick={() => navigate(`/appointments/book?patientId=${row.id}`)}
            className="px-3 py-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
          >
            Book
          </button>
          <button
            onClick={() => deletePatient(row.id)}
            className="px-3 py-1.5 text-xs font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title">Patient Management</h1>
          <p className="page-subtitle">Manage and view all patient records</p>
        </div>
        <button
          onClick={() => navigate('/patients/new')}
          className="btn-primary"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          New Patient
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-100">
            <UsersIcon className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-surface-900">{total}</p>
            <p className="text-sm text-surface-500">Total Patients</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              onSearch={setSearch}
              placeholder="Search patients by name, phone, or email..."
              className="w-full"
            />
          </div>
          <button className="btn-secondary">
            <FunnelIcon className="w-4 h-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={patients}
        loading={isLoading}
        pagination={{
          currentPage: page,
          totalItems: total,
          pageSize: 20,
          onPageChange: setPage,
        }}
      />
    </div>
  );
};

export default PatientList;
