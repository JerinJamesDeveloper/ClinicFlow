import React, { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import { useAuth } from '../../hooks/useAuth';
import { useFrontBenchPatients } from '../../hooks/frontbench/useFrontBenchPatients';
import type { DocumentType, FrontBenchDocument, PatientCRM } from '../../types/frontbench.types';

const digitsOnly = (value: string) => value.replace(/\D/g, '');

type CreatePatientInput = Omit<
  PatientCRM,
  'id' | 'clinicId' | 'mrn' | 'createdAt' | 'updatedAt' | 'searchKey'
>;

const patientSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  phone: z.string().min(10, 'Valid phone required'),
  gender: z.enum(['male', 'female', 'other']),
  dateOfBirth: z.string().optional(),
  age: z.number().int().min(0).max(150).optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
  aadhaar: z.string().optional(),
  insuranceProvider: z.string().optional(),
  policyNumber: z.string().optional(),
  policyValidTo: z.string().optional(),
  memberId: z.string().optional(),
  emergencyName: z.string().optional(),
  emergencyPhone: z.string().optional(),
  emergencyRelation: z.string().optional(),
  familyGroupId: z.string().optional(),
  familyRelationship: z.enum(['self', 'parent', 'child', 'spouse', 'guardian', 'other']).optional(),
  linkedPatientMrn: z.string().optional(),
});

type PatientForm = z.infer<typeof patientSchema>;

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

