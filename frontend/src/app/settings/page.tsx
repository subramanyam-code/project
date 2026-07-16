'use client';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Settings are managed on the profile page
export default function SettingsPage() {
  const router = useRouter();
  useEffect(() => { router.replace('/profile'); }, [router]);
  return null;
}
