'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { Department, Company } from '@/types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Dialog } from '@/components/common/Dialog';
import { Textarea } from '@/components/common/Textarea';

interface DepartmentModalProps {
  department: Department | null;
  onClose: () => void;
}

export function DepartmentModal({ department, onClose }: DepartmentModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    company_id: '',
    is_active: true,
  });
  const [error, setError] = useState('');

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiService.get<Company[]>('/companies'),
  });

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name,
        description: department.description || '',
        company_id: department.company_id?.toString() || '',
        is_active: department.is_active,
      });
    }
  }, [department]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      department
        ? apiService.patch(`/departments/${department.id}`, data)
        : apiService.post('/departments', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save department');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({
      ...formData,
      company_id: parseInt(formData.company_id),
    });
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={department ? 'Edit Department' : 'Add Department'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Input
          label="Department Name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
        />

        <Select
          label="Company"
          value={formData.company_id}
          onChange={(e) =>
            setFormData({ ...formData, company_id: e.target.value })
          }
          required
        >
          <option value="">Select Company</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </Select>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
            className="mr-2"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={mutation.isPending}>
            {department ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
