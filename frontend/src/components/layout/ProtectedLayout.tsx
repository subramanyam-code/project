'use client';

import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { RoleName } from '@/hooks/use-rbac';

interface ProtectedLayoutProps {
  children: React.ReactNode;
  requiredPermissions?: RoleName[];
}

export const ProtectedLayout = ({ children, requiredPermissions }: ProtectedLayoutProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
    }
  }, [user, loading, router]);

  React.useEffect(() => {
    if (!loading && user && requiredPermissions && requiredPermissions.length > 0) {
      const userRole = user.role?.role_name as RoleName | undefined;
      if (userRole && !requiredPermissions.includes(userRole)) {
        router.push('/dashboard');
      }
    }
  }, [user, loading, requiredPermissions, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-950 transition-colors duration-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
