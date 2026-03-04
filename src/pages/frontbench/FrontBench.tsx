import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { usePatients } from '../../hooks/usePatients';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import type { Patient, PatientCreate } from '../../types/api.types';

const patientCreateSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  age: z.number().min(0).max(150),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  blood_group: z.string().optional(),
});

type PatientCreateFormData = z.infer<typeof patientCreateSchema>;

type Interaction = {
  id: string;
  createdAt: string;
  note: string;
};

const notesKey = (patientId: number) => `frontbench_interactions_v1_${patientId}`;

const readInteractions = (patientId: number): Interaction[] => {
  try {
    const raw = localStorage.getItem(notesKey(patientId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Interaction[];
  } catch {
    return [];
  }
};

const writeInteractions = (patientId: number, interactions: Interaction[]) => {
  localStorage.setItem(notesKey(patientId), JSON.stringify(interactions));
};

const FrontBench: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const { patients, total, isLoading, createPatient } = usePatients(page, search);

  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [interactionNote, setInteractionNote] = useState('');
  const [interactions, setInteractions] = useState<Interaction[]>([]);

  useEffect(() => {
    if (!selectedPatient) {
      setInteractions([]);
      return;
    }
    setInteractions(readInteractions(selectedPatient.id));
  }, [selectedPatient?.id]);

  const columns = useMemo(
    () => [
      { key: 'name', header: 'Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'age', header: 'Age' },
      { key: 'gender', header: 'Gender' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: Patient) => (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedPatient(row)} className="text-primary-600 hover:text-primary-900">
              Select
            </button>
            <button onClick={() => navigate(`/patients/${row.id}`)} className="text-gray-700 hover:text-gray-900">
              View
            </button>
            <button
              onClick={() => navigate(`/appointments/book?patientId=${row.id}`)}
              className="text-green-700 hover:text-green-900"
            >
              Book
            </button>
          </div>
        ),
      },
    ],
    [navigate]
  );

  const patientForm = useForm<PatientCreateFormData>({
    resolver: zodResolver(patientCreateSchema),
    defaultValues: {
      name: '',
      age: 0,
      gender: 'male',
      phone: '',
      email: '',
      address: '',
      blood_group: '',
    },
  });

  const onCreatePatient = async (data: PatientCreateFormData) => {
    const payload: PatientCreate = {
      name: data.name,
      age: data.age,
      gender: data.gender,
      phone: data.phone,
      email: data.email || undefined,
      address: data.address || undefined,
      blood_group: data.blood_group || undefined,
    };

    const created = await createPatient(payload);
    setSelectedPatient(created);
    patientForm.reset();
  };

  const onAddInteraction = () => {
    if (!selectedPatient) return;
    const trimmed = interactionNote.trim();
    if (!trimmed) return;

    const next: Interaction[] = [
      {
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        createdAt: new Date().toISOString(),
        note: trimmed,
      },
      ...interactions,
    ];

    writeInteractions(selectedPatient.id, next);
    setInteractions(next);
    setInteractionNote('');
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Front Bench</h1>
          <p className="text-sm text-gray-500">Patient relationship management & quick registration</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => navigate('/patients')}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Full Patient List
          </button>
          <button
            onClick={() => navigate('/appointments')}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Appointments
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Find Patients</h2>
              {selectedPatient && (
                <span className="text-xs text-gray-500">
                  Selected: <span className="font-medium text-gray-700">{selectedPatient.name}</span>
                </span>
              )}
            </div>

            <SearchBar
              onSearch={(value) => {
                setPage(1);
                setSearch(value);
              }}
              placeholder="Search by name, phone, or email..."
              className="mb-4"
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
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Patient</h2>
            <form onSubmit={patientForm.handleSubmit(onCreatePatient)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input
                    {...patientForm.register('name')}
                    className="w-full border rounded-md p-2"
                    placeholder="Patient name"
                  />
                  {patientForm.formState.errors.name && (
                    <p className="text-red-500 text-sm mt-1">{patientForm.formState.errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input
                    {...patientForm.register('phone')}
                    className="w-full border rounded-md p-2"
                    placeholder="10+ digits"
                  />
                  {patientForm.formState.errors.phone && (
                    <p className="text-red-500 text-sm mt-1">{patientForm.formState.errors.phone.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                  <input
                    type="number"
                    {...patientForm.register('age', { valueAsNumber: true })}
                    className="w-full border rounded-md p-2"
                  />
                  {patientForm.formState.errors.age && (
                    <p className="text-red-500 text-sm mt-1">{patientForm.formState.errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                  <select {...patientForm.register('gender')} className="w-full border rounded-md p-2">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {patientForm.formState.errors.gender && (
                    <p className="text-red-500 text-sm mt-1">{patientForm.formState.errors.gender.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    {...patientForm.register('email')}
                    className="w-full border rounded-md p-2"
                    placeholder="optional"
                  />
                  {patientForm.formState.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{patientForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
                  <input {...patientForm.register('blood_group')} className="w-full border rounded-md p-2" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <textarea {...patientForm.register('address')} rows={3} className="w-full border rounded-md p-2" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => patientForm.reset()}
                  className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
                >
                  Clear
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
                  Create Patient
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Patient Relationship</h2>
                <p className="text-xs text-gray-500">Interaction notes are stored in this browser (localStorage).</p>
              </div>
              <div className="flex gap-2">
                <button
                  disabled={!selectedPatient}
                  onClick={() => selectedPatient && navigate(`/patients/${selectedPatient.id}`)}
                  className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Open Profile
                </button>
                <button
                  disabled={!selectedPatient}
                  onClick={() => selectedPatient && navigate(`/appointments/book?patientId=${selectedPatient.id}`)}
                  className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Book Appointment
                </button>
              </div>
            </div>

            {!selectedPatient ? (
              <div className="text-sm text-gray-600">
                Select a patient from the left to add follow-ups and manage interactions.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border p-3 bg-gray-50">
                  <p className="text-sm font-medium text-gray-900">{selectedPatient.name}</p>
                  <p className="text-xs text-gray-600">
                    {selectedPatient.phone}
                    {selectedPatient.email ? ` • ${selectedPatient.email}` : ''}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <a className="text-sm text-primary-700 hover:text-primary-900" href={`tel:${selectedPatient.phone}`}>
                      Call
                    </a>
                    {selectedPatient.email && (
                      <a
                        className="text-sm text-primary-700 hover:text-primary-900"
                        href={`mailto:${selectedPatient.email}`}
                      >
                        Email
                      </a>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Add interaction</label>
                  <textarea
                    value={interactionNote}
                    onChange={(e) => setInteractionNote(e.target.value)}
                    rows={3}
                    className="w-full border rounded-md p-2"
                    placeholder="e.g., Called patient to confirm appointment, asked to bring reports..."
                  />
                  <div className="flex justify-end">
                    <button type="button" onClick={onAddInteraction} className="px-4 py-2 rounded-lg bg-gray-900 text-white">
                      Save Note
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Recent interactions</h3>
                  {interactions.length === 0 ? (
                    <p className="text-sm text-gray-600">No notes yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {interactions.slice(0, 10).map((i) => (
                        <div key={i.id} className="border rounded-lg p-3">
                          <p className="text-xs text-gray-500">{new Date(i.createdAt).toLocaleString()}</p>
                          <p className="text-sm text-gray-900 whitespace-pre-wrap">{i.note}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrontBench;

