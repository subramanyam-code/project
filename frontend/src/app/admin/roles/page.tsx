'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card } from '@/components/common/Card';
import { userService } from '@/services/api.service';

const ROLE_DESCRIPTIONS: Record<string, { desc: string; color: string }> = {
  super_admin: { desc: 'Full system access — manages all companies, users, and configuration.', color: 'bg-red-100 text-red-800' },
  company_admin: { desc: 'Manages a single company — departments, teams, users, and projects.', color: 'bg-orange-100 text-orange-800' },
  project_manager: { desc: 'Creates and manages projects, assigns teams and members.', color: 'bg-blue-100 text-blue-800' },
  team_lead: { desc: 'Leads a team, monitors member status and assigns tasks.', color: 'bg-purple-100 text-purple-800' },
  employee: { desc: 'Submits daily status, views own projects and tasks.', color: 'bg-green-100 text-green-800' },
};

export default function RolesPage() {
  const [roles, setRoles] = useState<Array<{ id: string; role_name: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.roles().then(r => setRoles(r)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin" className="hover:text-blue-600">Admin</Link><span>/</span>
            <span className="text-gray-900 font-medium">Roles</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="text-sm text-gray-500 mt-1">System roles are predefined and cannot be modified.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-6"><div className="h-4 bg-gray-200 rounded animate-pulse mb-3 w-1/2" /><div className="h-3 bg-gray-100 rounded animate-pulse" /></div>
          )) : roles.map(role => {
            const meta = ROLE_DESCRIPTIONS[role.role_name];
            return (
              <Card key={role.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${meta?.color ?? 'bg-gray-100 text-gray-700'}`}>
                    {role.role_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{meta?.desc ?? 'System role.'}</p>
                <p className="text-xs text-gray-400 mt-3 font-mono">ID: {role.id.slice(0, 8)}…</p>
              </Card>
            );
          })}
        </div>

        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <div className="flex gap-3">
            <svg className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">Roles are managed by the system</p>
              <p className="text-sm text-yellow-700 mt-1">To change a user's role, go to <Link href="/admin/users" className="underline font-medium">Users</Link> and edit their profile.</p>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
