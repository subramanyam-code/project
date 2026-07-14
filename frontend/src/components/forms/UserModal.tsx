'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { User, Department, Role, Company } from '@/types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Dialog } from '@/components/common/Dialog';

interface UserModalProps {
  user: User | null;
  onClose: () => void;
}

export function UserModal({ user, onClose }: UserModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    employee_id: '',
    phone: '',
    password: '',
    role_id: '',
    department_id: '',
    company_id: '',
    is_active: true,
  });
  const [error, setError] = useState('');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.get<Department[]>('/departments'),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => apiService.get<Role[]>('/roles'),
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: () => apiService.get<Company[]>('/companies'),
  });

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email,
        full_name: user.full_name,
        employee_id: user.employee_id || '',
        phone: user.phone || '',
        password: '',
        role_id: user.role_id?.toString() || '',
        department_id: user.department_id?.toString() || '',
        company_id: user.company_id?.toString() || '',
        is_active: user.is_active,
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      user
        ? apiService.patch(`/users/${user.id}`, data)
        : apiService.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save user');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const payload: any = {
      ...formData,
      role_id: parseInt(formData.role_id),
      department_id: formData.department_id ? parseInt(formData.department_id) : null,
      company_id: formData.company_id ? parseInt(formData.company_id) : null,
    };

    // Don't send password if it's empty during edit
    if (user && !formData.password) {
      delete payload.password;
    }

    mutation.mutate(payload);
  };

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={user ? 'Edit User' : 'Add User'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Input
          label="Full Name"
          value={formData.full_name}
          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          required
        />

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />

        <Input
          label="Employee ID"
          value={formData.employee_id}
          onChange={(e) =>
            setFormData({ ...formData, employee_id: e.target.value })
          }
        />

        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />

        <Input
          label={user ? 'Password (leave blank to keep current)' : 'Password'}
          type="password"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          required={!user}
        />

        <Select
          label="Role"
          value={formData.role_id}
          onChange={(e) => setFormData({ ...formData, role_id: e.target.value })}
          required
        >
          <option value="">Select Role</option>
          {roles?.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </Select>

        <Select
          label="Company"
          value={formData.company_id}
          onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
        >
          <option value="">Select Company</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </Select>

        <Select
          label="Department"
          value={formData.department_id}
          onChange={(e) =>
            setFormData({ ...formData, department_id: e.target.value })
          }
        >
          <option value="">Select Department</option>
          {departments?.map((dept) => (
            <option key={dept.id} value={dept.id}>
              {dept.name}
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
            {user ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
