'use client';

import React from 'react';
import Link from 'next/link';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

export default function AdminPage() {
  return (
    <ProtectedLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-1">Manage your organization</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Companies */}
          <Link href="/admin/companies">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardBody className="text-center py-8">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Companies</h3>
                <p className="text-sm text-gray-600 mt-1">Manage companies</p>
              </CardBody>
            </Card>
          </Link>

          {/* Departments */}
          <Link href="/admin/departments">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardBody className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center text-green-600 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10h.01M13 16h2v2h-2v-2zm4-4h2v2h-2v-2zm-6 0h2v2h-2v-2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Departments</h3>
                <p className="text-sm text-gray-600 mt-1">Organize departments</p>
              </CardBody>
            </Card>
          </Link>

          {/* Teams */}
          <Link href="/admin/teams">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardBody className="text-center py-8">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center text-purple-600 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292m0 0H7.46m4.54 0H16.54m-4.54 0a4 4 0 010 5.292m6.136-9.4a6 6 0 11-12 0 6 6 0 0112 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Teams</h3>
                <p className="text-sm text-gray-600 mt-1">Manage teams</p>
              </CardBody>
            </Card>
          </Link>

          {/* Users */}
          <Link href="/admin/users">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardBody className="text-center py-8">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.856-1.487M15 10a3 3 0 11-6 0 3 3 0 016 0zM15 20h-2.5a4 4 0 00-4 4v2h6.5v-2a3.5 3.5 0 00-3.5-3.5z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Users</h3>
                <p className="text-sm text-gray-600 mt-1">Manage users & roles</p>
              </CardBody>
            </Card>
          </Link>

          {/* Roles */}
          <Link href="/admin/roles">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardBody className="text-center py-8">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center text-red-600 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Roles</h3>
                <p className="text-sm text-gray-600 mt-1">Configure roles</p>
              </CardBody>
            </Card>
          </Link>

          {/* Audit Logs */}
          <Link href="/admin/audit-logs">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardBody className="text-center py-8">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900">Audit Logs</h3>
                <p className="text-sm text-gray-600 mt-1">View activity logs</p>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>
    </ProtectedLayout>
  );
}
