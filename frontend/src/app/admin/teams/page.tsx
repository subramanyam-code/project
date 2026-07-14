'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { companyService, departmentService, teamService, userService } from '@/services/api.service';
import type { Company, Department, Team, UserListItem } from '@/types';

interface TeamForm { team_name: string; description: string; department_id: string; team_lead_id: string }
const EMPTY: TeamForm = { team_name: '', description: '', department_id: '', team_lead_id: '' };

export default function TeamsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [teams, setTeams] = useState<Team[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE = 10;
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [selected, setSelected] = useState<Team | null>(null);
  const [form, setForm] = useState<TeamForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<TeamForm & { general: string }>>({});

  useEffect(() => {
    companyService.list({ page_size: 100 }).then(r => { setCompanies(r.items); if (r.items.length) setSelectedCompany(r.items[0].id); }).catch(() => {});
    userService.list({ page_size: 200 }).then(r => setUsers(r.items)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedCompany) return;
    departmentService.list({ company_id: selectedCompany, page_size: 100 }).then(r => { setDepartments(r.items); if (r.items.length) setSelectedDept(r.items[0].id); }).catch(() => {});
  }, [selectedCompany]);

  const fetchTeams = useCallback(async () => {
    if (!selectedDept) return;
    setLoading(true);
    try {
      const r = await teamService.list({ department_id: selectedDept, page, page_size: PAGE });
      setTeams(r.items); setTotal(r.total);
    } catch { setTeams([]); } finally { setLoading(false); }
  }, [selectedDept, page]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const openCreate = () => { setForm({ ...EMPTY, department_id: selectedDept }); setErrors({}); setSelected(null); setModal('create'); };
  const openEdit = (t: Team) => { setSelected(t); setForm({ team_name: t.team_name, description: t.description ?? '', department_id: t.department_id, team_lead_id: t.team_lead_id ?? '' }); setErrors({}); setModal('edit'); };
  const closeModal = () => { setModal(null); setSelected(null); setErrors({}); };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.team_name.trim()) e.team_name = 'Team name is required';
    if (!form.department_id) e.department_id = 'Department is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { team_name: form.team_name.trim(), description: form.description.trim() || null, department_id: form.department_id, team_lead_id: form.team_lead_id || null };
      if (modal === 'edit' && selected) await teamService.update(selected.id, payload);
      else await teamService.create(payload);
      closeModal(); fetchTeams();
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.detail ?? 'Failed to save.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    try { await teamService.delete(id); fetchTeams(); } catch { alert('Failed to delete.'); } finally { setDeleting(null); }
  };

  const totalPages = Math.ceil(total / PAGE);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
              <Link href="/admin" className="hover:text-blue-600">Admin</Link><span>/</span>
              <span className="text-gray-900 font-medium">Teams</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
            <p className="text-sm text-gray-500">{total} team{total !== 1 ? 's' : ''}</p>
          </div>
          {selectedDept && <Button variant="primary" onClick={openCreate}>+ New Team</Button>}
        </div>
        <Card>
          <div className="p-4 flex flex-wrap gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Company</label>
              <select value={selectedCompany} onChange={e => { setSelectedCompany(e.target.value); setSelectedDept(''); setTeams([]); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]">
                <option value="">— Select Company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Department</label>
              <select value={selectedDept} onChange={e => { setSelectedDept(e.target.value); setPage(1); }}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]" disabled={!departments.length}>
                <option value="">— Select Department —</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
              </select>
            </div>
          </div>
        </Card>
        <Card>
          {!selectedDept ? (
            <div className="py-16 text-center text-gray-400">
              <p className="font-medium">Select a company and department to view teams</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>{['Team Name', 'Description', 'Team Lead', 'Department', 'Created', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>
                  )) : teams.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-gray-500 font-medium">No teams yet</p>
                      <Button variant="primary" size="sm" onClick={openCreate} className="mt-3">Create first team</Button>
                    </td></tr>
                  ) : teams.map(t => (
                    <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center font-bold text-sm">{t.team_name[0].toUpperCase()}</div><span className="font-medium text-gray-900">{t.team_name}</span></div></td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">{t.description || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{users.find(u => u.id === t.team_lead_id) ? `${users.find(u => u.id === t.team_lead_id)!.first_name} ${users.find(u => u.id === t.team_lead_id)!.last_name}` : '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{departments.find(d => d.id === t.department_id)?.department_name ?? '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4"><div className="flex items-center gap-2">
                        <button onClick={() => openEdit(t)} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">Edit</button>
                        <button onClick={() => handleDelete(t.id, t.team_name)} disabled={deleting === t.id} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50">{deleting === t.id ? '…' : 'Delete'}</button>
                      </div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">{((page - 1) * PAGE) + 1}–{Math.min(page * PAGE, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </Card>
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 z-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'New Team' : 'Edit Team'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errors.general && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{errors.general}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name <span className="text-red-500">*</span></label>
                <input value={form.team_name} onChange={e => { setForm(f => ({ ...f, team_name: e.target.value })); setErrors(er => ({ ...er, team_name: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.team_name ? 'border-red-400' : 'border-gray-300'}`} placeholder="e.g. Frontend Team" />
                {errors.team_name && <p className="text-xs text-red-600 mt-1">{errors.team_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
                <select value={form.department_id} onChange={e => { setForm(f => ({ ...f, department_id: e.target.value })); setErrors(er => ({ ...er, department_id: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.department_id ? 'border-red-400' : 'border-gray-300'}`}>
                  <option value="">— Select Department —</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                </select>
                {errors.department_id && <p className="text-xs text-red-600 mt-1">{errors.department_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Lead</label>
                <select value={form.team_lead_id} onChange={e => setForm(f => ({ ...f, team_lead_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— None —</option>
                  {users.map(u => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}{u.job_title ? ` — ${u.job_title}` : ''}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Brief description…" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving}>{modal === 'create' ? 'Create' : 'Save Changes'}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
