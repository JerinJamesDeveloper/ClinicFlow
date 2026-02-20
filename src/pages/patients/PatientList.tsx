// src/pages/patients/PatientList.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../../hooks/usePatients';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import StatusBadge from '../../components/common/StatusBadge';
import type { Patient } from '../../types/api.types';

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
          status={value} 
          variant={value === 'male' ? 'info' : 'success'}
        />
      )
    },
    { key: 'phone', header: 'Contact' },
    { key: 'blood_group', header: 'Blood Group' },
    { 
      key: 'actions', 
      header: 'Actions',
      render: (_: unknown, row: Patient) => (
        <div className="space-x-2">
          <button
            onClick={() => navigate(`/patients/${row.id}`)}
            className="text-primary-600 hover:text-primary-900"
          >
            View
          </button>
          <button
            onClick={() => navigate(`/appointments/book?patientId=${row.id}`)}
            className="text-green-600 hover:text-green-900"
          >
            Book
          </button>
          <button
            onClick={() => deletePatient(row.id)}
            className="text-red-600 hover:text-red-900"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Patient Management</h1>
        <button
          onClick={() => navigate('/patients/new')}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
        >
          + New Patient
        </button>
      </div>

      <SearchBar
        onSearch={setSearch}
        placeholder="Search patients by name, phone, or email..."
        className="mb-6"
      />

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