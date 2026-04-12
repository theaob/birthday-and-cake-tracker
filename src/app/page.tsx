'use client';

import { useState } from 'react';
import CalendarView from '@/components/CalendarView';
import AddPersonPanel from '@/components/AddPersonPanel';
import SettingsPanel from '@/components/SettingsPanel';
import { Sparkles, Cake } from 'lucide-react';

export default function Home() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleAddSuccess = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <>
      <header className="app-header animate-fade-in">
        <h1 className="title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
          <Cake size={40} />
          Birthday & Cake Tracker
          <Sparkles size={32} style={{ color: '#ec4899' }} />
        </h1>
        <p style={{ color: 'var(--text-secondary)' }}>Never miss a birthday, and more importantly... never forget the cake!</p>
      </header>

      <main className="main-content container animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) minmax(300px, 3fr)', gap: '24px' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <AddPersonPanel onAddSuccess={handleAddSuccess} />
            <SettingsPanel />
          </div>

          {/* Right Column: Calendar & List */}
          <div>
            <CalendarView refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </main>
    </>
  );
}
