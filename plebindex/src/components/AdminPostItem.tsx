'use client';

import { useState } from 'react';
import { FlaggedPost } from '../types';
import { takeModerationAction } from '../api/admin';
import { truncateText } from '../utils/formatting';
import DownloadRaw from './DownloadRaw';

interface AdminPostItemProps {
  post: FlaggedPost;
}

export default function AdminPostItem({ post }: AdminPostItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Helper function to get status color and label
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'ignored':
        return { color: '#4CAF50', label: 'Ignored' };
      case 'deindexed_comment':
        return { color: '#ff9800', label: 'Post Removed' };
      case 'deindexed_author':
        return { color: '#f44336', label: 'Author Banned' };
      case 'deindexed_subplebbit':
        return { color: '#9c27b0', label: 'Subplebbit Banned' };
      default:
        return { color: '#ff4444', label: 'Pending' };
    }
  };

  const statusInfo = getStatusInfo(post.status);

  // Helper function to check if an action is available
  const isActionAvailable = (action: string) => {
    switch (action) {
      case 'ignore':
        return post.status !== 'ignored';
      case 'deindex_comment':
        return post.status !== 'deindexed_comment';
      case 'deindex_author':
        return post.status !== 'deindexed_author';
      case 'deindex_subplebbit':
        return post.status !== 'deindexed_subplebbit';
      default:
        return true;
    }
  };

  const handleModerationAction = async (postId: string, action: string) => {
    console.log("handleModerationAction", postId, action);
    try {
      setIsProcessing(true);
      await takeModerationAction(postId, action);
      setIsHidden(true); // Hide the post instead of removing from list
      alert(`Action ${action} taken successfully`);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  if (isHidden) {
    return null;
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div style={{
      border: '1px solid #ddd',
      margin: '10px 0',
      padding: '15px',
      borderRadius: '4px',
      background: 'white',
      opacity: isProcessing ? 0.6 : 1
    }}>
      {/* Post Header */}
      <div style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: '0', color: '#333' }}>
            {post.title || truncateText(post.content, 60) || 'No Title'}
          </h3>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ 
              padding: '3px 8px', 
              borderRadius: '12px', 
              backgroundColor: '#ff4444', 
              color: 'white', 
              fontSize: '0.8em' 
            }}>
              {post.reason}
            </span>
            {post.status !== 'pending' && (
              <span style={{ 
                padding: '3px 8px', 
                borderRadius: '12px', 
                backgroundColor: statusInfo.color, 
                color: 'white', 
                fontSize: '0.8em' 
              }}>
                {statusInfo.label}
              </span>
            )}
          </div>
        </div>
        <div style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
          Posted by {post.authorDisplayName} ({post.authorAddress}) in {post.subplebbitAddress}
        </div>
        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '3px' }}>
          {formatDate(post.timestamp)} | Flagged: {formatDate(parseInt(post.flagged_at))}
        </div>
        <div style={{ fontSize: '0.8em', color: '#888', marginTop: '3px', fontFamily: 'monospace' }}>
          ID: {post.id} | Post CID: {post.id} {post.postCid && `| Parent CID: ${post.parentCid}`}
        </div>
      </div>

      {/* Post Content */}
      <div style={{ 
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#f9f9f9',
        borderRadius: '4px',
        whiteSpace: 'pre-wrap'
      }}>
        {post.content}
        <div style={{ marginTop: '10px' }}>
          <DownloadRaw post={post} />
        </div>
      </div>

      {/* Post Stats */}
      <div style={{ 
        display: 'flex', 
        gap: '15px', 
        fontSize: '0.9em',
        color: '#666',
        marginBottom: '15px'
      }}>
        <span>👍 {post.upvoteCount}</span>
        <span>👎 {post.downvoteCount}</span>
        <span>💬 {post.replyCount}</span>
      </div>

      {/* Parent Post Info (if exists) */}
      {post.parentCid && (
        <div style={{
          marginBottom: '15px',
          padding: '10px',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          fontSize: '0.9em'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>In Reply To:</div>
          <div>{post.postTitle || 'Untitled Post'}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            by {post.postAuthorDisplayName || 'Unknown'} ({post.postAuthorAddress || 'Unknown'})
          </div>
        </div>
      )}

      {/* Moderation Actions */}
      <div style={{ 
        display: 'flex', 
        gap: '10px',
        marginTop: '15px',
        padding: '10px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px'
      }}>
        <button
          onClick={() => handleModerationAction(post.id, 'ignore')}
          disabled={isProcessing || !isActionAvailable('ignore')}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing || !isActionAvailable('ignore') ? 'not-allowed' : 'pointer',
            opacity: isProcessing || !isActionAvailable('ignore') ? 0.7 : 1
          }}
        >
          Ignore
        </button>
        <button
          onClick={() => handleModerationAction(post.id, 'deindex_comment')}
          disabled={isProcessing || !isActionAvailable('deindex_comment')}
          style={{
            padding: '8px 16px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing || !isActionAvailable('deindex_comment') ? 'not-allowed' : 'pointer',
            opacity: isProcessing || !isActionAvailable('deindex_comment') ? 0.7 : 1
          }}
        >
          Remove Post
        </button>
        <button
          onClick={() => handleModerationAction(post.id, 'deindex_author')}
          disabled={isProcessing || !isActionAvailable('deindex_author')}
          style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing || !isActionAvailable('deindex_author') ? 'not-allowed' : 'pointer',
            opacity: isProcessing || !isActionAvailable('deindex_author') ? 0.7 : 1
          }}
        >
          Ban Author
        </button>
        <button
          onClick={() => handleModerationAction(post.id, 'deindex_subplebbit')}
          disabled={isProcessing || !isActionAvailable('deindex_subplebbit')}
          style={{
            padding: '8px 16px',
            background: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing || !isActionAvailable('deindex_subplebbit') ? 'not-allowed' : 'pointer',
            opacity: isProcessing || !isActionAvailable('deindex_subplebbit') ? 0.7 : 1
          }}
        >
          Ban Subplebbit
        </button>
      </div>
    </div>
  );
} 