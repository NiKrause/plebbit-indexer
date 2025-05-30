'use client';

import { useState, useEffect, useCallback } from 'react';
import { FlaggedPost, AdminStats } from '../types';
import { fetchFlaggedPosts, getFlaggedPostsStats } from '../api/admin';
import AdminPostItem from './AdminPostItem';
import Pagination from './Pagination';
import QueueStats from './QueueStats';

export default function AdminDashboard() {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReason, setSelectedReason] = useState('all');
  const [activeTab, setActiveTab] = useState<'pending' | 'moderated'>('pending');
  const [activeMenu, setActiveMenu] = useState<'queue' | 'reports'>('queue');
  const postsPerPage = 10;

  const loadData = useCallback(async (page: number, reason: string = 'all') => {
    const authToken = localStorage.getItem('plebbit_admin_auth');
    if (!authToken) {
      setError('No auth token found');
      return;
    }

    try {
      setLoading(true);
      const [postsData, statsData] = await Promise.all([
        fetchFlaggedPosts(page, postsPerPage, reason !== 'all' ? reason : undefined, activeTab),
        getFlaggedPostsStats()
      ]);
      
      if (postsData) {
        console.log("postsData", postsData);
        setFlaggedPosts(postsData.flagged_posts);
        setTotalPages(postsData.pagination.pages);
      }
      
      if (statsData) {
        console.log("statsData", statsData);
        setStats(statsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, postsPerPage]);

  useEffect(() => {
    const authToken = localStorage.getItem('plebbit_admin_auth');
    if (authToken) {
      loadData(currentPage, selectedReason);
    }
  }, [currentPage, selectedReason, activeTab, loadData]);

  if (error) {
    return <div style={{ color: 'red', padding: '20px' }}>Error: {error}</div>;
  }

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#333' }}>Plebindex Crawler & Content Moderation Admin</h1>
      </div>
      
      {/* Menu Navigation */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd' }}>
          <button
            onClick={() => setActiveMenu('queue')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeMenu === 'queue' ? '2px solid #007bff' : 'none',
              color: activeMenu === 'queue' ? '#007bff' : '#666',
              cursor: 'pointer',
              fontWeight: activeMenu === 'queue' ? 'bold' : 'normal'
            }}
          >
            Queue Stats
          </button>
          <button
            onClick={() => setActiveMenu('reports')}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: 'none',
              borderBottom: activeMenu === 'reports' ? '2px solid #007bff' : 'none',
              color: activeMenu === 'reports' ? '#007bff' : '#666',
              cursor: 'pointer',
              fontWeight: activeMenu === 'reports' ? 'bold' : 'normal'
            }}
          >
            Reports
          </button>
        </div>
      </div>
      
      {activeMenu === 'queue' ? (
        <QueueStats />
      ) : (
        <>
          {/* Reports Tabs */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #ddd' }}>
              <button
                onClick={() => setActiveTab('pending')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'pending' ? '2px solid #007bff' : 'none',
                  color: activeTab === 'pending' ? '#007bff' : '#666',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'pending' ? 'bold' : 'normal'
                }}
              >
                Pending ({stats?.pending || 0})
              </button>
              <button
                onClick={() => setActiveTab('moderated')}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: 'none',
                  borderBottom: activeTab === 'moderated' ? '2px solid #007bff' : 'none',
                  color: activeTab === 'moderated' ? '#007bff' : '#666',
                  cursor: 'pointer',
                  fontWeight: activeTab === 'moderated' ? 'bold' : 'normal'
                }}
              >
                Moderated ({stats?.moderated || 0})
              </button>
            </div>
          </div>

          <div style={{
            background: '#f9f9f9',
            padding: '20px',
            marginBottom: '20px',
            borderRadius: '4px'
          }}>
            <div style={{ marginBottom: '15px' }}>
              <strong>Total Reports: {stats?.total || 0}</strong>
            </div>
            
            {stats && stats.stats.length > 0 && (
              <div>
                <div style={{ marginBottom: '10px' }}>Filter by reason:</div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => {
                      setSelectedReason('all');
                      setCurrentPage(1);
                    }}
                    style={{
                      padding: '5px 10px',
                      borderRadius: '15px',
                      border: 'none',
                      background: selectedReason === 'all' ? '#007bff' : '#e9ecef',
                      color: selectedReason === 'all' ? 'white' : '#333',
                      cursor: 'pointer'
                    }}
                  >
                    All
                  </button>
                  {stats.stats.map((stat, index) => (
                    <button
                      key={`${stat.reason}-${index}`}
                      onClick={() => {
                        setSelectedReason(stat.reason);
                        setCurrentPage(1);
                      }}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '15px',
                        border: 'none',
                        background: selectedReason === stat.reason ? '#007bff' : '#e9ecef',
                        color: selectedReason === stat.reason ? 'white' : '#333',
                        cursor: 'pointer'
                      }}
                    >
                      {stat.reason} ({stat.count})
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
          ) : (
            <>
              <div>
                {flaggedPosts.length === 0 ? (
                  <p>No {activeTab} reports.</p>
                ) : (
                  flaggedPosts.map(post => (
                    <AdminPostItem key={post.id} post={post} />
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div style={{ marginTop: '20px' }}>
                  <Pagination
                    pagination={{
                      page: currentPage,
                      pages: totalPages,
                      total: stats?.total || 0,
                      limit: postsPerPage
                    }}
                    searchTerm=""
                    sort="new"
                    timeFilter="all"
                    includeReplies={false}
                    postId=""
                  />
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
} 