'use client';
import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { auditService } from '@/services/api.service';
import type { AuditLog } from '@/types';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
  LOGIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
  LOGOUT: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const PAGE = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const p: Record<string, unknown> = { page, page_size: PAGE };
      if (actionFilter) p.action = actionFilter;
      if (entityFilter) p.entity = entityFilter;
      const r = await auditService.list(p);
      setLogs(r.items); setTotal(r.total);
    } catch { setLogs([]); } finally { setLoading(false); }
  }, [page, actionFilter, entityFilter]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-1">
            <Link href="/admin" className="hover:text-blue-600 dark:hover:text-blue-400">Admin</Link><span>/</span>
            <span className="text-gray-900 dark:text-white font-medium">Audit Logs</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} log{total !== 1 ? 's' : ''} total</p>
        </div>

        <Card>
          <div className="p-4 flex flex-wrap gap-3">
            <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Actions</option>
              {['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'TEAM_MEMBER_ADD'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
            <select value={entityFilter} onChange={e => { setEntityFilter(e.target.value); setPage(1); }}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Entities</option>
              {['User', 'Company', 'Department', 'Team', 'Project', 'DailyStatus'].map(e => <option key={e} value={e}>{e}</option>)}
            </select>
            {(actionFilter || entityFilter) && (
              <button onClick={() => { setActionFilter(''); setEntityFilter(''); setPage(1); }} className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">Clear</button>
            )}
          </div>
        </Card>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>{['Time', 'User', 'Action', 'Entity', 'Entity ID', 'IP', 'Details'].map(h => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {loading ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" /></td>)}</tr>
                )) : logs.length === 0 ? (
                  <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">No audit logs found</td></tr>
                ) : logs.map(log => (
                  <React.Fragment key={log.id}>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">{log.user_id ? log.user_id.slice(0, 8) + '…' : 'System'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'}`}>{log.action}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium">{log.entity}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400 font-mono">{log.entity_id ? log.entity_id.slice(0, 8) + '…' : '—'}</td>
                      <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">{log.ip_address || '—'}</td>
                      <td className="px-6 py-4">
                        {(log.old_values || log.new_values) && (
                          <button onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium px-2 py-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30">
                            {expanded === log.id ? 'Hide' : 'View'}
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === log.id && (
                      <tr className="bg-gray-50 dark:bg-gray-900">
                        <td colSpan={7} className="px-6 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            {log.old_values && <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">BEFORE</p><pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-32">{JSON.stringify(log.old_values, null, 2)}</pre></div>}
                            {log.new_values && <div><p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">AFTER</p><pre className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 overflow-auto max-h-32">{JSON.stringify(log.new_values, null, 2)}</pre></div>}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500 dark:text-gray-400">{((page - 1) * PAGE) + 1}–{Math.min(page * PAGE, total)} of {total}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300">Previous</button>
                <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages} className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300">Next</button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </ProtectedLayout>
  );
}
