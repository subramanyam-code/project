'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Table } from '@/components/common/Table';
import { CompanyModal } from '@/components/forms/CompanyModal';
import { apiService } from '@/services/api.service';
import { Company } from '@/types';
import { useRBAC } from '@/hooks/use-rbac';

export default function CompaniesPage() {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiService.get<Company[]>('/companies'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiService.delete(`/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });

  const canCreate = hasPermission(['super_admin']);
  const canEdit = hasPermission(['super_admin']);
  const canDelete = hasPermission(['super_admin']);

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this company?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Company Name' },
    { key: 'domain', label: 'Domain' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    {
      key: 'is_active',
      label: 'Status',
      render: (company: Company) => (
        <span
          className={`px-2 py-1 rounded text-xs ${
            company.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {company.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (company: Company) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleEdit(company)}
            >
              Edit
            </Button>
          )}
          {canDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => handleDelete(company.id)}
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <ProtectedLayout requiredPermissions={['super_admin']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
          {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>
              Add Company
            </Button>
          )}
        </div>

        <Card>
          {isLoading ? (
            <div className="text-center py-8">Loading companies...</div>
          ) : (
            <Table
              data={companies || []}
              columns={columns}
            />
          )}
        </Card>

        {isModalOpen && (
          <CompanyModal
            company={editingCompany}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </ProtectedLayout>
  );
}
