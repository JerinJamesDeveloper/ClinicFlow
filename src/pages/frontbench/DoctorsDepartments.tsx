import React, { useMemo, useState } from 'react';
import { useFrontBenchAdmin } from '../../hooks/frontbench/useFrontBenchAdmin';
import DataTable from '../../components/common/DataTable';
import toast from 'react-hot-toast';
import type { Department, DoctorCRM } from '../../types/frontbench.types';

const DoctorsDepartments: React.FC = () => {
  const admin = useFrontBenchAdmin();

  const [newDepName, setNewDepName] = useState('');
  const [newDepColor, setNewDepColor] = useState('#2563eb');

  const addDep = () => {
    if (!newDepName.trim()) return toast.error('Department name required');
    admin.addDepartment({ name: newDepName.trim(), color: newDepColor, isActive: true });
    setNewDepName('');
  };

  const depColumns = useMemo(
    () => [
      { key: 'name', header: 'Department' },
      {
        key: 'color',
        header: 'Color',
        render: (value: string) => <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded" style={{ backgroundColor: value }} /> {value}</span>,
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: Department) => (
          <button onClick={() => admin.updateDepartment(row.id, { isActive: false })} className="text-xs text-red-700">
            Deactivate
          </button>
        ),
      },
    ],
    [admin]
  );

  const doctorColumns = useMemo(
    () => [
      { key: 'name', header: 'Doctor' },
      { key: 'specialization', header: 'Specialization' },
      { key: 'room', header: 'Room' },
      {
        key: 'departmentId',
        header: 'Department',
        render: (_: unknown, row: DoctorCRM) => {
          const dep = admin.departments.find((d) => d.id === row.departmentId);
          return dep ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3 w-3 rounded" style={{ backgroundColor: dep.color }} />
              {dep.name}
            </span>
          ) : (
            <span className="text-gray-500">-</span>
          );
        },
      },
      { key: 'consultationFee', header: 'Fee (₹)' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: DoctorCRM) => (
          <div className="flex gap-2">
            <button onClick={() => loadDoctor(row.id)} className="text-xs text-primary-700">
              Edit
            </button>
            <button onClick={() => admin.updateDoctor(row.id, { isActive: false })} className="text-xs text-red-700">
              Deactivate
            </button>
          </div>
        ),
      },
    ],
    [admin]
  );

  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const selectedDoctor = admin.doctors.find((d) => d.id === selectedDoctorId) ?? null;
  const [editDepartmentId, setEditDepartmentId] = useState<string>('');
  const [editRoom, setEditRoom] = useState('');
  const [editFee, setEditFee] = useState(0);
  const [editStart, setEditStart] = useState(9);
  const [editEnd, setEditEnd] = useState(17);
  const [editSlot, setEditSlot] = useState(15);

  const loadDoctor = (id: string) => {
    const d = admin.doctors.find((x) => x.id === id);
    if (!d) return;
    setSelectedDoctorId(d.id);
    setEditDepartmentId(d.departmentId ?? admin.departments[0]?.id ?? '');
    setEditRoom(d.room ?? '');
    setEditFee(d.consultationFee ?? 0);
    setEditStart(d.availabilityTemplate?.startHour ?? 9);
    setEditEnd(d.availabilityTemplate?.endHour ?? 17);
    setEditSlot(d.availabilityTemplate?.slotMinutes ?? 15);
  };

  const saveDoctor = () => {
    if (!selectedDoctor) return;
    admin.updateDoctor(selectedDoctor.id, {
      departmentId: editDepartmentId || undefined,
      room: editRoom || undefined,
      consultationFee: editFee || undefined,
      availabilityTemplate: {
        daysOfWeek: [1, 2, 3, 4, 5, 6],
        startHour: editStart,
        endHour: editEnd,
        slotMinutes: editSlot,
      },
    });
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor & Department Management</h1>
        <p className="text-sm text-gray-500">Doctor profiles, specialization tagging, room mapping, department mapping with color coding.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Departments</h2>
          </div>
          <div className="flex flex-wrap gap-2 items-end mb-3">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs text-gray-600 mb-1">Name</label>
              <input value={newDepName} onChange={(e) => setNewDepName(e.target.value)} className="w-full border rounded-md p-2" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Color</label>
              <input type="color" value={newDepColor} onChange={(e) => setNewDepColor(e.target.value)} className="h-10 w-16 border rounded-md p-1" />
            </div>
            <button onClick={addDep} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
              Add
            </button>
          </div>
          <DataTable<Department> columns={depColumns as any} data={admin.departments} loading={false} />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Doctors</h2>
          </div>
          <DataTable<DoctorCRM> columns={doctorColumns as any} data={admin.doctors} loading={false} />
          <p className="text-xs text-gray-500 mt-3">Click “Edit” to map department, fees, and availability template.</p>

          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Doctor Editor</h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {admin.doctors.slice(0, 6).map((d) => (
                <button
                  key={d.id}
                  onClick={() => loadDoctor(d.id)}
                  className={`px-3 py-1 rounded border text-sm ${d.id === selectedDoctorId ? 'border-primary-600 text-primary-700' : 'border-gray-200 text-gray-700'}`}
                >
                  {d.name}
                </button>
              ))}
            </div>

            {!selectedDoctor ? (
              <p className="text-sm text-gray-600">Select a doctor to edit.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Department</label>
                  <select value={editDepartmentId} onChange={(e) => setEditDepartmentId(e.target.value)} className="w-full border rounded-md p-2">
                    {admin.departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Room</label>
                  <input value={editRoom} onChange={(e) => setEditRoom(e.target.value)} className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Consultation Fee (₹)</label>
                  <input type="number" value={editFee} onChange={(e) => setEditFee(Number(e.target.value))} className="w-full border rounded-md p-2" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Start</label>
                    <input type="number" value={editStart} onChange={(e) => setEditStart(Number(e.target.value))} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">End</label>
                    <input type="number" value={editEnd} onChange={(e) => setEditEnd(Number(e.target.value))} className="w-full border rounded-md p-2" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Slot</label>
                    <input type="number" value={editSlot} onChange={(e) => setEditSlot(Number(e.target.value))} className="w-full border rounded-md p-2" />
                  </div>
                </div>

                <div className="md:col-span-2 flex justify-end">
                  <button onClick={saveDoctor} className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
                    Save Doctor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorsDepartments;
