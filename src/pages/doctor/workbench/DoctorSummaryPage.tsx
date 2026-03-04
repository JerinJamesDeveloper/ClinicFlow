import React from 'react';
import { useWorkbench } from './DoctorWorkbenchLayout';

const badgeClass = (s: 'normal' | 'warning' | 'critical') =>
  s === 'critical' ? 'bg-red-100 text-red-800 border-red-200' : s === 'warning' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' : 'bg-green-100 text-green-800 border-green-200';

const rangeSeverity = (value: number | null | undefined, normalLow: number, normalHigh: number, criticalLow: number, criticalHigh: number) => {
  if (value == null) return 'warning' as const;
  if (value < criticalLow || value > criticalHigh) return 'critical' as const;
  if (value < normalLow || value > normalHigh) return 'warning' as const;
  return 'normal' as const;
};

const bpSeverity = (s: number | null | undefined, d: number | null | undefined) => {
  if (s == null || d == null) return 'warning' as const;
  if (s >= 180 || d >= 110 || s < 90 || d < 60) return 'critical' as const;
  if (s >= 140 || d >= 90) return 'warning' as const;
  return 'normal' as const;
};

const VitalBox: React.FC<{ label: string; value: string; severity: 'normal' | 'warning' | 'critical' }> = ({ label, value, severity }) => (
  <div className={`rounded-md border px-3 py-2 text-sm ${badgeClass(severity)}`}>
    <div className="text-xs opacity-80">{label}</div>
    <div className="font-semibold">{value}</div>
  </div>
);

const DoctorSummaryPage: React.FC = () => {
  const { selectedAppointment, latestNurseRecord, history, allergyText } = useWorkbench();
  if (!selectedAppointment) return null;

  const v = latestNurseRecord?.vitals;
  const last = history[0];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Patient Info</h2>
          <div className="text-sm text-gray-700 space-y-1">
            <div>Name: {selectedAppointment.patient.name}</div>
            <div>Age/Gender: {selectedAppointment.patient.age ?? '-'} / {selectedAppointment.patient.gender ?? '-'}</div>
            <div>Patient ID: {selectedAppointment.patient.id}</div>
            <div>Phone: {selectedAppointment.patient.phone || '-'}</div>
            <div>Visit Type: {selectedAppointment.visit_type}</div>
            <div>Previous Visits: {history.length}</div>
          </div>
        </div>

        <div className="border rounded-lg p-3 md:col-span-2">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Vitals (from nurse)</h2>
          {v ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <VitalBox label="Blood Pressure" value={`${v.systolic ?? '-'} / ${v.diastolic ?? '-'}`} severity={bpSeverity(v.systolic, v.diastolic)} />
              <VitalBox label="Pulse" value={`${v.pulseRate ?? '-'} bpm`} severity={rangeSeverity(v.pulseRate, 60, 100, 40, 130)} />
              <VitalBox label="Temperature" value={`${v.temperature ?? '-'} ${v.temperatureUnit ?? 'C'}`} severity={rangeSeverity(v.temperature, 36.1, 37.5, 35, 39.5)} />
              <VitalBox label="Respiratory Rate" value={`${v.respiratoryRate ?? '-'}`} severity={rangeSeverity(v.respiratoryRate, 12, 20, 10, 30)} />
              <VitalBox label="SpO2" value={`${v.spo2 ?? '-'}%`} severity={rangeSeverity(v.spo2, 95, 100, 90, 100)} />
              <VitalBox label="Weight" value={`${v.weightKg ?? '-'} kg`} severity={rangeSeverity(v.weightKg, 40, 120, 30, 150)} />
              <VitalBox label="Height" value={`${v.heightCm ?? '-'} cm`} severity="normal" />
              <VitalBox label="BMI" value={`${v.bmi ?? '-'}`} severity={rangeSeverity(v.bmi, 18.5, 30, 16, 35)} />
            </div>
          ) : (
            <p className="text-sm text-gray-600">No nurse vitals available.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Chief Complaint</h2>
          <p className="text-sm text-gray-700">{latestNurseRecord?.chiefComplaint || '-'}</p>
        </div>
        <div className="border rounded-lg p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Symptoms</h2>
          <p className="text-sm text-gray-700">{latestNurseRecord?.symptoms?.join(', ') || '-'}</p>
        </div>
        <div className="border rounded-lg p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Medical History</h2>
          <p className="text-sm text-gray-700">{latestNurseRecord?.knownConditions?.join(', ') || '-'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border rounded-lg p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Allergies</h2>
          <p className="text-sm text-gray-700">{allergyText || '-'}</p>
        </div>
        <div className="border rounded-lg p-3">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Previous Visit History</h2>
          {last ? (
            <div className="text-sm text-gray-700 space-y-1">
              <div>Last diagnosis: {last.diagnosisPrimary || '-'}</div>
              <div>Last medications: {last.medications.map((m) => m.medicationName).join(', ') || '-'}</div>
              <div>Previous vitals: {last.vitals ? `${last.vitals.systolic ?? '-'} / ${last.vitals.diastolic ?? '-'}, SpO2 ${last.vitals.spo2 ?? '-'}%` : '-'}</div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No previous history yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DoctorSummaryPage;

