'use client';

import { useState, useEffect } from 'react';
import {
  Mail, Server, Users, Save, CheckCircle, AlertCircle,
  Eye, EyeOff, ToggleLeft, ToggleRight, Lock, Unlock, KeyRound,
} from 'lucide-react';

type Settings = {
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  recipients: string;
  enabled: boolean;
};

const defaultSettings: Settings = {
  smtpHost: '', smtpPort: 587, smtpSecure: false,
  smtpUser: '', smtpPass: '', recipients: '', enabled: false,
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auth state
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        const { passwordRequired: pr, ...rest } = data;
        setSettings(rest);
        setPasswordRequired(!!pr);
        // If no password is required, consider it already unlocked
        if (!pr) setUnlocked(true);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    // Verify by attempting a no-op save with the password
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-password': adminPassword },
        body: JSON.stringify(settings),
      });
      if (res.status === 401) {
        setAuthError('Incorrect password.');
      } else if (res.ok) {
        setUnlocked(true);
      } else {
        setAuthError('Something went wrong.');
      }
    } catch {
      setAuthError('Something went wrong.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleChange = (key: keyof Settings, value: string | number | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (passwordRequired) headers['x-admin-password'] = adminPassword;
      const res = await fetch('/api/settings', { method: 'POST', headers, body: JSON.stringify(settings) });
      if (res.status === 401) {
        setUnlocked(false);
        setStatus({ type: 'error', message: 'Session expired. Please unlock again.' });
      } else if (!res.ok) {
        throw new Error();
      } else {
        setStatus({ type: 'success', message: 'Settings saved successfully.' });
      }
    } catch {
      setStatus({ type: 'error', message: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="glass-panel" style={{ padding: '24px' }}>Loading settings...</div>;
  }

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '1.1rem' }}>
        <Mail size={20} />
        Email Settings
        {passwordRequired && (
          <span style={{ marginLeft: 'auto', color: unlocked ? 'var(--success-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}>
            {unlocked ? <><Unlock size={14} /> Unlocked</> : <><Lock size={14} /> Admin only</>}
          </span>
        )}
      </h3>

      {/* Lock screen */}
      {passwordRequired && !unlocked && (
        <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ padding: '20px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px dashed var(--border-color)', textAlign: 'center' }}>
            <KeyRound size={32} style={{ color: 'var(--accent-color)', marginBottom: '8px' }} />
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              SMTP settings are protected.<br />Enter the admin password to edit.
            </p>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="adminPass">Admin password</label>
            <div style={{ position: 'relative' }}>
              <input
                id="adminPass"
                className="input-field"
                type={showAdminPass ? 'text' : 'password'}
                placeholder="••••••••"
                value={adminPassword}
                onChange={e => { setAdminPassword(e.target.value); setAuthError(''); }}
                style={{ paddingRight: '42px', width: '100%' }}
                autoFocus
              />
              <button type="button" onClick={() => setShowAdminPass(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {showAdminPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {authError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', fontSize: '0.875rem', background: 'rgba(239,68,68,0.1)', color: 'var(--danger-color)', border: '1px solid var(--danger-color)' }}>
              <AlertCircle size={14} /> {authError}
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={authLoading || !adminPassword} style={{ width: '100%' }}>
            <Unlock size={16} />
            {authLoading ? 'Checking...' : 'Unlock'}
          </button>
        </form>
      )}

      {/* Settings form (shown when unlocked or no password required) */}
      {unlocked && (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Enable toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>Enable reminders</span>
            <button type="button" onClick={() => handleChange('enabled', !settings.enabled)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: settings.enabled ? 'var(--success-color)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              {settings.enabled
                ? <><ToggleRight size={28} /><span style={{ fontSize: '0.85rem', fontWeight: 600 }}>On</span></>
                : <><ToggleLeft size={28} /><span style={{ fontSize: '0.85rem' }}>Off</span></>}
            </button>
          </div>

          {/* SMTP */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Server size={13} /> SMTP Server
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label" htmlFor="smtpHost">Host</label>
                <input id="smtpHost" className="input-field" type="text" placeholder="smtp.gmail.com" value={settings.smtpHost} onChange={e => handleChange('smtpHost', e.target.value)} />
              </div>
              <div className="input-group" style={{ marginBottom: 0, width: '110px', minWidth: '110px' }}>
                <label className="input-label" htmlFor="smtpPort">Port</label>
                <input id="smtpPort" className="input-field" type="number" value={settings.smtpPort} onChange={e => handleChange('smtpPort', parseInt(e.target.value, 10))} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', padding: '8px 12px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <input id="smtpSecure" type="checkbox" checked={settings.smtpSecure} onChange={e => handleChange('smtpSecure', e.target.checked)} style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              <label htmlFor="smtpSecure" style={{ fontSize: '0.875rem', cursor: 'pointer' }}>Use TLS (port 465)</label>
            </div>
            <div className="input-group" style={{ marginBottom: '8px' }}>
              <label className="input-label" htmlFor="smtpUser">Username / From address</label>
              <input id="smtpUser" className="input-field" type="email" placeholder="you@gmail.com" value={settings.smtpUser} onChange={e => handleChange('smtpUser', e.target.value)} />
            </div>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="smtpPass">Password / App password</label>
              <div style={{ position: 'relative' }}>
                <input id="smtpPass" className="input-field" type={showPass ? 'text' : 'password'} placeholder="••••••••" value={settings.smtpPass} onChange={e => handleChange('smtpPass', e.target.value)} style={{ paddingRight: '42px', width: '100%' }} />
                <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Users size={13} /> Recipients
            </p>
            <div className="input-group" style={{ marginBottom: 0 }}>
              <label className="input-label" htmlFor="recipients">Email addresses (comma-separated)</label>
              <textarea id="recipients" className="input-field" placeholder="alice@example.com, bob@example.com" value={settings.recipients} onChange={e => handleChange('recipients', e.target.value)} rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
          </div>

          {status && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', background: status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', border: `1px solid ${status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}` }}>
              {status.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
              {status.message}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
            {passwordRequired && (
              <button type="button" className="btn btn-ghost" onClick={() => { setUnlocked(false); setAdminPassword(''); }} title="Lock settings">
                <Lock size={16} />
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
