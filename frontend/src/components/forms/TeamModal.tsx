'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiService } from '@/services/api.service';
import { Team, Department, User } from '@/types';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import { Dialog } from '@/components/common/Dialog';
import { Textarea } from '@/components/common/Textarea';

interface TeamModalProps {
  team: Team | null;
  onClose: () => void;
}

export function TeamModal({ team, onClose }: TeamModalProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    department_id: '',
    team_lead_id: '',
    is_active: true,
  });
  const [error, setError] = useState('');

  const { data: departments } = useQuery({
    queryKey: ['departments'],
    queryFn: () => apiService.get<Department[]>('/departments'),
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => apiService.get<User[]>('/users'),
  });

  useEffect(() => {
    if (team) {
      setFormData({
        name: team.name,
        description: team.description || '',
        department_id: team.department_id?.toString() || '',
        team_lead_id: team.team_lead_id?.toString() || '',
        is_active: team.is_active,
      });
    }
  }, [team]);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      team
        ? apiService.patch(`/teams/${team.id}`, data)
        : apiService.post('/teams', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
      onClose();
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to save team');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    mutation.mutate({
      ...formData,
      department_id: formData.department_id ? parseInt(formData.department_id) : null,
      team_lead_id: formData.team_lead_id ? parseInt(formData.team_lead_id) : null,
    });
  };

  const teamLeads = users?.filter(
    (u) =>
      u.role?.name === 'team_lead' ||
      u.role?.name === 'project_manager' ||
      u.role?.name === 'company_admin'
  );

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={team ? 'Edit Team' : 'Add Team'}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Input
          label="Team Name"
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

        <Select
          label="Team Lead"
          value={formData.team_lead_id}
          onChange={(e) =>
            setFormData({ ...formData, team_lead_id: e.target.value })
          }
        >
          <option value="">Select Team Lead</option>
          {teamLeads?.map((user) => (
            <option key={user.id} value={user.id}>
              {user.full_name} ({user.role?.name})
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
            {team ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
