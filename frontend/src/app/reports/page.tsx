'use client';
import React, { useState } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { reportService } from '@/services/api.service';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'custom';

interface DailyEntry {
  user_name: string; task_title: string; status: string;
  hours_worked: number; blockers?: string; project_name?: string;
}
interface ReportResult { entries?: DailyEntry[]; total_hours?: number; total_entries?: number; [key: string]: unknown }

const STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  in_progress:  'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  completed:    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  blocked:      'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

const inputCls = 'px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResult | null>(null);
  const [error, setError] = useState('');
  const [params, setParams] = useState({
    date: new Date().toISOString().split('T')[0],
    week_start: new Date(Date.now() - 6 * 86400000).toISOString().split('T')[0],
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    start_date: new Date(Date.now() - 29 * 86400000).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setParams(p => ({ ...p, [field]: e.target.value }));
    setResult(null); setError('');
  };

  const handleRun = async () => {
    setLoading(true); setError(''); setResult(null);
    try {
      let data: ReportResult;
      if (reportType === 'daily') data = await reportService.daily({ report_date: params.date });
      else if (reportType === 'weekly') data = await reportService.weekly({ week_start: params.week_start });
      else if (reportType === 'monthly') data = await reportService.monthly({ year: params.year, month: params.month });
      else data = await reportService.custom({ start_date: params.start_date, end_date: params.end_date });
      setResult(data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to generate report.');
    } finally { setLoading(false); }
  };

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setLoading(true);
    try {
      let blob: Blob;
      const p: Record<string, unknown> = { format };
      if (reportType === 'daily') { p.report_date = params.date; blob = await reportService.daily(p); }
      else if (reportType === 'weekly') { p.week_start = params.week_start; blob = await reportService.weekly(p); }
      else if (reportType === 'monthly') { p.year = params.year; p.month = params.month; blob = await reportService.monthly(p); }
      else { p.start_date = params.start_date; p.end_date = params.end_date; blob = await reportService.custom(p); }
      const url = URL.createObjectURL(new Blob([blob as BlobPart]));
      const a = document.createElement('a'); a.href = url; a.download = `report.${format}`; a.click();
      URL.revokeObjectURL(url);
    } catch { alert('Export failed.'); }
    finally { setLoading(false); }
  };

  const entries: DailyEntry[] = result?.entries ?? [];
  const totalHours = result?.total_hours ?? entries.reduce((s, e) => s + (e.hours_worked ?? 0), 0);

  return (
    <ProtectedLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Page title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Generate and export team status reports</p>
        </div>

        {/* Controls card */}
        <Card>
          <CardBody>
            <div className="flex flex-wrap gap-4 items-end">
              {/* Report type toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Report Type</label>
                <div className="flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  {(['daily', 'weekly', 'monthly', 'custom'] as ReportType[]).map(t => (
                    <button key={t} onClick={() => { setReportType(t); setResult(null); setError(''); }}
                      className={`px-4 py-2 text-sm font-medium transition-colors ${
                        reportType === t
                          ? 'bg-blue-600 text-white'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date inputs */}
              {reportType === 'daily' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
                  <input type="date" value={params.date} onChange={set('date')}
                    max={new Date().toISOString().split('T')[0]} className={inputCls} />
                </div>
              )}
              {reportType === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Week Start (Monday)</label>
                  <input type="date" value={params.week_start} onChange={set('week_start')} className={inputCls} />
                </div>
              )}
              {reportType === 'monthly' && (
                <div className="flex gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
                    <input type="number" value={params.year} onChange={set('year')} min={2020} max={2030}
                      className={`w-24 ${inputCls}`} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Month</label>
                    <select value={params.month} onChange={set('month')} className={inputCls}>
                      {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                        <option key={m} value={i + 1}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
              {reportType === 'custom' && (
                <div className="flex gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">From</label>
                    <input type="date" value={params.start_date} onChange={set('start_date')} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">To</label>
                    <input type="date" value={params.end_date} onChange={set('end_date')} min={params.start_date} className={inputCls} />
                  </div>
                </div>
              )}

              <Button variant="primary" onClick={handleRun} loading={loading}>Generate Report</Button>
            </div>
          </CardBody>
        </Card>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Entries', value: result.total_entries ?? entries.length, icon: '📝' },
                { label: 'Total Hours',   value: `${Number(totalHours).toFixed(1)}h`,    icon: '⏱️' },
                { label: 'Completed',     value: entries.filter(e => e.status === 'completed').length, icon: '✅' },
                { label: 'Blocked',       value: entries.filter(e => e.status === 'blocked').length,   icon: '🚧' },
              ].map(s => (
                <Card key={s.label} className="p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
                </Card>
              ))}
            </div>

            {/* Export + heading row */}
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Results ({entries.length} entries)
              </h2>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => handleExport('csv')}>Export CSV</Button>
                <Button variant="secondary" size="sm" onClick={() => handleExport('excel')}>Export Excel</Button>
                <Button variant="secondary" size="sm" onClick={() => handleExport('pdf')}>Export PDF</Button>
              </div>
            </div>

            {/* Results table */}
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      {['Employee', 'Project', 'Task', 'Status', 'Hours', 'Blockers'].map(h => (
                        <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {entries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                          No data for this period
                        </td>
                      </tr>
                    ) : entries.map((entry, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{entry.user_name}</td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{entry.project_name ?? '—'}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 dark:text-white max-w-[200px] truncate">{entry.task_title}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[entry.status] ?? STATUS_COLORS.not_started}`}>
                            {entry.status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{entry.hours_worked}h</td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 max-w-[150px] truncate">{entry.blockers || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {!result && !error && !loading && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <div className="text-5xl mb-4">📊</div>
            <p className="font-medium">Select a report type and click Generate Report</p>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
