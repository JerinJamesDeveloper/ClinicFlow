// src/pages/admin/UserManagement.tsx
import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { AdminService } from '../../services/api/admin.service';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import SearchBar from '../../components/common/SearchBar';
import { UserPlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const UserManagement: React.FC = () => {
  const [search, setSearch] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  const { data: users, refetch } = useQuery(
    ['users', search],
    () => AdminService.getUsers({search})
  );
  const usersresponse = users?.items || [];

  const deleteUser = useMutation(
    (userId: number) => AdminService.deleteUser(userId),
    {
      onSuccess: () => {
        toast.success('User deleted successfully');
        refetch();
      },
    }
  );

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'email', header: 'Email' },
    { 
      key: 'role', 
      header: 'Role',
      render: (value: string) => (
        <StatusBadge status={value} variant="info" />
      )
    },
    { 
      key: 'is_active', 
      header: 'Status',
      render: (value: boolean) => (
        <StatusBadge 
          status={value ? 'Active' : 'Inactive'} 
          variant={value ? 'success' : 'error'} 
        />
      )
    },
    { 
      key: 'last_login', 
      header: 'Last Login',
      render: (value: string) => value ? new Date(value).toLocaleDateString() : 'Never'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedUser(row)}
            className="text-blue-600 hover:text-blue-800"
          >
            <PencilIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to delete this user?')) {
                deleteUser.mutate(row.id);
              }
            }}
            className="text-red-600 hover:text-red-800"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 flex items-center"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Invite User
        </button>
      </div>

      <SearchBar
        onSearch={setSearch}
        placeholder="Search users by name or email..."
        className="mb-6"
      />

      <DataTable
        columns={columns}
        data={usersresponse || []}
      />

      {/* Invite User Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-lg font-medium mb-4">Invite New User</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className="w-full border rounded-md p-2"
                  placeholder="Enter email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select className="w-full border rounded-md p-2">
                  <option value="doctor">Doctor</option>
                  <option value="lab_staff">Lab Staff</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="receptionist">Receptionist</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="px-4 py-2 border rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                >
                  Send Invite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;