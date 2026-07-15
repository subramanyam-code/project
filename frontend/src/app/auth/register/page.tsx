'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { authService } from '@/services/api.service';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Card } from '@/components/common/Card';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authService.forgotPassword(email); // reuses the "send email" flow to notify admin
      setSubmitted(true);
    } catch {
      // Show success anyway — don't leak whether email exists
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold mx-auto mb-4 text-lg">
              TP
            </div>
            <h1 className="text-2xl font-bold text-gray-900">TSPM</h1>
            <p className="text-gray-500 text-sm mt-1">Team Status & Project Management</p>
          </div>

          {submitted ? (
            /* Success state */
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Request Sent</h2>
              <p className="text-gray-600 text-sm mb-6">
                Your request has been noted. Your company admin will create your account
                and send you login credentials.
              </p>
              <Link
                href="/auth/login"
                className="text-blue-600 font-medium hover:underline text-sm"
              >
                Back to login
              </Link>
            </div>
          ) : (
            /* Request access form */
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">Get Access</h2>
                <p className="text-gray-500 text-sm">
                  Accounts are created by your company admin. Enter your work email
                  below and your admin will set up your account.
                </p>
              </div>

              {/* Info banner */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex gap-3">
                <svg className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-blue-800 text-sm">
                  Registration is managed by your organization. Contact your system
                  administrator if you need immediate access.
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleRequestAccess} className="space-y-4">
                <Input
                  label="Work Email"
                  type="email"
                  placeholder="you@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={loading}
                >
                  Request Access
                </Button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-6">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
