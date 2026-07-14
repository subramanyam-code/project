'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Table } from '@/components/common/Table';
import { DepartmentModal } from '@/components/forms/DepartmentModal';
import { apiService } from '@/services/api.service';
import { Department } from '@/types';
import { useRBAC } from '@/hooks/use-rbac';

export default function DepartmentsPage() {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const { data: departments, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.get<Department[]>('/departments'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
    },
  });

  const canCreate = hasPermission(['super_admin', 'company_admin']);
  const canEdit = hasPermission(['super_admin', 'company_admin']);
  const canDelete = hasPermission(['super_admin', 'company_admin']);

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingDepartment(null);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Department Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'company',
      label: 'Company',
      render: (dept: Department) => dept.company?.name || 'N/A',
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (dept: Department) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            dept.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {dept.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (dept: Department) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEdit(dept)}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(dept.id)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedLayout requiredPermissions={['super_admin', 'company_admin']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Departments</h1>
          {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
              Add Department
            </Button>
          )}
        </div>

        <Card>
          {isLoading ? (
            <div className="text-center py-8">Loading departments...</div>
          ) : (
            <Table
              data={departments || []}
              columns={columns}
            />
          )}
        </Card>

        {isModalOpen && (
          <DepartmentModal
            department={editingDepartment}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </ProtectedLayout>
  );
}
