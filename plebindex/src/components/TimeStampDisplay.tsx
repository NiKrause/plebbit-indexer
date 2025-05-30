// Create a client-side component for the timestamp
'use client';
import { useState, useEffect } from 'react';
import { formatTimestamp } from '../utils/formatting';

export default function TimestampDisplay({ timestamp }: { timestamp: number }) {
  const [showExactTime, setShowExactTime] = useState(() => {
    // Initialize from localStorage if available
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('showExactTime');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const [formattedTime, setFormattedTime] = useState('');
  
  useEffect(() => {
    // Move all date formatting to client-side only
    setFormattedTime(
      showExactTime
        ? new Date(timestamp * 1000).toLocaleString()
        : formatTimestamp(timestamp)
    );
  }, [timestamp, showExactTime]);
  
  const handleTimestampClick = () => {
    setShowExactTime((prev: boolean) => {
      const newValue = !prev;
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('showExactTime', JSON.stringify(newValue));
      }
      return newValue;
    });
  };
  
  // Initial render with a safe fallback
  if (!formattedTime) {
    return <span>Loading...</span>;
  }

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