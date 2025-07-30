// Server component - no React hooks needed
import ClientTimestampDisplay from './ClientTimestampDisplay';

// Server-side safe formatting function
function formatTimestampServer(timestamp: number): string {
  // Use a simple relative time calculation that works on server
  const now = Date.now() / 1000;
  const diff = now - timestamp;
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

export default function TimestampDisplay({ timestamp }: { timestamp: number }) {
  // Server-side initial render
  const initialFormattedTime = formatTimestampServer(timestamp);
  
  return (
    <ClientTimestampDisplay 
      timestamp={timestamp} 
      initialFormattedTime={initialFormattedTime}
    />
  );
}