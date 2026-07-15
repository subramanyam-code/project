'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamService, departmentService, userService } from '@/services/api.service';
import { Team, Department, User, UserListItem } from '@/types';
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
    team_name: '',
    description: '',
    department_id: '',
    team_lead_id: '',
    is_active: true,
  });
  const [error, setError] = useState('');

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentService.list(),
  });
  const departments = deptData?.items ?? [];

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => userService.list(),
  });
  const users = usersData?.items ?? [];

  useEffect(() => {
    if (team) {
      setFormData({
        team_name: team.team_name ?? team.name ?? '',
        description: team.description ?? '',
        department_id: team.department_id ?? '',
        team_lead_id: team.team_lead_id ?? '',
        is_active: team.is_active ?? true,
      });
    }
  }, [team]);

  const mutation = useMutation({
    mutationFn: (data: typeof formData) =>
      team
        ? teamService.update(team.id, data)
        : teamService.create(data),
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
    mutation.mutate(formData);
  };

  const getDeptName = (d: Department) => d.department_name ?? d.name ?? '';
  const getUserName = (u: UserListItem) => u.full_name ?? `${u.first_name} ${u.last_name}`;

  const teamLeads = users.filter((u) => {
    const role = u.role?.role_name ?? u.role?.name ?? '';
    return ['team_lead', 'project_manager', 'company_admin'].includes(role);
  });

  return (
    <Dialog isOpen={true} onClose={onClose} title={team ? 'Edit Team' : 'Add Team'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
        )}

        <Input
          label="Team Name"
          value={formData.team_name}
          onChange={(e) => setFormData({ ...formData, team_name: e.target.value })}
          required
        />
        <Textarea
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        />
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
        <Select
          label="Team Lead"
          value={formData.team_lead_id}
          onChange={(e) => setFormData({ ...formData, team_lead_id: e.target.value })}
        >
          <option value="">Select Team Lead</option>
          {teamLeads.map((u) => (
            <option key={u.id} value={u.id}>
              {getUserName(u)} ({u.role?.role_name ?? u.role?.name})
            </option>
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
            {team ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
