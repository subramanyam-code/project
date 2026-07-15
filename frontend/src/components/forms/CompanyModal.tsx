'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/api.service';
import { Company } from '@/types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Dialog } from '@/components/common/Dialog';

interface CompanyModalProps {
  company: Company | null;
  onClose: () => void;
}

export function CompanyModal({ company, onClose }: CompanyModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    company_name: '',
    domain: '',
    email: '',
    phone: '',
    address: '',
    is_active: true,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name ?? company.name ?? '',
        domain: company.domain ?? '',
        email: company.email ?? '',
        phone: company.phone ?? '',
        address: company.address ?? '',
        is_active: company.is_active,
      });
    }
  }, [company]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) =>
      company
        ? companyService.update(company.id, data)
        : companyService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save company');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate(formData);
  };

  return (
    <Dialog isOpen={true} onClose={onClose} title={company ? 'Edit Company' : 'Add Company'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
        )}

        <Input
          label="Company Name"
          value={formData.company_name}
          onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
          required
        />
        <Input
          label="Domain"
          value={formData.domain}
          onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
          placeholder="example.com"
        />
        <Input
          label="Email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        <Input
          label="Phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
        <Input
          label="Address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
            className="mr-2"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active
          </label>
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={mutation.isPending}>
            {company ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