const PatientCRMPage: React.FC = () => {
  const { user } = useAuth();
  const clinicId = user?.clinic_id ?? 1;
  const { patients, search, createPatient, updatePatient, findDuplicates } = useFrontBenchPatients(clinicId);

  const [searchTerm, setSearchTerm] = useState('');
  const [selected, setSelected] = useState<PatientCRM | null>(null);
  const [dupes, setDupes] = useState<PatientCRM[]>([]);
  const [forceCreate, setForceCreate] = useState(false);

  const results = useMemo(() => search(searchTerm), [search, searchTerm]);

  const form = useForm<PatientForm>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      gender: 'male',
    },
  });

  const startNew = () => {
    setSelected(null);
    setDupes([]);
    setForceCreate(false);
    form.reset({ gender: 'male' });
  };

  const loadForEdit = (p: PatientCRM) => {
    setSelected(p);
    setDupes([]);
    setForceCreate(false);
    form.reset({
      name: p.name,
      phone: p.phone,
      gender: p.gender,
      dateOfBirth: p.dateOfBirth ?? '',
      age: p.age,
      email: p.email ?? '',
      address: p.address ?? '',
      aadhaar: p.aadhaar ?? '',
      insuranceProvider: p.insurance?.provider ?? '',
      policyNumber: p.insurance?.policyNumber ?? '',
      policyValidTo: p.insurance?.validTo ?? '',
      memberId: p.insurance?.memberId ?? '',
      emergencyName: p.emergencyContact?.name ?? '',
      emergencyPhone: p.emergencyContact?.phone ?? '',
      emergencyRelation: p.emergencyContact?.relation ?? '',
      familyGroupId: p.family?.groupId ?? '',
      familyRelationship: p.family?.relationship ?? 'self',
      linkedPatientMrn: p.family?.linkedPatientMrn ?? '',
    });
  };

  const onCheckDuplicates = (data: PatientForm) => {
    const matches = findDuplicates({ phone: data.phone, aadhaar: data.aadhaar, name: data.name });
    setDupes(matches);
    if (matches.length === 0) toast.success('No obvious duplicates found');
  };

  const onSubmit = async (data: PatientForm) => {
    const aadhaarDigits = data.aadhaar ? digitsOnly(data.aadhaar) : undefined;
    const emergencyPhoneDigits = data.emergencyPhone ? digitsOnly(data.emergencyPhone) : undefined;
    const phoneDigits = digitsOnly(data.phone);

    const payloadBase: CreatePatientInput = {
      name: data.name,
      phone: phoneDigits,
      gender: data.gender,
      dateOfBirth: data.dateOfBirth || undefined,
      age: data.age,
      email: data.email || undefined,
      address: data.address || undefined,
      aadhaar: aadhaarDigits || undefined,
      insurance: {
        provider: data.insuranceProvider || undefined,
        policyNumber: data.policyNumber || undefined,
        validTo: data.policyValidTo || undefined,
        memberId: data.memberId || undefined,
      },
      emergencyContact: {
        name: data.emergencyName || undefined,
        phone: emergencyPhoneDigits || undefined,
        relation: data.emergencyRelation || undefined,
      },
      family: data.familyGroupId
        ? {
            groupId: data.familyGroupId,
            relationship: data.familyRelationship ?? 'self',
            linkedPatientMrn: data.linkedPatientMrn || undefined,
          }
        : undefined,
      documents: selected?.documents ?? ([] as FrontBenchDocument[]),
    };

    try {
      if (selected) {
        const updated = updatePatient(selected.id, payloadBase);
        setSelected(updated);
      } else {
        const created = createPatient(payloadBase, { allowDuplicates: forceCreate });
        setSelected(created);
      }
      setDupes([]);
      setForceCreate(false);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to save patient';
      if (msg.includes('duplicate')) {
        onCheckDuplicates(data);
        toast.error('Resolve duplicates or use Force Create');
      } else {
        toast.error(msg);
      }
    }
  };

  const onUploadDocs = async (files: FileList | null, type: DocumentType) => {
    if (!files || files.length === 0) return;
    if (!selected) {
      toast.error('Save patient first to upload documents');
      return;
    }

    const docs: FrontBenchDocument[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await fileToDataUrl(f);
      docs.push({
        id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        type,
        fileName: f.name,
        mimeType: f.type || 'application/octet-stream',
        dataUrl,
        uploadedAt: new Date().toISOString(),
      });
    }

    const updated = updatePatient(selected.id, { documents: [...selected.documents, ...docs] });
    setSelected(updated);
  };

  const removeDoc = (docId: string) => {
    if (!selected) return;
    const updated = updatePatient(selected.id, { documents: selected.documents.filter((d) => d.id !== docId) });
    setSelected(updated);
  };

  const columns = useMemo(
    () => [
      { key: 'mrn', header: 'MRN' },
      { key: 'name', header: 'Name' },
      { key: 'phone', header: 'Phone' },
      { key: 'aadhaar', header: 'Aadhaar' },
      {
        key: 'actions',
        header: 'Actions',
        render: (_: unknown, row: PatientCRM) => (
          <button onClick={() => loadForEdit(row)} className="text-primary-700 hover:text-primary-900">
            Edit
          </button>
        ),
      },
    ],
    []
  );

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patient Registration & CRM</h1>
          <p className="text-sm text-gray-500">
            Fast search (name/phone/MRN/Aadhaar), duplicate detection, documents, family linking.
          </p>
        </div>
        <button onClick={startNew} className="px-4 py-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700">
          + New Patient
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Search Patients</h2>
            <div className="text-xs text-gray-500">Tip: paste MRN / Aadhaar / phone</div>
          </div>
          <SearchBar
            debounceMs={150}
            onSearch={setSearchTerm}
            placeholder="Search by name, phone, MRN, Aadhaar..."
            className="mb-4"
          />
          <DataTable<PatientCRM> columns={columns as any} data={results} loading={false} />
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{selected ? 'Update Patient' : 'Register Patient'}</h2>
              {selected && <p className="text-xs text-gray-500">MRN: {selected.mrn}</p>}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={form.handleSubmit(onCheckDuplicates)}
                className="px-3 py-2 rounded-lg border bg-white hover:bg-gray-50"
              >
                Check Duplicates
              </button>
              {!selected && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input type="checkbox" checked={forceCreate} onChange={(e) => setForceCreate(e.target.checked)} />
                  Force create
                </label>
              )}
            </div>
          </div>

          {dupes.length > 0 && (
            <div className="mb-4 border border-amber-200 bg-amber-50 rounded-lg p-3">
              <p className="text-sm font-medium text-amber-900">Possible duplicates</p>
              <ul className="mt-2 text-sm text-amber-900 space-y-1">
                {dupes.slice(0, 5).map((d) => (
                  <li key={d.id}>
                    {d.mrn} — {d.name} — {d.phone} {d.aadhaar ? `— Aadhaar: ${d.aadhaar}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input {...form.register('name')} className="w-full border rounded-md p-2" />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input {...form.register('phone')} className="w-full border rounded-md p-2" />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{form.formState.errors.phone.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                <select {...form.register('gender')} className="w-full border rounded-md p-2">
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DOB</label>
                <input type="date" {...form.register('dateOfBirth')} className="w-full border rounded-md p-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aadhaar (12 digits)</label>
                <input {...form.register('aadhaar')} className="w-full border rounded-md p-2" placeholder="optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" {...form.register('email')} className="w-full border rounded-md p-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea {...form.register('address')} rows={2} className="w-full border rounded-md p-2" />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Insurance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <input {...form.register('insuranceProvider')} className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                  <input {...form.register('policyNumber')} className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valid To</label>
                  <input type="date" {...form.register('policyValidTo')} className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Member ID</label>
                  <input {...form.register('memberId')} className="w-full border rounded-md p-2" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input {...form.register('emergencyName')} className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input {...form.register('emergencyPhone')} className="w-full border rounded-md p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relation</label>
                  <input {...form.register('emergencyRelation')} className="w-full border rounded-md p-2" />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Family Linking</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family Group ID</label>
                  <input {...form.register('familyGroupId')} className="w-full border rounded-md p-2" placeholder="e.g., FAMILY-001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <select {...form.register('familyRelationship')} className="w-full border rounded-md p-2">
                    <option value="self">Self</option>
                    <option value="parent">Parent</option>
                    <option value="child">Child</option>
                    <option value="spouse">Spouse</option>
                    <option value="guardian">Guardian</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Linked Patient MRN</label>
                  <input {...form.register('linkedPatientMrn')} className="w-full border rounded-md p-2" placeholder="MRN-..." />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Documents</h3>
              <div className="flex flex-wrap gap-3 items-center">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Aadhaar</label>
                  <input type="file" onChange={(e) => onUploadDocs(e.target.files, 'aadhaar')} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Insurance Card</label>
                  <input type="file" onChange={(e) => onUploadDocs(e.target.files, 'insurance')} />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Other</label>
                  <input type="file" multiple onChange={(e) => onUploadDocs(e.target.files, 'other')} />
                </div>
              </div>
              {selected && selected.documents.length > 0 && (
                <div className="mt-3 space-y-2">
                  {selected.documents.map((d) => (
                    <div key={d.id} className="flex items-center justify-between border rounded-md p-2">
                      <div className="text-sm text-gray-800">
                        <span className="font-medium">{d.type}</span> — {d.fileName}
                      </div>
                      <div className="flex gap-3 items-center">
                        <a className="text-primary-700 text-sm" href={d.dataUrl} target="_blank" rel="noreferrer">
                          View
                        </a>
                        <button type="button" onClick={() => removeDoc(d.id)} className="text-red-700 text-sm">
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={startNew} className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50">
                Clear
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black">
                {selected ? 'Update Patient' : 'Register Patient'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PatientCRMPage;
