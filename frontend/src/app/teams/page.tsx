'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Table } from '@/components/common/Table';
import { TeamModal } from '@/components/forms/TeamModal';
import { teamService } from '@/services/api.service';
import { Team } from '@/types';
import { useRBAC } from '@/hooks/use-rbac';

export default function TeamsPage() {
  const { hasPermission } = useRBAC();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamService.list({}), // no department_id filter — list all teams
  });

  const teams = teamsData?.items ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    },
  });

  const canCreate = hasPermission(['super_admin', 'company_admin', 'project_manager']);
  const canEdit = hasPermission(['super_admin', 'company_admin', 'project_manager']);
  const canDelete = hasPermission(['super_admin', 'company_admin']);

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this team?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTeam(null);
  };

  const getTeamLeadName = (team: Team) => {
    const lead = team.team_lead;
    if (!lead) return 'Not Assigned';
    return lead.full_name ?? `${lead.first_name} ${lead.last_name}`;
  };

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'team_name', label: 'Team Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'department',
      label: 'Department',
      render: (team: Team) =>
        team.department?.department_name ?? team.department?.name ?? 'N/A',
    },
    {
      key: 'team_lead',
      label: 'Team Lead',
      render: (team: Team) => getTeamLeadName(team),
    },
    {
      key: 'members_count',
      label: 'Members',
      render: (team: Team) => team.members?.length ?? 0,
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (team: Team) => (
        <span className={`px-2 py-1 rounded text-xs ${team.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {team.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (team: Team) => (
        <div className="flex gap-2">
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={() => handleEdit(team)}>
              Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="danger" size="sm" onClick={() => handleDelete(team.id)}>
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
          <h1 className="text-3xl font-bold text-gray-900">Teams</h1>
          {canCreate && (
            <Button onClick={() => setIsModalOpen(true)}>Add Team</Button>
          )}
        </div>

        <Card>
          {isLoading ? (
            <div className="text-center py-8">Loading teams...</div>
          ) : (
            <Table data={teams} columns={columns} />
          )}
        </Card>

        {isModalOpen && (
          <TeamModal team={editingTeam} onClose={handleCloseModal} />
        )}
      </div>
    </ProtectedLayout>
  );
}
