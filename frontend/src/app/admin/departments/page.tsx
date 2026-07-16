'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { companyService, departmentService } from '@/services/api.service';
import type { Company, Department } from '@/types';

interface DeptForm { department_name: string; description: string; company_id: string }
const EMPTY: DeptForm = { department_name: '', description: '', company_id: '' };

export default function DepartmentsPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const PAGE = 10;

  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [selected, setSelected] = useState<Department | null>(null);
  const [form, setForm] = useState<DeptForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<DeptForm & { general: string }>>({});

  useEffect(() => {
    companyService.list({ page_size: 100 })
      .then(r => { setCompanies(r.items); if (r.items.length) setSelectedCompany(r.items[0].id); })
      .catch(() => {});
  }, []);

  const fetchDepts = useCallback(async () => {
    if (!selectedCompany) return;
    setLoading(true);
    try {
      const r = await departmentService.list({ company_id: selectedCompany, page, page_size: PAGE, search: search || undefined });
      setDepartments(r.items);
      setTotal(r.total);
    } catch { setDepartments([]); }
    finally { setLoading(false); }
  }, [selectedCompany, page, search]);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openCreate = () => {
    setForm({ ...EMPTY, company_id: selectedCompany });
    setErrors({});
    setSelected(null);
    setModal('create');
  };
  const openEdit = (d: Department) => {
    setSelected(d);
    setForm({ department_name: d.department_name, description: d.description ?? '', company_id: d.company_id });
    setErrors({});
    setModal('edit');
  };
  const closeModal = () => { setModal(null); setSelected(null); setErrors({}); };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.department_name.trim()) e.department_name = 'Department name is required';
    if (!form.company_id) e.company_id = 'Company is required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = { department_name: form.department_name.trim(), description: form.description.trim() || null, company_id: form.company_id };
      if (modal === 'edit' && selected) await departmentService.update(selected.id, payload);
      else await departmentService.create(payload);
      closeModal();
      fetchDepts();
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.detail ?? 'Failed to save.' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try { await departmentService.delete(id); fetchDepts(); }
    catch { alert('Failed to delete.'); }
    finally { setDeleting(null); }
  };

  const totalPages = Math.ceil(total / PAGE);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
              <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400">Admin</Link>
              <span>/</span>
              <span className="text-gray-900 dark:text-white font-medium">Departments</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Departments</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{total} department{total !== 1 ? 's' : ''}</p>
          </div>
          {selectedCompany && (
            <Button variant="primary" onClick={openCreate}>
              <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Department
            </Button>
          )}
        </div>

        {/* Filters */}
        <Card>
          <div className="p-4 flex flex-col sm:flex-row gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Company</label>
              <select value={selectedCompany} onChange={e => { setSelectedCompany(e.target.value); setPage(1); }}
                className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]">
                <option value="">— Select Company —</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Search</label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input type="text" placeholder="Search departments…" value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
          </div>
        </Card>

        {/* Table */}
        <Card>
          {!selectedCompany ? (
            <div className="py-16 text-center text-gray-400 dark:text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
              </svg>
              <p className="font-medium">Select a company to view departments</p>
              {companies.length === 0 && (
                <p className="text-sm mt-1">No companies exist yet. <Link href="/admin/companies" className="text-blue-600 dark:text-blue-400 hover:underline">Create one first.</Link></p>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    {['Department Name', 'Description', 'Company', 'Created', 'Actions'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {loading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i}>{Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>
                      ))}</tr>
                    ))
                  ) : departments.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <svg className="w-12 h-12 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-gray-500 dark:text-gray-400 font-medium">No departments yet</p>
                        <Button variant="primary" size="sm" onClick={openCreate}>Create first department</Button>
                      </div>
                    </td></tr>
                  ) : departments.map(d => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center font-bold text-sm">
                            {d.department_name[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">{d.department_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">{d.description || '—'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {companies.find(c => c.id === d.company_id)?.company_name ?? '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{new Date(d.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(d)} className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">Edit</button>
                          <button onClick={() => handleDelete(d.id, d.department_name)} disabled={deleting === d.id}
                            className="text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium px-2 py-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50">
                            {deleting === d.id ? '…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">Showing {((page - 1) * PAGE) + 1}–{Math.min(page * PAGE, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300">Next</button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 z-10">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{modal === 'create' ? 'New Department' : 'Edit Department'}</h2>
              <button onClick={closeModal} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errors.general && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">{errors.general}</div>}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name <span className="text-red-500">*</span></label>
                <input value={form.department_name} onChange={e => { setForm(f => ({ ...f, department_name: e.target.value })); setErrors(er => ({ ...er, department_name: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.department_name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="e.g. Engineering" />
                {errors.department_name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.department_name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Company <span className="text-red-500">*</span></label>
                <select value={form.company_id} onChange={e => { setForm(f => ({ ...f, company_id: e.target.value })); setErrors(er => ({ ...er, company_id: undefined })); }}
                  className={`w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.company_id ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}>
                  <option value="">— Select Company —</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                {errors.company_id && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.company_id}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Brief description…" />
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
