'use client';

import { useState } from 'react';
import { Cake, CakeSlice } from 'lucide-react';

export default function CakeStatusToggle({ 
  personId, 
  initialStatus, 
  onStatusChange 
}: { 
  personId: string, 
  initialStatus: boolean,
  onStatusChange?: () => void
}) {
  const [isBought, setIsBought] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const toggleStatus = async () => {
    setIsLoading(true);
    const newStatus = !isBought;
    
    // Optimistic UI update
    setIsBought(newStatus);
    
    try {
      const response = await fetch(`/api/people/${personId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cakeBought: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      
      if (onStatusChange) onStatusChange();
    } catch (error) {
      console.error(error);
      setIsBought(!newStatus); // Revert optimistic update
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <label className="toggle-switch">
        <input 
          type="checkbox" 
          checked={isBought} 
          onChange={toggleStatus} 
          disabled={isLoading}
        />
        <span className="toggle-slider"></span>
      </label>
      <span style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '4px',
        color: isBought ? 'var(--success-color)' : 'var(--text-secondary)',
        fontWeight: isBought ? 600 : 400
      }}>
        {isBought ? <Cake size={16} /> : <CakeSlice size={16} />}
        {isBought ? 'Cake Bought' : 'Pending Cake'}
      </span>
    </div>
  );
}
