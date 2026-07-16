'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { projectService, userService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import type { UserListItem } from '@/types';

export default function CreateProjectPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [managers, setManagers] = useState<UserListItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    project_name: '', description: '', status: 'not_started', priority: 'medium',
    start_date: '', end_date: '', progress_percentage: '0', manager_id: '',
  });

  useEffect(() => {
    userService.list({ page_size: 200 }).then(r => { setManagers(r.items); if (user) setForm(f => ({ ...f, manager_id: user.id })); }).catch(() => {});
  }, [user]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => { const n = { ...er }; delete n[field]; delete n.general; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.project_name.trim()) e.project_name = 'Project name is required';
    else if (form.project_name.length < 3) e.project_name = 'At least 3 characters';
    const pct = Number(form.progress_percentage);
    if (isNaN(pct) || pct < 0 || pct > 100) e.progress_percentage = 'Must be 0–100';
    if (form.start_date && form.end_date && form.start_date > form.end_date) e.end_date = 'End date must be after start date';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const project = await projectService.create({
        project_name: form.project_name.trim(), description: form.description.trim() || null,
        status: form.status, priority: form.priority, progress_percentage: form.progress_percentage,
        start_date: form.start_date || null, end_date: form.end_date || null, manager_id: form.manager_id || null,
      });
      router.push(`/projects/${project.id}`);
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.detail ?? 'Failed to create project.' });
    } finally { setSaving(false); }
  };

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
          <Link href="/projects" className="hover:text-blue-600 dark:hover:text-blue-400">Projects</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 dark:text-white font-medium">New Project</span>
        </nav>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6">
            {errors.general && (
              <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <p className="text-sm text-red-700 dark:text-red-400">{errors.general}</p>
              </div>
            )}

            <Card>
              <CardHeader title="Project Details" subtitle="Basic information about the project" />
              <CardBody className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Name <span className="text-red-500">*</span></label>
                  <input value={form.project_name} onChange={set('project_name')} placeholder="e.g. Website Redesign Q3" maxLength={255}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.project_name ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}`} />
                  <div className="flex justify-between mt-1">
                    {errors.project_name ? <p className="text-xs text-red-600 dark:text-red-400">{errors.project_name}</p> : <span />}
                    <span className="text-xs text-gray-400 dark:text-gray-500">{form.project_name.length}/255</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={4} maxLength={2000} placeholder="Project goals, scope, and deliverables…"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                  <div className="text-right mt-1"><span className="text-xs text-gray-400 dark:text-gray-500">{form.description.length}/2000</span></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select value={form.status} onChange={set('status')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['not_started','in_progress','on_hold','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                    <select value={form.priority} onChange={set('priority')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Timeline & Progress" subtitle="Set project dates and current progress" />
              <CardBody className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input type="date" value={form.start_date} onChange={set('start_date')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input type="date" value={form.end_date} onChange={set('end_date')} min={form.start_date || undefined}
                      className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.end_date ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`} />
                    {errors.end_date && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.end_date}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Initial Progress (%)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min={0} max={100} step={5} value={form.progress_percentage} onChange={set('progress_percentage')} className="flex-1 accent-blue-600" />
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={100} value={form.progress_percentage} onChange={set('progress_percentage')}
                        className={`w-16 px-2 py-1.5 border rounded-lg text-sm text-center bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.progress_percentage ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`} />
                      <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
                    </div>
                  </div>
                  <div className="mt-2 bg-gray-200 dark:bg-gray-700 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Number(form.progress_percentage) || 0)}%` }} /></div>
                  {errors.progress_percentage && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.progress_percentage}</p>}
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Team Assignment" subtitle="Assign a project manager" />
              <CardBody>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Project Manager</label>
                  <select value={form.manager_id} onChange={set('manager_id')} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">— Select a manager (optional) —</option>
                    {managers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}{u.job_title ? ` — ${u.job_title}` : ''}{u.id === user?.id ? ' (You)' : ''}</option>)}
                  </select>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">You can add team members after creating the project.</p>
                </div>
              </CardBody>
            </Card>

            <div className="flex items-center justify-between pb-8">
              <Link href="/projects"><Button type="button" variant="secondary">Cancel</Button></Link>
              <Button type="submit" variant="primary" loading={saving} size="md">{saving ? 'Creating…' : 'Create Project'}</Button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
