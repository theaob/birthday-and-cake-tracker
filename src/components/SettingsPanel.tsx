'use client';

import { useState, useEffect } from 'react';
import {
  MessageSquare, Server, Hash, Save, CheckCircle, AlertCircle,
  Eye, EyeOff, ToggleLeft, ToggleRight,
} from 'lucide-react';

type Settings = {
  siteUrl: string;
  botEmail: string;
  apiKey: string;
  stream: string;
  topic: string;
  enabled: boolean;
};

const defaultSettings: Settings = {
  siteUrl: '', botEmail: '', apiKey: '', stream: '', topic: 'Birthdays', enabled: false,
};

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(data => {
        setSettings(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (key: keyof Settings, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        throw new Error();
      }
      setStatus({ type: 'success', message: 'Settings saved successfully.' });
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
        <MessageSquare size={20} />
        Zulip Reminders
      </h3>

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

        {/* Zulip server */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Server size={13} /> Zulip Server
          </p>
          <div className="input-group" style={{ marginBottom: '8px' }}>
            <label className="input-label" htmlFor="siteUrl">Site URL</label>
            <input id="siteUrl" className="input-field" type="url" placeholder="https://your-org.zulipchat.com" value={settings.siteUrl} onChange={e => handleChange('siteUrl', e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: '8px' }}>
            <label className="input-label" htmlFor="botEmail">Bot email</label>
            <input id="botEmail" className="input-field" type="email" placeholder="birthday-bot@your-org.zulipchat.com" value={settings.botEmail} onChange={e => handleChange('botEmail', e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="apiKey">Bot API key</label>
            <div style={{ position: 'relative' }}>
              <input id="apiKey" className="input-field" type={showKey ? 'text' : 'password'} placeholder="••••••••" value={settings.apiKey} onChange={e => handleChange('apiKey', e.target.value)} style={{ paddingRight: '42px', width: '100%' }} />
              <button type="button" onClick={() => setShowKey(p => !p)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        </div>

        {/* Destination */}
        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
          <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            <Hash size={13} /> Destination
          </p>
          <div className="input-group" style={{ marginBottom: '8px' }}>
            <label className="input-label" htmlFor="stream">Stream</label>
            <input id="stream" className="input-field" type="text" placeholder="general" value={settings.stream} onChange={e => handleChange('stream', e.target.value)} />
          </div>
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label" htmlFor="topic">Topic</label>
            <input id="topic" className="input-field" type="text" placeholder="Birthdays" value={settings.topic} onChange={e => handleChange('topic', e.target.value)} />
          </div>
        </div>

        {status && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '8px', fontSize: '0.875rem', background: status.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', color: status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', border: `1px solid ${status.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)'}` }}>
            {status.type === 'success' ? <CheckCircle size={15} /> : <AlertCircle size={15} />}
            {status.message}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ width: '100%' }}>
          <Save size={16} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
