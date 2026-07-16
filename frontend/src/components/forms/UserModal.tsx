'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userService, departmentService, companyService } from '@/services/api.service';
import { User, Department, Company } from '@/types';
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
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    job_title: '',
    password: '',
    department_id: '',
    company_id: '',
    is_active: true,
  });
  const [error, setError] = useState('');

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
  });
  const departments = deptData?.items ?? [];

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userService.roles(),
  });
  const roles = rolesData ?? [];

  const { data: companiesData } = useQuery({
    queryKey: ['companies'],
    queryFn: () => companyService.list(),
  });
  const companies = companiesData?.items ?? [];

  const [selectedRoleId, setSelectedRoleId] = useState('');

  useEffect(() => {
    if (user) {
      const nameParts = (user.full_name ?? '').split(' ');
      setFormData({
        first_name: user.first_name ?? nameParts[0] ?? '',
        last_name: user.last_name ?? nameParts.slice(1).join(' ') ?? '',
        email: user.email,
        phone: user.phone ?? '',
        job_title: user.job_title ?? '',
        password: '',
        department_id: user.department_id ?? '',
        company_id: user.company_id ?? '',
        is_active: user.is_active,
      });
      setSelectedRoleId(user.role_id ?? user.role?.id ?? '');
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      user
        ? userService.update(user.id, data)
        : userService.create(data),
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

    const payload: Record<string, unknown> = {
      ...formData,
      role_id: selectedRoleId || undefined,
      department_id: formData.department_id || undefined,
      company_id: formData.company_id || undefined,
    };

    // Don't send empty password on edit
    if (user && !formData.password) {
      delete payload.password;
    }

    mutation.mutate(payload);
  };

  const getDeptName = (d: Department) => d.department_name ?? d.name ?? '';
  const getCompanyName = (c: Company) => c.company_name ?? c.name ?? '';

  return (
    <Dialog isOpen={true} onClose={onClose} title={user ? 'Edit User' : 'Add User'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
          <Input
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>

        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
        <Input
          label="Job Title"
          value={formData.job_title}
          onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
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
          value={selectedRoleId}
          onChange={(e) => setSelectedRoleId(e.target.value)}
          required
        >
          <option value="">Select Role</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.role_name}
            </option>
          ))}
        </Select>

        <Select
          label="Company"
          value={formData.company_id}
          onChange={(e) => setFormData({ ...formData, company_id: e.target.value })}
        >
          <option value="">Select Company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{getCompanyName(c)}</option>
          ))}
        </Select>

        <Select
          label="Department"
          value={formData.department_id}
          onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
        >
          <option value="">Select Department</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{getDeptName(d)}</option>
          ))}
        </Select>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {user ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
