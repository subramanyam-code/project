'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { projectService } from '@/services/api.service';
import { useRbac } from '@/hooks/use-rbac';
import type { Project } from '@/types';

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700', in_progress: 'bg-blue-100 text-blue-700',
  on_hold: 'bg-yellow-100 text-yellow-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};
const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-gray-100 text-gray-600', medium: 'bg-blue-100 text-blue-600',
  high: 'bg-orange-100 text-orange-700', critical: 'bg-red-100 text-red-700',
};

export default function ProjectsPage() {
  const router = useRouter();
  const { isManager, isSuperAdmin, isCompanyAdmin } = useRbac();
  const canManage = isManager || isSuperAdmin || isCompanyAdmin;

  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);
  const PAGE = 10;

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, unknown> = { page, page_size: PAGE };
      if (search) p.search = search;
      if (statusFilter) p.status = statusFilter;
      const r = await projectService.list(p);
      setProjects(r.items); setTotal(r.total);
    } catch { setProjects([]); } finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 400); return () => clearTimeout(t); }, [searchInput]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete project "${name}"? This cannot be undone.`)) return;
    setDeleting(id);
    try { await projectService.delete(id); fetchProjects(); } catch { alert('Failed to delete.'); } finally { setDeleting(null); }
  };

  const totalPages = Math.ceil(total / PAGE);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
            <p className="text-sm text-gray-500">{total} project{total !== 1 ? 's' : ''} total</p>
          </div>
          {canManage && (
            <Link href="/projects/create">
              <Button variant="primary">+ New Project</Button>
            </Link>
          )}
        </div>

        <Card>
          <div className="p-4 flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px] relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input type="text" placeholder="Search projects…" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Statuses</option>
              {['not_started','in_progress','on_hold','completed','cancelled'].map(s => (
                <option key={s} value={s}>{s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>
              ))}
            </select>
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Project', 'Status', 'Priority', 'Progress', 'Manager', 'Members', 'Dates', 'Actions'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 rounded animate-pulse" /></td>)}</tr>
                )) : projects.length === 0 ? (
                  <tr><td colSpan={8} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <p className="text-gray-500 font-medium">No projects found</p>
                      {canManage && <Link href="/projects/create"><Button variant="primary" size="sm">Create first project</Button></Link>}
                    </div>
                  </td></tr>
                ) : projects.map(p => {
                  const pct = Math.min(100, Number(p.progress_percentage) || 0);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => router.push(`/projects/${p.id}`)}>
                      <td className="px-6 py-4">
                        <p className="font-medium text-gray-900 hover:text-blue-600">{p.project_name}</p>
                        {p.description && <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{p.description}</p>}
                      </td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700'}`}>{p.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                      <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[p.priority] ?? 'bg-gray-100 text-gray-600'}`}>{p.priority.replace(/\b\w/g, c => c.toUpperCase())}</span></td>
                      <td className="px-6 py-4 min-w-[120px]">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${pct === 100 ? 'bg-green-500' : 'bg-blue-500'}`} style={{ width: `${pct}%` }} /></div>
                          <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.manager ? `${p.manager.first_name} ${p.manager.last_name}` : <span className="text-gray-400">—</span>}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{p.member_count}</td>
                      <td className="px-6 py-4 text-xs text-gray-500"><div>{p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}</div><div>{p.end_date ? new Date(p.end_date).toLocaleDateString() : '—'}</div></td>
                      <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Link href={`/projects/${p.id}`} className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2 py-1 rounded hover:bg-blue-50">View</Link>
                          {canManage && <>
                            <Link href={`/projects/${p.id}/edit`} className="text-xs text-gray-600 hover:text-gray-800 font-medium px-2 py-1 rounded hover:bg-gray-100">Edit</Link>
                            <button onClick={() => handleDelete(p.id, p.project_name)} disabled={deleting === p.id} className="text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50">{deleting === p.id ? '…' : 'Delete'}</button>
                          </>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <p className="text-sm text-gray-500">{((page - 1) * PAGE) + 1}–{Math.min(page * PAGE, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Previous</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(pg => (
                  <button key={pg} onClick={() => setPage(pg)} className={`px-3 py-1.5 text-sm border rounded-lg ${pg === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 hover:bg-gray-50'}`}>{pg}</button>
                ))}
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">Next</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ProtectedLayout>
  );
}
