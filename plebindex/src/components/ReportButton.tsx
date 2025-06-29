'use client';

import { useState } from 'react';
import ReportModal from './ReportModal';

interface ReportButtonProps {
  postId: string;
}

export default function ReportButton({ postId }: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        style={{
          background: 'none',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '4px 8px',
          fontSize: '12px',
          color: '#888',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#f5f5f5';
          e.currentTarget.style.borderColor = '#999';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = '#ddd';
        }}
      >
        ⚠️ report
      </button>
      <ReportModal
        postId={postId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 