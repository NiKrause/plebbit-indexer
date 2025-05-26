'use client';

import { useState } from 'react';
import { FlaggedPost } from '../types';
import { takeModerationAction } from '../api/admin';

interface AdminPostItemProps {
  post: FlaggedPost;
}

export default function AdminPostItem({ post }: AdminPostItemProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

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
            {post.title || 'No Title'}
          </h3>
          <span style={{ 
            padding: '3px 8px', 
            borderRadius: '12px', 
            backgroundColor: '#ff4444', 
            color: 'white', 
            fontSize: '0.8em' 
          }}>
            {post.reason}
          </span>
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
          <div>{post.parentTitle || 'Untitled Post'}</div>
          <div style={{ fontSize: '0.9em', color: '#666' }}>
            by {post.parentAuthorDisplayName || 'Unknown'} ({post.parentAuthorAddress || 'Unknown'})
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
          disabled={isProcessing}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.7 : 1
          }}
        >
          Ignore
        </button>
        <button
          onClick={() => handleModerationAction(post.id, 'deindex_comment')}
          disabled={isProcessing}
          style={{
            padding: '8px 16px',
            background: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.7 : 1
          }}
        >
          Remove Post
        </button>
        <button
          onClick={() => handleModerationAction(post.id, 'deindex_author')}
          disabled={isProcessing}
          style={{
            padding: '8px 16px',
            background: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.7 : 1
          }}
        >
          Ban Author
        </button>
        <button
          onClick={() => handleModerationAction(post.id, 'deindex_subplebbit')}
          disabled={isProcessing}
          style={{
            padding: '8px 16px',
            background: '#9c27b0',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            opacity: isProcessing ? 0.7 : 1
          }}
        >
          Ban Subplebbit
        </button>
      </div>
    </div>
  );
} 