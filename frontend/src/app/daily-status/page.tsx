'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { statusService, projectService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import type { DailyStatus, Project } from '@/types';

const TASK_STATUSES = ['not_started', 'in_progress', 'completed', 'blocked'] as const;
const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700', blocked: 'bg-red-100 text-red-700',
};

interface Form { project_id: string; task_title: string; description: string; status: string; hours_worked: string; blockers: string; tomorrow_plan: string }
const EMPTY: Form = { project_id: '', task_title: '', description: '', status: 'in_progress', hours_worked: '0', blockers: '', tomorrow_plan: '' };

export default function DailyStatusPage() {
  const { user } = useAuth();
  const [today, setToday] = useState<DailyStatus | null>(null);
  const [history, setHistory] = useState<DailyStatus[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Form & { general: string }>>({});
  const PAGE = 7;
  const todayDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [todayStatus, hist, projs] = await Promise.all([
        statusService.today(),
        statusService.list({ page: historyPage, page_size: PAGE }),
        projectService.my().catch(() => [] as Project[]),
      ]);
      setToday(todayStatus);
      setHistory(hist.items);
      setHistoryTotal(hist.total);
      setProjects(projs);
      if (todayStatus) {
        setForm({ project_id: todayStatus.project_id, task_title: todayStatus.task_title, description: todayStatus.description ?? '', status: todayStatus.status, hours_worked: String(todayStatus.hours_worked), blockers: todayStatus.blockers ?? '', tomorrow_plan: todayStatus.tomorrow_plan ?? '' });
      }
    } catch { } finally { setLoading(false); }
  }, [historyPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const set = (field: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(er => { const n = { ...er }; delete n[field]; delete n.general; return n; });
  };

  const validate = () => {
    const e: Partial<Form & { general: string }> = {};
    if (!form.project_id) e.project_id = 'Select a project';
    if (!form.task_title.trim()) e.task_title = 'Task title is required';
    else if (form.task_title.length < 3) e.task_title = 'At least 3 characters';
    const h = Number(form.hours_worked);
    if (isNaN(h) || h < 0 || h > 24) e.hours_worked = 'Must be 0–24';
    if (form.status === 'blocked' && !form.blockers.trim()) e.blockers = 'Please describe the blocker';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { project_id: form.project_id, task_title: form.task_title.trim(), description: form.description.trim() || null, status: form.status, hours_worked: Number(form.hours_worked), blockers: form.blockers.trim() || null, tomorrow_plan: form.tomorrow_plan.trim() || null };
      if (today) await statusService.update(today.id, payload);
      else await statusService.submit(payload);
      setEditing(false);
      fetchData();
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.detail ?? 'Failed to save status.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!today || !window.confirm("Delete today's status?")) return;
    try { await statusService.delete(today.id); setToday(null); setForm(EMPTY); setEditing(false); fetchData(); }
    catch { alert('Failed to delete.'); }
  };

  const totalPages = Math.ceil(historyTotal / PAGE);

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Status</h1>
            <p className="text-sm text-gray-500">{todayDate}</p>
          </div>
          {today && !editing && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>Edit Today's Status</Button>
              <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
            </div>
          )}
        </div>

        {/* Today's Status Card */}
        {loading ? (
          <Card className="p-6"><div className="animate-pulse space-y-3"><div className="h-4 bg-gray-200 rounded w-1/3" /><div className="h-4 bg-gray-100 rounded w-2/3" /></div></Card>
        ) : !today || editing ? (
          <Card>
            <CardHeader title={today ? "Edit Today's Status" : "Submit Today's Status"} subtitle={today ? "Update your progress for today" : "How did your day go?"} />
            <CardBody>
              {errors.general && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.general}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project <span className="text-red-500">*</span></label>
                    <select value={form.project_id} onChange={set('project_id')}
                      className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.project_id ? 'border-red-400' : 'border-gray-300'}`}>
                      <option value="">— Select Project —</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.project_name}</option>)}
                    </select>
                    {errors.project_id && <p className="text-xs text-red-600 mt-1">{errors.project_id}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Status <span className="text-red-500">*</span></label>
                    <select value={form.status} onChange={set('status')} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                      {TASK_STATUSES.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                  <input value={form.task_title} onChange={set('task_title')} placeholder="What did you work on today?" maxLength={500}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.task_title ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.task_title && <p className="text-xs text-red-600 mt-1">{errors.task_title}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={3} placeholder="Detailed description of work done…"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hours Worked</label>
                  <div className="flex items-center gap-3">
                    <input type="range" min={0} max={12} step={0.5} value={form.hours_worked} onChange={set('hours_worked')} className="flex-1 accent-blue-600" />
                    <div className="flex items-center gap-1">
                      <input type="number" min={0} max={24} step={0.5} value={form.hours_worked} onChange={set('hours_worked')} className={`w-16 px-2 py-1.5 border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.hours_worked ? 'border-red-400' : 'border-gray-300'}`} />
                      <span className="text-sm text-gray-500">hrs</span>
                    </div>
                  </div>
                  {errors.hours_worked && <p className="text-xs text-red-600 mt-1">{errors.hours_worked}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Blockers {form.status === 'blocked' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea value={form.blockers} onChange={set('blockers')} rows={2} placeholder="Any issues blocking your progress? (leave blank if none)"
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none ${errors.blockers ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.blockers && <p className="text-xs text-red-600 mt-1">{errors.blockers}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tomorrow's Plan</label>
                  <textarea value={form.tomorrow_plan} onChange={set('tomorrow_plan')} rows={2} placeholder="What do you plan to work on tomorrow?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex items-center justify-between pt-2">
                  {editing ? (
                    <Button type="button" variant="secondary" onClick={() => { setEditing(false); }}>Cancel</Button>
                  ) : <span />}
                  <Button type="submit" variant="primary" loading={saving}>{saving ? 'Saving…' : today ? 'Update Status' : 'Submit Status'}</Button>
                </div>
              </form>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardHeader title="Today's Status" subtitle={`Submitted for ${new Date().toLocaleDateString()}`} />
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Status</p><span className={`inline-flex mt-1 items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[today.status]}`}>{today.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></div>
                <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Hours</p><p className="text-lg font-bold text-gray-900 mt-1">{today.hours_worked}h</p></div>
                <div className="p-3 bg-gray-50 rounded-lg col-span-2"><p className="text-xs text-gray-500">Task</p><p className="text-sm font-medium text-gray-900 mt-1 truncate">{today.task_title}</p></div>
              </div>
              {today.description && <div><p className="text-xs font-medium text-gray-500 mb-1">Description</p><p className="text-sm text-gray-700">{today.description}</p></div>}
              {today.blockers && <div className="p-3 bg-red-50 border border-red-100 rounded-lg"><p className="text-xs font-medium text-red-600 mb-1">🚧 Blockers</p><p className="text-sm text-red-700">{today.blockers}</p></div>}
              {today.tomorrow_plan && <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg"><p className="text-xs font-medium text-blue-600 mb-1">📅 Tomorrow's Plan</p><p className="text-sm text-blue-700">{today.tomorrow_plan}</p></div>}
            </CardBody>
          </Card>
        )}

        {/* History */}
        <Card>
          <CardHeader title="Status History" subtitle="Your previous daily status submissions" />
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Date', 'Project', 'Task', 'Status', 'Hours', 'Blockers'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400 text-sm">No status history yet</td></tr>
                ) : history.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">{new Date(s.submit_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{projects.find(p => p.id === s.project_id)?.project_name ?? '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-[200px] truncate">{s.task_title}</td>
                    <td className="px-6 py-4"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[s.status]}`}>{s.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{s.hours_worked}h</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-[150px] truncate">{s.blockers || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">{((historyPage - 1) * PAGE) + 1}–{Math.min(historyPage * PAGE, historyTotal)} of {historyTotal}</p>
              <div className="flex gap-2">
                <button onClick={() => setHistoryPage(p => p - 1)} disabled={historyPage === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <button onClick={() => setHistoryPage(p => p + 1)} disabled={historyPage === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ProtectedLayout>
  );
}
