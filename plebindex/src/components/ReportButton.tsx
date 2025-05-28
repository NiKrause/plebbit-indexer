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
          color: '#888',
          textDecoration: 'underline',
          fontSize: 12,
          background: 'none',
          border: 'none',
          padding: 0,
          cursor: 'pointer',
        }}
      >
        report
      </button>
      <ReportModal
        postId={postId}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
} 