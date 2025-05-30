'use client';

import { useState, useEffect } from 'react';
import { getApiBaseUrl } from '../api/admin';

interface QueueStats {
  total: number;
  stats: {
    status: string;
    count: number;
    total_successes: number;
    total_failures: number;
    total_runs: number;
  }[];
}

interface QueueItem {
  address: string;
  status: string;
  last_success_date?: number;
  last_failed_date?: number;
  error_message?: string;
  success_count: number;
  failure_count: number;
  total_runs: number;
  updated_at: number;
}

export default function QueueStats() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('plebbit_admin_auth');
      if (!authToken) {
        throw new Error('No auth token found');
      }
      const apiBaseUrl = getApiBaseUrl();
      console.log("apiBaseUrl queue stats   ", apiBaseUrl);
      // Fetch queue stats
      const statsResponse = await fetch(`${apiBaseUrl}/api/queue/stats?auth=${authToken}`);
      if (!statsResponse.ok) throw new Error('Failed to fetch queue stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch recent queue activity with status filter
      const activityUrl = statusFilter 
        ? `${apiBaseUrl}/api/queue?auth=${authToken}&status=${statusFilter}`
        : `${apiBaseUrl}/api/queue?auth=${authToken}`;
      const activityResponse = await fetch(activityUrl);
      if (!activityResponse.ok) throw new Error('Failed to fetch queue activity');
      const activityData = await activityResponse.json();
      setRecentActivity(activityData.slice(0, 10));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh data every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const handleStatusClick = (status: string) => {
    setStatusFilter(statusFilter === status ? null : status);
  };

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;
  }

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading queue data...</div>;
  }

  return (
    <div style={{
      background: '#f9f9f9',
      padding: '20px',
      marginBottom: '20px',
      borderRadius: '4px'
    }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Queue Statistics</h2>
      
      {/* Overall Stats */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px', color: '#666' }}>Overall Status</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {stats?.stats.map((stat) => (
            <div 
              key={stat.status} 
              onClick={() => handleStatusClick(stat.status)}
              style={{
                background: 'white',
                padding: '15px',
                borderRadius: '4px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                minWidth: '200px',
                cursor: 'pointer',
                border: statusFilter === stat.status ? '2px solid #2196F3' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ 
                color: stat.status === 'success' ? '#4CAF50' : 
                       stat.status === 'failed' ? '#f44336' : 
                       stat.status === 'processing' ? '#2196F3' : '#FF9800',
                fontWeight: 'bold',
                marginBottom: '5px'
              }}>
                {stat.status.charAt(0).toUpperCase() + stat.status.slice(1)}
              </div>
              <div>Count: {stat.count}</div>
              <div>Successes: {stat.total_successes}</div>
              <div>Failures: {stat.total_failures}</div>
              <div>Total Runs: {stat.total_runs}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h3 style={{ marginBottom: '10px', color: '#666' }}>
          Recent Activity {statusFilter && `- ${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)}`}
        </h3>
        <div style={{ 
          background: 'white',
          borderRadius: '4px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f5f5f5' }}>
                <th style={{ padding: '12px', textAlign: 'left' }}>Address</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Last Success</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Last Failure</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Stats</th>
                <th style={{ padding: '12px', textAlign: 'left' }}>Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((item) => (
                <tr key={item.address} style={{ borderTop: '1px solid #eee' }}>
                  <td style={{ padding: '12px' }}>{item.address}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '12px',
                      background: item.status === 'success' ? '#4CAF50' :
                                item.status === 'failed' ? '#f44336' :
                                item.status === 'processing' ? '#2196F3' : '#FF9800',
                      color: 'white',
                      fontSize: '0.9em'
                    }}>
                      {item.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.last_success_date ? formatDate(item.last_success_date) : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    {item.last_failed_date ? formatDate(item.last_failed_date) : '-'}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <div>Success: {item.success_count}</div>
                    <div>Failures: {item.failure_count}</div>
                    <div>Total: {item.total_runs}</div>
                  </td>
                  <td style={{ padding: '12px' }}>{formatDate(item.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 