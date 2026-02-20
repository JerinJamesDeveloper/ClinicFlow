// src/pages/lab/TestResults.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { LabService } from '../../services/api/lab.service';
import toast from 'react-hot-toast';

const TestResults: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [resultText, setResultText] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [isAbnormal, setIsAbnormal] = useState(false);
  const [resultFile, setResultFile] = useState<File | null>(null);

  const { data: test } = useQuery(
    ['labTest', id],
    () => LabService.getLabTestById(Number(id))
  );

  const uploadResults = useMutation(
    () => LabService.updateTestResults(Number(id), {
      status: 'completed',
      result_text: resultText,
      reference_range: referenceRange,
      is_abnormal: isAbnormal,
    }),
    {
      onSuccess: () => {
        toast.success('Test results uploaded');
        navigate('/lab');
      },
    }
  );

  const uploadFile = useMutation(
    () => LabService.uploadResultFile(Number(id), resultFile!, resultText),
    {
      onSuccess: () => {
        toast.success('File uploaded successfully');
        navigate('/lab');
      },
    }
  );

  const handleSubmit = () => {
    if (resultFile) {
      uploadFile.mutate();
    } else {
      uploadResults.mutate();
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Upload Test Results</h1>

      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-medium mb-4">Test Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Test Name</p>
            <p className="font-medium">{test?.test_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Patient</p>
            <p className="font-medium">{test?.patient?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Doctor</p>
            <p className="font-medium">Dr. {test?.doctor?.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Requested Date</p>
            <p className="font-medium">
              {test && new Date(test.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Result / Observations
          </label>
          <textarea
            value={resultText}
            onChange={(e) => setResultText(e.target.value)}
            rows={6}
            className="w-full border rounded-md p-3"
            placeholder="Enter detailed test results..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference Range
          </label>
          <input
            type="text"
            value={referenceRange}
            onChange={(e) => setReferenceRange(e.target.value)}
            className="w-full border rounded-md p-2"
            placeholder="e.g., 4.0-6.0 million cells/mcL"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="abnormal"
            checked={isAbnormal}
            onChange={(e) => setIsAbnormal(e.target.checked)}
            className="h-4 w-4 text-primary-600 rounded"
          />
          <label htmlFor="abnormal" className="ml-2 text-sm text-gray-700">
            Mark as abnormal (outside reference range)
          </label>
        </div>

        <div className="border-t pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload Report File (PDF/Image)
          </label>
          <input
            type="file"
            onChange={(e) => setResultFile(e.target.files?.[0] || null)}
            accept=".pdf,.jpg,.jpeg,.png"
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            PDF, JPG, or PNG (max 10MB)
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => navigate('/lab')}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!resultText && !resultFile}
          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 disabled:opacity-50"
        >
          Submit Results
        </button>
      </div>
    </div>
  );
};

export default TestResults;