// src/pages/Unauthorized.tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-lg sm:px-10 text-center">
          <div className="flex justify-center">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldExclamationIcon className="h-12 w-12 text-red-600" />
            </div>
          </div>
          
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Access Denied</h2>
          
          <div className="mt-4">
            <p className="text-gray-600">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              If you believe this is an error, please contact your clinic administrator.
            </p>
          </div>

          <div className="mt-8 space-y-3">
            <button
              onClick={() => navigate(-1)}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Go Back
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700"
            >
              Go to Dashboard
            </button>
          </div>

          {/* Help Section */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-900">Need Help?</h3>
            <div className="mt-2 text-sm text-gray-600">
              <p>Contact your clinic administrator or</p>
              <a href="mailto:support@clinicflow.com" className="text-primary-600 hover:underline">
                email support
              </a>
            </div>
          </div>
        </div>

        {/* Role Information */}
        <div className="mt-4 bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800">Required Access Level</h4>
          <p className="mt-1 text-xs text-blue-700">
            This page requires specific role permissions. Please login with an account that has the necessary access rights.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;