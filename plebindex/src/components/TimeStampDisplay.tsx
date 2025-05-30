// Create a client-side component for the timestamp
'use client';
import { useState, useEffect } from 'react';
import { formatTimestamp } from '../utils/formatting';

export default function TimestampDisplay({ timestamp }: { timestamp: number }) {
  const [showExactTime, setShowExactTime] = useState(false);
  const [formattedTime, setFormattedTime] = useState('');
  
  useEffect(() => {
    // Move all date formatting to client-side only
    setFormattedTime(
      showExactTime
        ? new Date(timestamp * 1000).toLocaleString()
        : formatTimestamp(timestamp)
    );
  }, [timestamp, showExactTime]);
  
  const handleTimestampClick = () => setShowExactTime((prev) => !prev);
  
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