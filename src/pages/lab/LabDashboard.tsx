// src/pages/lab/LabDashboard.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { LabService } from '../../services/api/lab.service';
import { useWebSocket } from '../../hooks/useWebSocket';
import StatusBadge from '../../components/common/StatusBadge';
import toast from 'react-hot-toast';

const LabDashboard: React.FC = () => {
  const [selectedTest, setSelectedTest] = useState<any>(null);
  const [resultText, setResultText] = useState('');
  const [resultFile, setResultFile] = useState<File | null>(null);

  // Fetch pending tests
  const { data: pendingTests, refetch } = useQuery(
    'pendingLabTests',
    () => LabService.getPendingTests()
  );

  // Real-time updates for new test requests
  useWebSocket('appointment_update', (data) => {
    if (data.type === 'lab_requested') {
      toast.info('New lab test requested');
      refetch();
    }
  });

  // Update test results mutation
  const updateResults = useMutation(
    ({ testId, data }: { testId: number; data: any }) =>
      LabService.updateTestResults(testId, data),
    {
      onSuccess: () => {
        toast.success('Test results uploaded');
        setSelectedTest(null);
        refetch();
      },
    }
  );

  const handleSubmitResults = () => {
    if (!selectedTest) return;

    if (resultFile) {
      LabService.uploadResultFile(selectedTest.id, resultFile, resultText).then(() => {
        toast.success('Results uploaded successfully');
        setSelectedTest(null);
        refetch();
      });
    } else {
      updateResults.mutate({
        testId: selectedTest.id,
        data: {
          status: 'completed',
          result_text: resultText,
        },
      });
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Laboratory Dashboard</h1>

      <div className="grid grid-cols-3 gap-6">
        {/* Pending Tests List */}
        <div className="col-span-1 bg-white rounded-lg shadow p-4">
          <h2 className="text-lg font-semibold mb-4">Pending Tests</h2>
          <div className="space-y-3">
            {pendingTests?.map((test: any) => (
              <div
                key={test.id}
                onClick={() => setSelectedTest(test)}
                className={`p-3 border rounded-lg cursor-pointer ${
                  selectedTest?.id === test.id
                    ? 'border-primary-500 bg-primary-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="font-medium">{test.test_name}</div>
                <div className="text-sm text-gray-600">
                  Patient: {test.patient?.name}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <StatusBadge status={test.priority} variant="warning" />
                  <span className="text-xs text-gray-500">
                    {new Date(test.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Test Results Entry */}
        <div className="col-span-2 bg-white rounded-lg shadow p-4">
          {selectedTest ? (
            <>
              <h2 className="text-lg font-semibold mb-4">
                Enter Results: {selectedTest.test_name}
              </h2>

              <div className="space-y-4">
                {/* Patient Info */}
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p><span className="font-medium">Patient:</span> {selectedTest.patient?.name}</p>
                  <p><span className="font-medium">Requested by:</span> Dr. {selectedTest.doctor?.name}</p>
                  <p><span className="font-medium">Date:</span> {new Date(selectedTest.created_at).toLocaleString()}</p>
                </div>

                {/* Result Text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Result / Observations
                  </label>
                  <textarea
                    value={resultText}
                    onChange={(e) => setResultText(e.target.value)}
                    rows={5}
                    className="mt-1 block w-full border rounded-md shadow-sm p-2"
                    placeholder="Enter test results..."
                  />
                </div>

                {/* Reference Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Reference Range (optional)
                  </label>
                  <input
                    type="text"
                    className="mt-1 block w-full border rounded-md shadow-sm p-2"
                    placeholder="e.g., 4.0-6.0 million cells/mcL"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Upload Report (PDF/Image)
                  </label>
                  <input
                    type="file"
                    onChange={(e) => setResultFile(e.target.files?.[0] || null)}
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="mt-1 block w-full"
                  />
                </div>

                {/* Abnormal Flag */}
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="abnormal"
                    className="h-4 w-4 text-primary-600 rounded"
                  />
                  <label htmlFor="abnormal" className="ml-2 text-sm text-gray-700">
                    Mark as abnormal
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleSubmitResults}
                    disabled={!resultText && !resultFile}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    Submit Results
                  </button>
                  <button
                    onClick={() => setSelectedTest(null)}
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-12">
              Select a test to enter results
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabDashboard;