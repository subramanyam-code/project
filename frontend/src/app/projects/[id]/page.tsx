'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { projectService, userService } from '@/services/api.service';
import { useRbac } from '@/hooks/use-rbac';
import type { ProjectDetail, UserListItem } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  on_hold: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300',
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  medium: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300',
  high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300',
  critical: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
};

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isManager, isSuperAdmin, isCompanyAdmin } = useRbac();
  const canManage = isManager || isSuperAdmin || isCompanyAdmin;

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [availableUsers, setAvailableUsers] = useState<UserListItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [addingMember, setAddingMember] = useState(false);
  const [removingMember, setRemovingMember] = useState<string | null>(null);

  const fetchProject = async () => {
    try {
      const p = await projectService.get(id);
      setProject(p);
    } catch { setError('Project not found.'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    fetchProject();
    if (canManage) userService.list({ page_size: 200 }).then(r => setAvailableUsers(r.items)).catch(() => {});
  }, [id]);

  const handleAddMember = async () => {
    if (!selectedUserId || !project) return;
    setAddingMember(true);
    try { const updated = await projectService.addMembers(project.id, [selectedUserId]); setProject(updated); setSelectedUserId(''); }
    catch { alert('Failed to add member.'); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project || !window.confirm('Remove this member from the project?')) return;
    setRemovingMember(userId);
    try { await projectService.removeMember(project.id, userId); fetchProject(); }
    catch { alert('Failed to remove member.'); }
    finally { setRemovingMember(null); }
  };

  const handleDelete = async () => {
    if (!project || !window.confirm(`Delete "${project.project_name}"? This cannot be undone.`)) return;
    try { await projectService.delete(project.id); router.push('/projects'); }
    catch { alert('Failed to delete.'); }
  };

  if (loading) return (
    <ProtectedLayout>
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
        <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </ProtectedLayout>
  );

  if (error || !project) return (
    <ProtectedLayout>
      <div className="text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 font-medium">{error || 'Project not found'}</p>
        <Link href="/projects"><Button variant="secondary" className="mt-4">Back to Projects</Button></Link>
      </div>
    </ProtectedLayout>
  );

  const pct = Math.min(100, Number(project.progress_percentage) || 0);
  const memberIds = new Set(project.members.map(m => m.user_id));
  const nonMembers = availableUsers.filter(u => !memberIds.has(u.id));

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400">Projects</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 dark:text-white font-medium truncate max-w-xs">{project.project_name}</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{project.project_name}</h1>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>{project.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[project.priority]}`}>{project.priority.replace(/\b\w/g, c => c.toUpperCase())}</span>
            </div>
            {project.description && <p className="text-gray-600 dark:text-gray-400">{project.description}</p>}
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}/edit`}><Button variant="secondary" size="sm">Edit</Button></Link>
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Progress', value: `${pct}%`, icon: '📊' },
            { label: 'Members', value: project.member_count, icon: '👥' },
            { label: 'Start Date', value: project.start_date ? new Date(project.start_date).toLocaleDateString() : 'Not set', icon: '📅' },
            { label: 'End Date', value: project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Not set', icon: '🏁' },
          ].map(s => (
            <Card key={s.label} className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        {/* Progress bar */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overall Progress</p>
            <span className="text-sm font-bold text-gray-900 dark:text-white">{pct}%</span>
          </div>
          <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div className={`h-3 rounded-full transition-all ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
          </div>
        </Card>

        {/* Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader title="Project Info" />
            <CardBody className="space-y-3">
              {[
                { label: 'Manager', value: project.manager ? `${project.manager.first_name} ${project.manager.last_name}` : 'Not assigned' },
                { label: 'Status', value: project.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) },
                { label: 'Priority', value: project.priority.replace(/\b\w/g, c => c.toUpperCase()) },
                { label: 'Created', value: new Date(project.created_at).toLocaleDateString() },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{item.label}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.value}</span>
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader title={`Team Members (${project.member_count})`} />
            <CardBody className="space-y-3">
              {project.members.length === 0 ? (
                <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No members yet</p>
              ) : project.members.map(m => (
                <div key={m.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-xs font-bold">
                      {m.user?.first_name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{m.user?.first_name} {m.user?.last_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{m.role_in_project ?? 'member'}</p>
                    </div>
                  </div>
                  {canManage && (
                    <button onClick={() => handleRemoveMember(m.user_id)} disabled={removingMember === m.user_id}
                      className="text-xs text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50">
                      {removingMember === m.user_id ? '…' : 'Remove'}
                    </button>
                  )}
                </div>
              ))}
              {canManage && nonMembers.length > 0 && (
                <div className="flex gap-2 pt-2">
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Add member —</option>
                    {nonMembers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
                  </select>
                  <Button variant="primary" size="sm" onClick={handleAddMember} loading={addingMember} disabled={!selectedUserId}>Add</Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </ProtectedLayout>
  );
}
