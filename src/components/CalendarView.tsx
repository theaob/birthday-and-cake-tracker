'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isSameMonth, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, getMonth, getDate } from 'date-fns';
import { ChevronLeft, ChevronRight, Cake, Trash2 } from 'lucide-react';
import CakeStatusToggle from './CakeStatusToggle';

type Person = {
  id: string;
  name: string;
  birthday: string;
  cakeBought: boolean;
};

export default function CalendarView({ refreshTrigger }: { refreshTrigger: number }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPeople = async () => {
    try {
      const response = await fetch('/api/people');
      const data = await response.json();
      setPeople(data);
    } catch (err) {
      console.error('Failed to load people');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeople();
  }, [refreshTrigger, currentDate]);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const deletePerson = async (id: string) => {
    try {
      await fetch(`/api/people/${id}`, { method: 'DELETE' });
      fetchPeople();
      setConfirmDeleteId(null);
    } catch (err) {
      console.error(err);
    }
  };

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const startingDayIndex = getDay(startOfMonth(currentDate));
  
  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading calendar...</div>;
  }

  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');

  // Get displayed people based on viewMode
  const displayedPeople = people.filter(p => {
    if (viewMode === 'all') return true;
    return getMonth(parseISO(p.birthday)) === getMonth(currentDate);
  }).sort((a, b) => {
    const dateA = parseISO(a.birthday);
    const dateB = parseISO(b.birthday);
    const monthDiff = getMonth(dateA) - getMonth(dateB);
    if (monthDiff !== 0) return monthDiff;
    return getDate(dateA) - getDate(dateB);
  });

  return (
    <div className="glass-panel" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600 }}>
          {format(currentDate, 'MMMM yyyy')}
        </h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost" onClick={prevMonth} style={{ padding: '8px' }}>
            <ChevronLeft size={20} />
          </button>
          <button className="btn btn-ghost" onClick={nextMonth} style={{ padding: '8px' }}>
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(7, 1fr)', 
        gap: '10px',
        marginBottom: '30px'
      }}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} style={{ textAlign: 'center', fontWeight: 600, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            {day}
          </div>
        ))}
        
        {Array.from({ length: startingDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} style={{ padding: '10px', minHeight: '80px', borderRadius: '8px', background: 'rgba(0,0,0,0.02)' }} />
        ))}
        
        {daysInMonth.map((day, i) => {
          const dayBirthdays = people.filter(p => {
            const bDate = parseISO(p.birthday);
            return getMonth(bDate) === getMonth(day) && getDate(bDate) === getDate(day);
          });
          const isToday = isSameDay(day, new Date());
          
          return (
            <div 
              key={day.toString()} 
              style={{ 
                padding: '10px', 
                minHeight: '80px', 
                borderRadius: '8px',
                border: isToday ? '2px solid var(--accent-color)' : '1px solid var(--border-color)',
                background: dayBirthdays.length > 0 ? 'var(--bg-secondary)' : 'transparent',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <span style={{ 
                fontWeight: isToday ? 'bold' : 'normal',
                color: isToday ? 'var(--accent-color)' : 'inherit',
                display: 'block',
                marginBottom: '4px'
              }}>
                {format(day, 'd')}
              </span>
              
              {dayBirthdays.map(p => (
                <div key={p.id} style={{ 
                  fontSize: '0.75rem', 
                  background: p.cakeBought ? 'var(--success-color)' : 'var(--danger-color)',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <Cake size={10} />
                  {p.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <h3 style={{ fontSize: '1.2rem' }}>
            {viewMode === 'month' ? `Birthdays in ${format(currentDate, 'MMMM')}` : 'All Birthdays'}
          </h3>
          <div style={{ display: 'flex', background: 'var(--bg-primary)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <button 
              onClick={() => setViewMode('month')}
              className={`btn ${viewMode === 'month' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 12px', fontSize: '0.75rem', minHeight: 'auto', border: 'none', boxShadow: viewMode === 'month' ? 'var(--shadow-sm)' : 'none' }}
            >
              Month
            </button>
            <button 
              onClick={() => setViewMode('all')}
              className={`btn ${viewMode === 'all' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ padding: '4px 12px', fontSize: '0.75rem', minHeight: 'auto', border: 'none', boxShadow: viewMode === 'all' ? 'var(--shadow-sm)' : 'none' }}
            >
              All
            </button>
          </div>
        </div>
        
        {displayedPeople.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)' }}>No birthdays found.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {displayedPeople.map(person => (
              <div key={person.id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                padding: '12px',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'var(--bg-secondary)'
              }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{person.name}</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    {format(parseISO(person.birthday), 'MMMM do')} {format(parseISO(person.birthday), 'yyyy') !== format(new Date(), 'yyyy') && `(${format(parseISO(person.birthday), 'yyyy')})`}
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <CakeStatusToggle personId={person.id} initialStatus={person.cakeBought} onStatusChange={fetchPeople} />
                  {confirmDeleteId === person.id ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--danger-color)' }}>Sure?</span>
                      <button onClick={() => deletePerson(person.id)} className="btn" style={{ padding: '4px 8px', background: 'var(--danger-color)', color: 'white', minHeight: 'auto', fontSize: '0.8rem' }}>Yes</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="btn btn-ghost" style={{ padding: '4px 8px', minHeight: 'auto', fontSize: '0.8rem' }}>No</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setConfirmDeleteId(person.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer', opacity: 0.7 }}
                      title="Delete Person"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
