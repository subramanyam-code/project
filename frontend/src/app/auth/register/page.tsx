'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { authService } from '@/services/api.service';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';

export default function RegisterPage() {
  const router = useRouter();
  const { refetchUser } = useAuth();

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError('First and last name are required');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/\d/.test(formData.password)) {
      setError('Password must contain at least one number');
      return;
    }

    setLoading(true);
    try {
      const tokens = await authService.register(
        formData.first_name.trim(),
        formData.last_name.trim(),
        formData.email.toLowerCase(),
        formData.password,
      );
      const { setTokens } = await import('@/lib/axios');
      setTokens(tokens.access_token, tokens.refresh_token);
      await refetchUser();
      router.push('/dashboard');
    } catch (err: any) {
      if (!err.response) {
        setError('Server took too long to respond. Please try again — it may take up to 60 seconds on first load.');
        return;
      }
      const detail = err.response?.data?.detail;
      const status = err.response?.status;
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg).join(', '));
      } else if (typeof detail === 'string') {
        setError(detail);
      } else {
        setError(`Error ${status}: ${JSON.stringify(err.response?.data)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <Card className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mx-auto mb-4">
              TP
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Join TSPM — Team Status & Project Management</p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First Name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                required
              />
              <Input
                label="Last Name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                required
              />
            </div>

            <Input
              label="Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleChange}
              placeholder="Repeat your password"
              required
            />

            {/* Password rules hint */}
            <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
              <p className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : ''}`}>
                {formData.password.length >= 8 ? '✓' : '·'} At least 8 characters
              </p>
              <p className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                {/[A-Z]/.test(formData.password) ? '✓' : '·'} One uppercase letter
              </p>
              <p className={`flex items-center gap-1 ${/\d/.test(formData.password) ? 'text-green-600 dark:text-green-400' : ''}`}>
                {/\d/.test(formData.password) ? '✓' : '·'} One number
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              fullWidth
              loading={loading}
              className="mt-2"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
