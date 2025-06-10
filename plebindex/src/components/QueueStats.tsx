'use client';

import { useState, useEffect, useCallback } from 'react';
import { getApiBaseUrl, getQueueStats, getKnownSubplebbitsStats } from '../api/admin';

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

interface QueueError {
  address: string;
  errors: {
    status: string;
    error_message: string;
    failure_count: number;
    success_count: number;
    total_runs: number;
    updated_at: number;
  }[];
  total_failures: number;
  total_successes: number;
  total_runs: number;
}

export default function QueueStats() {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [knownStats, setKnownStats] = useState<any>(null);
  const [recentActivity, setRecentActivity] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [queueErrors, setQueueErrors] = useState<QueueError[]>([]);
  const [newAddress, setNewAddress] = useState('');
  const [batchSize, setBatchSize] = useState(5);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);

  // Memoize the loadData function
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('plebbit_admin_auth');
      if (!authToken) {
        throw new Error('No auth token found');
      }
      const apiBaseUrl = getApiBaseUrl();

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
      setRecentActivity(activityData);

      // Fetch queue errors
      const errorsResponse = await fetch(`${apiBaseUrl}/api/queue/errors?auth=${authToken}`);
      if (!errorsResponse.ok) throw new Error('Failed to fetch queue errors');
      const errorsData = await errorsResponse.json();
      setQueueErrors(errorsData);

      // Fetch known subplebbits stats
      const subplebbitStatsResponse = await fetch(`${apiBaseUrl}/api/queue/known-subplebbits?auth=${authToken}`);
      if (!subplebbitStatsResponse.ok) throw new Error('Failed to fetch known subplebbits stats');
      const subplebbitStatsData = await subplebbitStatsResponse.json();
      setKnownStats(subplebbitStatsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load queue data');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadData();
    // Refresh data every minute
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [loadData, statusFilter]);

  const handleAddToQueue = async () => {
    if (!newAddress.trim()) {
      setError('Please enter an address');
      return;
    }

    try {
      setProcessingAction(true);
      const authToken = localStorage.getItem('plebbit_admin_auth');
      if (!authToken) {
        throw new Error('No auth token found');
      }
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/queue/add?auth=${authToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: newAddress }),
      });
      
      if (!response.ok) throw new Error('Failed to add address to queue');
      
      setNewAddress('');
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add address to queue');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRetryAddress = async (address: string) => {
    try {
      setProcessingAction(true);
      const authToken = localStorage.getItem('plebbit_admin_auth');
      if (!authToken) {
        throw new Error('No auth token found');
      }
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/queue/retry?auth=${authToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address }),
      });
      
      if (!response.ok) throw new Error('Failed to retry address');
      
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry address');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRefreshQueue = async () => {
    try {
      setProcessingAction(true);
      const authToken = localStorage.getItem('plebbit_admin_auth');
      if (!authToken) {
        throw new Error('No auth token found');
      }
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/queue/refresh?auth=${authToken}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to refresh queue');
      
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh queue');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleProcessQueue = async () => {
    try {
      setProcessingAction(true);
      const authToken = localStorage.getItem('plebbit_admin_auth');
      if (!authToken) {
        throw new Error('No auth token found');
      }
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/queue/process?auth=${authToken}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limit: batchSize }),
      });
      
      if (!response.ok) throw new Error('Failed to process queue');
      
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process queue');
    } finally {
      setProcessingAction(false);
    }
  };

  const handleTriggerDuneQuery = async () => {
    try {
      setProcessingAction(true);
      const authToken = localStorage.getItem('plebbit_admin_auth');
      if (!authToken) {
        throw new Error('No auth token found');
      }
      const apiBaseUrl = getApiBaseUrl();
      
      const response = await fetch(`${apiBaseUrl}/api/dune/trigger?auth=${authToken}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to trigger Dune query');
      
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to trigger Dune query');
    } finally {
      setProcessingAction(false);
    }
  };

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
      
      {/* Known Subplebbits Stats */}
      {knownStats && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Known Subplebbits</h3>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px' }}>
            <div style={{
              padding: '15px',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flex: 1
            }}>
              <div style={{ fontSize: '0.9em', color: '#666' }}>Total Known</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{knownStats.total}</div>
            </div>
            <div style={{
              padding: '15px',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flex: 1
            }}>
              <div style={{ fontSize: '0.9em', color: '#666' }}>From GitHub</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{knownStats.github_count}</div>
            </div>
            <div style={{
              padding: '15px',
              background: 'white',
              borderRadius: '4px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
              flex: 1
            }}>
              <div style={{ fontSize: '0.9em', color: '#666' }}>From Dune</div>
              <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{knownStats.dune_count}</div>
            </div>
          </div>
        </div>
      )}

      {/* Queue Management */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ marginBottom: '10px', color: '#666' }}>Queue Management</h3>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Enter address to add"
              style={{ 
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd',
                minWidth: '200px'
              }}
            />
            <button
              onClick={handleAddToQueue}
              disabled={processingAction}
              style={{
                padding: '8px 16px',
                background: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: processingAction ? 'not-allowed' : 'pointer',
                opacity: processingAction ? 0.7 : 1
              }}
            >
              Add to Queue
            </button>
          </div>
          <button
            onClick={handleRefreshQueue}
            disabled={processingAction}
            style={{
              padding: '8px 16px',
              background: '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: processingAction ? 'not-allowed' : 'pointer',
              opacity: processingAction ? 0.7 : 1
            }}
          >
            Refresh Queue
          </button>
          <button
            onClick={handleTriggerDuneQuery}
            disabled={processingAction}
            style={{
              padding: '8px 16px',
              background: '#9C27B0',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: processingAction ? 'not-allowed' : 'pointer',
              opacity: processingAction ? 0.7 : 1
            }}
          >
            Trigger Dune Query
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="number"
              value={batchSize}
              onChange={(e) => setBatchSize(Math.max(1, Math.min(50, parseInt(e.target.value) || 1)))}
              min="1"
              max="50"
              style={{ 
                width: '60px',
                padding: '8px',
                borderRadius: '4px',
                border: '1px solid #ddd'
              }}
            />
            <button
              onClick={handleProcessQueue}
              disabled={processingAction}
              style={{
                padding: '8px 16px',
                background: '#FF9800',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: processingAction ? 'not-allowed' : 'pointer',
                opacity: processingAction ? 0.7 : 1
              }}
            >
              Process Queue
            </button>
          </div>
        </div>
      </div>

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
                <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentActivity.map((item, index) => (
                <tr key={`${item.address}-${item.updated_at}-${index}`} style={{ borderTop: '1px solid #eee' }}>
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
                  <td style={{ padding: '12px' }}>
                    {item.status === 'failed' && (
                      <button
                        onClick={() => handleRetryAddress(item.address)}
                        disabled={processingAction}
                        style={{
                          padding: '4px 8px',
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: processingAction ? 'not-allowed' : 'pointer',
                          opacity: processingAction ? 0.7 : 1
                        }}
                      >
                        Retry
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Error Details */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
          <h3 style={{ color: '#666' }}>Error Details</h3>
          <button
            onClick={() => setShowErrorDetails(!showErrorDetails)}
            style={{
              padding: '4px 8px',
              background: showErrorDetails ? '#f44336' : '#2196F3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showErrorDetails ? 'Hide Details' : 'Show Details'}
          </button>
        </div>
        {showErrorDetails && (
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
                  <th style={{ padding: '12px', textAlign: 'left' }}>Error Message</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Total Failures</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Total Successes</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Total Runs</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {queueErrors.map((error, index) => (
                  <tr key={`${error.address}-${error.errors[0]?.updated_at}-${index}`} style={{ borderTop: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{error.address}</td>
                    <td style={{ padding: '12px' }}>
                      {error.errors.map((err, index) => (
                        <div key={index} style={{ marginBottom: index < error.errors.length - 1 ? '8px' : 0 }}>
                          <div style={{ color: '#f44336' }}>{err.error_message}</div>
                          <div style={{ fontSize: '0.8em', color: '#666' }}>
                            Last updated: {formatDate(err.updated_at)}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td style={{ padding: '12px' }}>{error.total_failures}</td>
                    <td style={{ padding: '12px' }}>{error.total_successes}</td>
                    <td style={{ padding: '12px' }}>{error.total_runs}</td>
                    <td style={{ padding: '12px' }}>
                      <button
                        onClick={() => handleRetryAddress(error.address)}
                        disabled={processingAction}
                        style={{
                          padding: '4px 8px',
                          background: '#2196F3',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: processingAction ? 'not-allowed' : 'pointer',
                          opacity: processingAction ? 0.7 : 1
                        }}
                      >
                        Retry
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
} 