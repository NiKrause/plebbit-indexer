'use client';

import { useState, useEffect } from 'react';
import { FlaggedPost, AdminStats } from '../types';
import { fetchFlaggedPosts, getFlaggedPostsStats } from '../api/admin';
import AdminPostItem from './AdminPostItem';
import Pagination from './Pagination';

export default function AdminDashboard() {
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedReason, setSelectedReason] = useState('all');
  const postsPerPage = 10;

  const loadData = async (page: number, reason: string = 'all') => {
    const authToken = localStorage.getItem('plebbit_admin_auth');
    if (!authToken) {
      setError('No auth token found');
      return;
    }

    try {
      setLoading(true);
      const [postsData, statsData] = await Promise.all([
        fetchFlaggedPosts(page, postsPerPage, reason !== 'all' ? reason : undefined),
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
  };

  useEffect(() => {
    const authToken = localStorage.getItem('plebbit_admin_auth');
    if (authToken) {
      loadData(currentPage, selectedReason);
    }
  }, [currentPage, selectedReason]);

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
        <h1 style={{ color: '#333' }}>Content Moderation Admin</h1>
      </div>
      
      <div style={{
        background: '#f9f9f9',
        padding: '20px',
        marginBottom: '20px',
        borderRadius: '4px'
      }}>
        <div style={{ marginBottom: '15px' }}>
          <strong>Pending Reports: {stats?.total || 0}</strong>
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
                  key={`${stat.flag_reason}-${index}`}
                  onClick={() => {
                    setSelectedReason(stat.flag_reason);
                    setCurrentPage(1);
                  }}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '15px',
                    border: 'none',
                    background: selectedReason === stat.flag_reason ? '#007bff' : '#e9ecef',
                    color: selectedReason === stat.flag_reason ? 'white' : '#333',
                    cursor: 'pointer'
                  }}
                >
                  {stat.flag_reason} ({stat.count})
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
              <p>No pending reports.</p>
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
    </div>
  );
} 