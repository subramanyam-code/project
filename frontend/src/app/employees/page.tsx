'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Table } from '@/components/common/Table';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { UserModal } from '@/components/forms/UserModal';
import { apiService } from '@/services/api.service';
import { User } from '@/types';
import { useRBAC } from '@/hooks/use-rbac';

export default function EmployeesPage() {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', searchTerm, filterRole],
    queryFn: () => apiService.get<User[]>('/users', {
      params: { search: searchTerm, role: filterRole },
    }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  const canCreate = hasPermission(['super_admin', 'company_admin']);
  const canEdit = hasPermission(['super_admin', 'company_admin', 'project_manager']);
  const canDelete = hasPermission(['super_admin', 'company_admin']);

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    {
      key: 'full_name',
      label: 'Name',
      render: (user: User) => (
        <div>
          <div className="font-medium">{user.full_name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
        </div>
      ),
    },
    { key: 'employee_id', label: 'Employee ID' },
    {
      key: 'role',
      label: 'Role',
      render: (user: User) => user.role?.name || 'N/A',
    },
    {
      key: 'department',
      label: 'Department',
      render: (user: User) => user.department?.name || 'N/A',
    },
    {
      key: 'teams',
      label: 'Teams',
      render: (user: User) => user.teams?.map(t => t.name).join(', ') || 'None',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (user: User) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            user.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {user.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (user: User) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEdit(user)}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(user.id)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedLayout requiredPermissions={['super_admin', 'company_admin', 'project_manager', 'team_lead']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
          {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
              Add Employee
            </Button>
          )}
        </div>

        <Card className="mb-4">
          <div className="flex gap-4 p-4">
            <div className="flex-1">
              <Input
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-64">
              <Select
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="company_admin">Company Admin</option>
                <option value="project_manager">Project Manager</option>
                <option value="team_lead">Team Lead</option>
                <option value="employee">Employee</option>
              </Select>
            </div>
          </div>
        </Card>

        <Card>
          {isLoading ? (
            <div className="text-center py-8">Loading employees...</div>
          ) : (
            <Table
              data={users || []}
              columns={columns}
            />
          )}
        </Card>

        {isModalOpen && (
          <UserModal
            user={editingUser}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </ProtectedLayout>
  );
}
