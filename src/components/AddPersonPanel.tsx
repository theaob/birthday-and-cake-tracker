'use client';

import { useState } from 'react';
import { UserPlus, Calendar as CalendarIcon } from 'lucide-react';

export default function AddPersonPanel({ onAddSuccess }: { onAddSuccess: () => void }) {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/people', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, birthday }),
      });

      if (!response.ok) {
        throw new Error('Failed to add person');
      }

      setName('');
      setBirthday('');
      onAddSuccess();
    } catch (err) {
      setError('An error occurred while adding the birthday.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <UserPlus size={20} className="text-accent" />
        Add Birthday
      </h3>
      
      {error && <div style={{ color: 'var(--danger-color)', marginBottom: '10px' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div className="input-group">
          <label className="input-label" htmlFor="name">Full Name</label>
          <input 
            id="name"
            className="input-field" 
            type="text" 
            placeholder="e.g. Jane Doe" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <div className="input-group">
          <label className="input-label" htmlFor="birthday">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CalendarIcon size={14} /> Date of Birth
            </div>
          </label>
          <input 
            id="birthday"
            className="input-field" 
            type="date" 
            value={birthday}
            onChange={(e) => setBirthday(e.target.value)}
            required
            disabled={isSubmitting}
          />
        </div>

        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={isSubmitting}
          style={{ width: '100%', marginTop: '10px' }}
        >
          {isSubmitting ? 'Adding...' : 'Add Birthday'}
        </button>
      </form>
    </div>
  );
}
