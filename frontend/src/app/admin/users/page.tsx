'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { userService, companyService, departmentService } from '@/services/api.service';
import type { UserListItem, Company, Department } from '@/types';

interface UserForm {
  first_name: string; last_name: string; email: string; password: string;
  job_title: string; phone: string; role_id: string; company_id: string; department_id: string;
}
const EMPTY: UserForm = {
  first_name: '', last_name: '', email: '', password: '',
  job_title: '', phone: '', role_id: '', company_id: '', department_id: '',
};

const inputCls = 'w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500';
const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

export default function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterActive, setFilterActive] = useState('');
  const PAGE = 15;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<Array<{ id: string; role_name: string }>>([]);

  const [modal, setModal] = useState<null | 'create' | 'edit'>(null);
  const [selected, setSelected] = useState<UserListItem | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<UserForm & { general: string }>>({});

  useEffect(() => {
    companyService.list({ page_size: 100 }).then(r => setCompanies(r.items)).catch(() => {});
    userService.roles().then(r => setRoles(r)).catch(() => {});
  }, []);

  useEffect(() => {
    if (form.company_id) {
      departmentService.list({ company_id: form.company_id, page_size: 100 }).then(r => setDepartments(r.items)).catch(() => {});
    }
  }, [form.company_id]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: PAGE };
      if (search) params.search = search;
      if (filterActive !== '') params.is_active = filterActive === 'true';
      const r = await userService.list(params);
      setUsers(r.items); setTotal(r.total);
    } catch { setUsers([]); }
    finally { setLoading(false); }
  }, [page, search, filterActive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const openCreate = () => { setForm(EMPTY); setErrors({}); setSelected(null); setModal('create'); };
  const openEdit = (u: UserListItem) => {
    setSelected(u);
    setForm({
      first_name: u.first_name, last_name: u.last_name, email: u.email,
      password: '', job_title: u.job_title ?? '', phone: '',
      role_id: u.role?.id ?? '', company_id: '', department_id: '',
    });
    setErrors({}); setModal('edit');
  };
  const closeModal = () => { setModal(null); setSelected(null); setErrors({}); };

  const validate = () => {
    const e: typeof errors = {};
    if (!form.first_name.trim()) e.first_name = 'First name required';
    if (!form.last_name.trim()) e.last_name = 'Last name required';
    if (!form.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(form.email)) e.email = 'Valid email required';
    if (modal === 'create' && !form.password) e.password = 'Password required';
    if (modal === 'create' && form.password && form.password.length < 8) e.password = 'Min 8 characters';
    if (!form.role_id) e.role_id = 'Role required';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        first_name: form.first_name.trim(), last_name: form.last_name.trim(),
        email: form.email.trim(), job_title: form.job_title.trim() || null,
        phone: form.phone.trim() || null, role_id: form.role_id,
        company_id: form.company_id || null, department_id: form.department_id || null,
      };
      if (form.password) payload.password = form.password;
      if (modal === 'edit' && selected) await userService.update(selected.id, payload);
      else await userService.create(payload);
      closeModal(); fetchUsers();
    } catch (err: any) {
      setErrors({ general: err?.response?.data?.detail ?? 'Failed to save.' });
    } finally { setSaving(false); }
  };

  const handleToggleActive = async (u: UserListItem) => {
    if (!window.confirm(`${u.is_active ? 'Deactivate' : 'Activate'} ${u.first_name} ${u.last_name}?`)) return;
    try {
      if (u.is_active) await userService.deactivate(u.id);
      else await userService.activate(u.id);
      fetchUsers();
    } catch { alert('Failed.'); }
  };

  // ── Permanent delete ──────────────────────────────────────────
  const handleDelete = async (u: UserListItem) => {
    const confirmed = window.confirm(
      `⚠️ PERMANENTLY DELETE "${u.first_name} ${u.last_name}" (${u.email})?\n\nThis cannot be undone. All their data will be removed.`
    );
    if (!confirmed) return;
    try {
      await userService.deletePermanently(u.id);
      fetchUsers();
    } catch (err: any) {
      alert(err?.response?.data?.detail ?? 'Failed to delete user.');
    }
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
              <span className="text-gray-900 dark:text-white font-medium">Users</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{total} user{total !== 1 ? 's' : ''}</p>
          </div>
          <Button variant="primary" onClick={openCreate}>+ New User</Button>
        </div>

        {/* Search + filter */}
        <Card>
          <div className="p-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input type="text" placeholder="Search by name or email…" value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={filterActive} onChange={e => { setFilterActive(e.target.value); setPage(1); }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </Card>

        {/* Users table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  {['User', 'Role', 'Job Title', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <p className="text-gray-500 dark:text-gray-400 font-medium">No users found</p>
                      <Button variant="primary" size="sm" onClick={openCreate} className="mt-3">Create first user</Button>
                    </td>
                  </tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    {/* User name + email */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {u.first_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{u.first_name} {u.last_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    {/* Role */}
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
                        {u.role?.role_name ?? '—'}
                      </span>
                    </td>
                    {/* Job title */}
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{u.job_title || '—'}</td>
                    {/* Status */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.is_active
                          ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                          : 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300'
                      }`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {/* Joined */}
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">—</td>
                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">
                          Edit
                        </button>
                        <button onClick={() => handleToggleActive(u)}
                          className={`text-xs font-medium px-2 py-1 rounded transition-colors ${
                            u.is_active
                              ? 'text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 hover:bg-yellow-50 dark:hover:bg-yellow-900/30'
                              : 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-900/30'
                          }`}>
                          {u.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => handleDelete(u)}
                          className="text-xs font-medium px-2 py-1 rounded text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors">
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {((page - 1) * PAGE) + 1}–{Math.min(page * PAGE, total)} of {total}
              </p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Previous
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`px-3 py-1.5 text-sm border rounded-lg ${
                      pg === page
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}>
                    {pg}
                  </button>
                ))}
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  Next
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Create / Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeModal} />
          <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl mx-4 z-10 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 rounded-t-xl">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {modal === 'create' ? 'New User' : 'Edit User'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {errors.general && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
                  {errors.general}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>First Name <span className="text-red-500">*</span></label>
                  <input value={form.first_name}
                    onChange={e => { setForm(f => ({ ...f, first_name: e.target.value })); setErrors(er => ({ ...er, first_name: undefined })); }}
                    className={`${inputCls} ${errors.first_name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="John" />
                  {errors.first_name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.first_name}</p>}
                </div>
                <div>
                  <label className={labelCls}>Last Name <span className="text-red-500">*</span></label>
                  <input value={form.last_name}
                    onChange={e => { setForm(f => ({ ...f, last_name: e.target.value })); setErrors(er => ({ ...er, last_name: undefined })); }}
                    className={`${inputCls} ${errors.last_name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                    placeholder="Doe" />
                  {errors.last_name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.last_name}</p>}
                </div>
              </div>

              <div>
                <label className={labelCls}>Email <span className="text-red-500">*</span></label>
                <input type="email" value={form.email}
                  onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors(er => ({ ...er, email: undefined })); }}
                  className={`${inputCls} ${errors.email ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="john@company.com" />
                {errors.email && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className={labelCls}>
                  {modal === 'edit' ? 'New Password (leave blank to keep)' : 'Password'}
                  {modal === 'create' && <span className="text-red-500"> *</span>}
                </label>
                <input type="password" value={form.password}
                  onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors(er => ({ ...er, password: undefined })); }}
                  className={`${inputCls} ${errors.password ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                  placeholder="Min 8 characters" />
                {errors.password && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.password}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Job Title</label>
                  <input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                    className={`${inputCls} border-gray-300 dark:border-gray-600`} placeholder="Software Engineer" />
                </div>
                <div>
                  <label className={labelCls}>Phone</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    className={`${inputCls} border-gray-300 dark:border-gray-600`} placeholder="+1 555 0100" />
                </div>
              </div>

              <div>
                <label className={labelCls}>Role <span className="text-red-500">*</span></label>
                <select value={form.role_id}
                  onChange={e => { setForm(f => ({ ...f, role_id: e.target.value })); setErrors(er => ({ ...er, role_id: undefined })); }}
                  className={`${inputCls} ${errors.role_id ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}>
                  <option value="">— Select Role —</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.role_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </option>
                  ))}
                </select>
                {errors.role_id && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.role_id}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Company</label>
                  <select value={form.company_id}
                    onChange={e => setForm(f => ({ ...f, company_id: e.target.value, department_id: '' }))}
                    className={`${inputCls} border-gray-300 dark:border-gray-600`}>
                    <option value="">— Select Company —</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <select value={form.department_id}
                    onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                    disabled={!form.company_id}
                    className={`${inputCls} border-gray-300 dark:border-gray-600 disabled:opacity-50`}>
                    <option value="">— Select Department —</option>
                    {departments.map(d => <option key={d.id} value={d.id}>{d.department_name}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal}>Cancel</Button>
                <Button type="submit" variant="primary" loading={saving}>
                  {modal === 'create' ? 'Create User' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedLayout>
  );
}
