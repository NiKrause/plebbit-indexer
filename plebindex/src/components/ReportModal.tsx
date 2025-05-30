'use client';

import { useState } from 'react';
import { submitReport } from '../api/posts';

interface ReportModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportModal({ postId, isOpen, onClose }: ReportModalProps) {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      setNotification({
        type: 'error',
        message: 'Please provide a reason for reporting'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitReport(postId, reason);
      
      if (result.success) {
        setNotification({
          type: 'success',
          message: 'Report submitted successfully!'
        });
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        let errorMessage = 'Failed to submit report. Please try again.';
        if (result.error === 'network-error') {
          errorMessage = 'Network error while submitting report';
        }
        
        setNotification({
          type: 'error',
          message: errorMessage
        });
      }
    } catch (error) {
      console.error(error);
      setNotification({
        type: 'error',
        message: 'Unexpected error while submitting report'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeNotification = () => {
    setNotification(null);
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: 'rgba(26, 26, 27, 0.7)',
        backdropFilter: 'blur(2px)',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        isolation: 'isolate',
      }}
    >
      <div
        className="relative w-full max-w-md mx-2"
        style={{
          background: '#fff',
          borderRadius: 8,
          boxShadow: '0 4px 32px rgba(0,0,0,0.25), 0 0 0 1px #edeff1',
          border: '1px solid #edeff1',
          padding: 0,
          position: 'relative',
          zIndex: 10000,
        }}
      >
        {/* Modal Header */}
        <div
          style={{
            borderBottom: '1px solid #edeff1',
            padding: '16px 20px 12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#f6f7f8',
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 18, color: '#1a1a1b' }}>
            Report Content
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 22,
              color: '#878a8c',
              cursor: 'pointer',
              lineHeight: 1,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: 20 }}>
          {notification && (
            <div
              style={{
                background: notification.type === 'success' ? '#d4edda' : '#f8d7da',
                color: notification.type === 'success' ? '#155724' : '#721c24',
                border: `1px solid ${notification.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`,
                borderRadius: 4,
                padding: '8px 12px',
                marginBottom: 12,
                fontSize: 14,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{notification.message}</span>
                <button
                  onClick={closeNotification}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'inherit',
                    fontSize: 16,
                    cursor: 'pointer',
                  }}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label
              htmlFor="reason"
              style={{
                display: 'block',
                fontWeight: 500,
                fontSize: 15,
                marginBottom: 6,
                color: '#1a1a1b',
              }}
            >
              Why are you reporting this?
            </label>
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., spam, harassment, inappropriate content..."
              style={{
                width: '100%',
                minHeight: 70,
                border: '1px solid #edeff1',
                borderRadius: 4,
                padding: 10,
                fontSize: 15,
                background: '#f6f7f8',
                color: '#1a1a1b',
                marginBottom: 16,
                resize: 'vertical',
              }}
              required
              disabled={isSubmitting}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  background: '#edeff1',
                  color: '#878a8c',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontSize: 15,
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: '#ff4500',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  padding: '8px 16px',
                  fontWeight: 700,
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  fontSize: 15,
                  opacity: isSubmitting ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {isSubmitting && (
                  <svg className="animate-spin" style={{ height: 16, width: 16 }} fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 