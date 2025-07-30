'use client';
import { useState, useEffect } from 'react';
import { formatTimestamp } from '../utils/formatting';

export default function ClientTimestampDisplay({ 
  timestamp, 
  initialFormattedTime 
}: { 
  timestamp: number;
  initialFormattedTime: string;
}) {
  const [showExactTime, setShowExactTime] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showExactTime');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  
  const [formattedTime, setFormattedTime] = useState(initialFormattedTime);
  
  useEffect(() => {
    setFormattedTime(
      showExactTime
        ? new Date(timestamp * 1000).toLocaleString()
        : formatTimestamp(timestamp)
    );
  }, [timestamp, showExactTime]);
  
  const handleTimestampClick = () => {
    setShowExactTime((prev: boolean) => {
      const newValue = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('showExactTime', JSON.stringify(newValue));
      }
      return newValue;
    });
  };

  return (
    <span
      title={formattedTime}
      style={{ cursor: 'pointer' }}
      onClick={handleTimestampClick}
    >
      {formattedTime}
    </span>
  );
} 