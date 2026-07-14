'use client';
import React, { useState } from 'react';
import { ProtectedLayout } from '@/components/layout/ProtectedLayout';
import { Card, CardHeader, CardBody } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/context/AuthContext';
import { userService, authService } from '@/services/api.service';

export default function ProfilePage() {
  const { user, refetchUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profile, setProfile] = useState({ first_name: user?.first_name ?? '', last_name: user?.last_name ?? '', job_title: user?.job_title ?? '', phone: user?.phone ?? '' });
  const [pw, setPw] = useState({ current_password: '', new_password: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!profile.first_name.trim() || !profile.last_name.trim()) { setError('First and last name are required.'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await userService.update(user.id, { first_name: profile.first_name.trim(), last_name: profile.last_name.trim(), job_title: profile.job_title.trim() || null, phone: profile.phone.trim() || null });
      await refetchUser();
      setSuccess('Profile updated successfully!');
      setEditMode(false);
    } catch (err: any) { setError(err?.response?.data?.detail ?? 'Failed to update profile.'); }
    finally { setSaving(false); }
  };

  const handleChangePw = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!pw.current_password) errs.current_password = 'Enter current password';
    if (!pw.new_password || pw.new_password.length < 8) errs.new_password = 'Min 8 characters';
    if (pw.new_password !== pw.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true); setError(''); setSuccess('');
    try {
      await authService.changePassword(pw.current_password, pw.new_password);
      setSuccess('Password changed successfully!');
      setPw({ current_password: '', new_password: '', confirm: '' });
      setChangingPw(false);
    } catch (err: any) { setError(err?.response?.data?.detail ?? 'Failed to change password.'); }
    finally { setSaving(false); }
  };

  if (!user) return null;

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>

        {success && <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700"><span>✅</span>{success}</div>}
        {error && <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"><span>⚠️</span>{error}</div>}

        {/* Profile */}
        <Card>
          <CardHeader title="Personal Information" action={!editMode ? <Button variant="secondary" size="sm" onClick={() => { setEditMode(true); setSuccess(''); setError(''); setProfile({ first_name: user.first_name, last_name: user.last_name, job_title: user.job_title ?? '', phone: user.phone ?? '' }); }}>Edit</Button> : undefined} />
          <CardBody>
            {editMode ? (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
                    <input value={profile.first_name} onChange={e => setProfile(p => ({ ...p, first_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
                    <input value={profile.last_name} onChange={e => setProfile(p => ({ ...p, last_name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Job Title</label>
                  <input value={profile.job_title} onChange={e => setProfile(p => ({ ...p, job_title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Software Engineer" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="+1 555 0100" />
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" loading={saving}>Save Changes</Button>
                  <Button type="button" variant="secondary" onClick={() => setEditMode(false)}>Cancel</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-5 mb-6">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 text-white flex items-center justify-center text-2xl font-bold">
                    {user.first_name[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{user.first_name} {user.last_name}</h2>
                    <p className="text-sm text-gray-500">{user.role?.role_name?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? ''}</p>
                  </div>
                </div>
                {[
                  { label: 'Email', value: user.email },
                  { label: 'Job Title', value: user.job_title || '—' },
                  { label: 'Phone', value: user.phone || '—' },
                  { label: 'Account Status', value: user.is_active ? 'Active' : 'Inactive' },
                  { label: 'Email Verified', value: user.is_verified ? 'Yes' : 'No' },
                  { label: 'Last Login', value: user.last_login ? new Date(user.last_login).toLocaleString() : '—' },
                ].map(item => (
                  <div key={item.label} className="flex justify-between py-3 border-b border-gray-100 last:border-0">
                    <span className="text-sm text-gray-500">{item.label}</span>
                    <span className="text-sm font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader title="Change Password" action={!changingPw ? <Button variant="secondary" size="sm" onClick={() => { setChangingPw(true); setSuccess(''); setError(''); }}>Change Password</Button> : undefined} />
          <CardBody>
            {changingPw ? (
              <form onSubmit={handleChangePw} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Password <span className="text-red-500">*</span></label>
                  <input type="password" value={pw.current_password} onChange={e => { setPw(p => ({ ...p, current_password: e.target.value })); setPwErrors(er => { const n = { ...er }; delete n.current_password; return n; }); }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwErrors.current_password ? 'border-red-400' : 'border-gray-300'}`} />
                  {pwErrors.current_password && <p className="text-xs text-red-600 mt-1">{pwErrors.current_password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password <span className="text-red-500">*</span></label>
                  <input type="password" value={pw.new_password} onChange={e => { setPw(p => ({ ...p, new_password: e.target.value })); setPwErrors(er => { const n = { ...er }; delete n.new_password; return n; }); }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwErrors.new_password ? 'border-red-400' : 'border-gray-300'}`} placeholder="Min 8 characters" />
                  {pwErrors.new_password && <p className="text-xs text-red-600 mt-1">{pwErrors.new_password}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password <span className="text-red-500">*</span></label>
                  <input type="password" value={pw.confirm} onChange={e => { setPw(p => ({ ...p, confirm: e.target.value })); setPwErrors(er => { const n = { ...er }; delete n.confirm; return n; }); }}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${pwErrors.confirm ? 'border-red-400' : 'border-gray-300'}`} />
                  {pwErrors.confirm && <p className="text-xs text-red-600 mt-1">{pwErrors.confirm}</p>}
                </div>
                <div className="flex gap-3">
                  <Button type="submit" variant="primary" loading={saving}>Update Password</Button>
                  <Button type="button" variant="secondary" onClick={() => { setChangingPw(false); setPw({ current_password: '', new_password: '', confirm: '' }); }}>Cancel</Button>
                </div>
              </form>
            ) : (
              <p className="text-sm text-gray-500">Keep your account secure by regularly updating your password.</p>
            )}
          </CardBody>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
