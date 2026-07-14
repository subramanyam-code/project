'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { projectService, userService } from '@/services/api.service';
import type { UserListItem } from '@/types';

export default function EditProjectPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [managers, setManagers] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ project_name: '', description: '', status: 'not_started', priority: 'medium', start_date: '', end_date: '', progress_percentage: '0', manager_id: '' });

  useEffect(() => {
    Promise.all([projectService.get(id), userService.list({ page_size: 200 })]).then(([p, u]) => {
      setForm({ project_name: p.project_name, description: p.description ?? '', status: p.status, priority: p.priority, start_date: p.start_date ?? '', end_date: p.end_date ?? '', progress_percentage: p.progress_percentage, manager_id: p.manager_id ?? '' });
      setManagers(u.items);
    }).catch(() => setErrors({ general: 'Failed to load project.' })).finally(() => setLoading(false));
  }, [id]);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => { const n = { ...er }; delete n[field]; delete n.general; return n; });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.project_name.trim()) e.project_name = 'Project name is required';
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
      await projectService.update(id, { project_name: form.project_name.trim(), description: form.description.trim() || null, status: form.status, priority: form.priority, progress_percentage: form.progress_percentage, start_date: form.start_date || null, end_date: form.end_date || null, manager_id: form.manager_id || null });
      router.push(`/projects/${id}`);
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.detail ?? 'Failed to save.' });
    } finally { setSaving(false); }
  };

  if (loading) return <ProtectedLayout><div className="animate-pulse space-y-4"><div className="h-8 bg-gray-200 rounded w-1/3" /><div className="h-48 bg-gray-100 rounded" /></div></ProtectedLayout>;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          <Link href="/projects" className="hover:text-blue-600">Projects</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <Link href={`/projects/${id}`} className="hover:text-blue-600 truncate max-w-xs">{form.project_name}</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-gray-900 font-medium">Edit</span>
        </nav>

        <form onSubmit={handleSubmit} noValidate className="space-y-6">
          {errors.general && <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.general}</div>}

          <Card>
            <CardHeader title="Edit Project Details" />
            <CardBody className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Name <span className="text-red-500">*</span></label>
                <input value={form.project_name} onChange={set('project_name')} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.project_name ? 'border-red-400' : 'border-gray-300'}`} />
                {errors.project_name && <p className="text-xs text-red-600 mt-1">{errors.project_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={set('description')} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={form.status} onChange={set('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['not_started','in_progress','on_hold','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select value={form.priority} onChange={set('priority')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {['low','medium','high','critical'].map(p => <option key={p} value={p}>{p.replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={form.start_date} onChange={set('start_date')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={form.end_date} onChange={set('end_date')} className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.end_date ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.end_date && <p className="text-xs text-red-600 mt-1">{errors.end_date}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Progress ({form.progress_percentage}%)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min={0} max={100} step={5} value={form.progress_percentage} onChange={set('progress_percentage')} className="flex-1 accent-blue-600" />
                  <input type="number" min={0} max={100} value={form.progress_percentage} onChange={set('progress_percentage')} className="w-16 px-2 py-1.5 border border-gray-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mt-2 bg-gray-200 rounded-full h-2"><div className="bg-blue-500 h-2 rounded-full transition-all" style={{ width: `${Math.min(100, Number(form.progress_percentage) || 0)}%` }} /></div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
                <select value={form.manager_id} onChange={set('manager_id')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— None —</option>
                  {managers.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}{u.job_title ? ` — ${u.job_title}` : ''}</option>)}
                </select>
              </div>
            </CardBody>
          </Card>

          <div className="flex items-center justify-between pb-8">
            <Link href={`/projects/${id}`}><Button type="button" variant="secondary">Cancel</Button></Link>
            <Button type="submit" variant="primary" loading={saving}>{saving ? 'Saving…' : 'Save Changes'}</Button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
