'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { reportService } from '@/services/api.service';
import { useAuth } from '@/context/AuthContext';
import { useRbac } from '@/hooks/use-rbac';
import type { SuperAdminDashboard, ManagerDashboard, EmployeeDashboard } from '@/types';

function StatCard({ label, value, icon, color = 'blue', sub }: { label: string; value: number | string; icon: string; color?: string; sub?: string }) {
  const colors: Record<string, string> = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600', red: 'bg-red-100 text-red-600', gray: 'bg-gray-100 text-gray-600' };
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{value}</p>
          {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${colors[color] ?? colors.blue}`}>{icon}</div>
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { isSuperAdmin, isCompanyAdmin, isManager, isTeamLead } = useRbac();
  const [saData, setSaData] = useState<SuperAdminDashboard | null>(null);
  const [mgrData, setMgrData] = useState<ManagerDashboard | null>(null);
  const [empData, setEmpData] = useState<EmployeeDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);
      try {
        if (isSuperAdmin || isCompanyAdmin) {
          const [sa, mgr] = await Promise.all([reportService.dashboardSuperAdmin(), reportService.dashboardManager()]);
          setSaData(sa); setMgrData(mgr);
        } else if (isManager || isTeamLead) {
          const mgr = await reportService.dashboardManager();
          setMgrData(mgr);
        }
        const emp = await reportService.dashboardEmployee();
        setEmpData(emp);
      } catch { }
      finally { setLoading(false); }
    };
    loadDashboard();
  }, [isSuperAdmin, isCompanyAdmin, isManager, isTeamLead]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <ProtectedLayout>
      <div className="space-y-8">
        {/* Welcome */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{greeting()}, {user?.first_name} 👋</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          {empData && !empData.today_status_submitted && (
            <Link href="/daily-status">
              <Button variant="primary">
                <span className="mr-2">📝</span>Submit Today's Status
              </Button>
            </Link>
          )}
          {empData?.today_status_submitted && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg text-sm font-medium">
              <span>✅</span> Status submitted today
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="p-6"><div className="animate-pulse"><div className="h-4 bg-gray-200 rounded w-1/2 mb-3" /><div className="h-8 bg-gray-200 rounded w-1/3" /></div></Card>
            ))}
          </div>
        ) : (
          <>
            {/* Super Admin Stats */}
            {saData && (isSuperAdmin || isCompanyAdmin) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">System Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <StatCard label="Companies" value={saData.total_companies} icon="🏢" color="blue" />
                  <StatCard label="Departments" value={saData.total_departments} icon="🏬" color="purple" />
                  <StatCard label="Total Users" value={saData.total_employees} icon="👥" color="orange" />
                  <StatCard label="Active Users" value={saData.active_users} icon="✅" color="green" />
                  <StatCard label="Projects" value={saData.total_projects} icon="📁" color="blue" />
                  <StatCard label="Today's Submissions" value={saData.today_submissions} icon="📝" color="green" />
                </div>
              </div>
            )}

            {/* Manager Stats */}
            {mgrData && (isManager || isTeamLead || isCompanyAdmin || isSuperAdmin) && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Team Overview</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="My Projects" value={mgrData.total_projects} icon="📁" color="blue" />
                  <StatCard label="Submitted Today" value={mgrData.today_submitted} icon="✅" color="green" />
                  <StatCard label="Completed Today" value={mgrData.completed_today} icon="🎯" color="green" />
                  <StatCard label="Blocked Tasks" value={mgrData.blocked_tasks} icon="🚧" color="red" sub="Needs attention" />
                </div>
              </div>
            )}

            {/* Employee Stats */}
            {empData && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">My Stats</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <StatCard label="My Projects" value={empData.total_projects} icon="📁" color="blue" />
                  <StatCard label="This Week" value={`${empData.week_hours}h`} icon="⏱️" color="purple" sub="Hours worked" />
                  <StatCard label="Completed Tasks" value={empData.completed_tasks} icon="✅" color="green" />
                  <StatCard label="Pending Tasks" value={empData.pending_tasks} icon="📋" color="orange" />
                </div>
              </div>
            )}
          </>
        )}

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <Link href="/daily-status">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">📝</div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Daily Status</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Submit today's work</p>
              </Card>
            </Link>
            <Link href="/projects">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">📁</div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Projects</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View all projects</p>
              </Card>
            </Link>
            {(isManager || isSuperAdmin || isCompanyAdmin) && (
              <Link href="/reports">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-2xl mb-2">📊</div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Reports</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View analytics</p>
                </Card>
              </Link>
            )}
            {(isSuperAdmin || isCompanyAdmin) && (
              <Link href="/admin">
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="text-2xl mb-2">⚙️</div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Admin</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Manage organization</p>
                </Card>
              </Link>
            )}
            <Link href="/notifications">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">🔔</div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View alerts</p>
              </Card>
            </Link>
            <Link href="/profile">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                <div className="text-2xl mb-2">👤</div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Profile</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Edit your profile</p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  );
}
