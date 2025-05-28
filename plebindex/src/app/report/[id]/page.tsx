'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { submitReport } from '../../../api/posts';
import Link from 'next/link';

interface NotificationProps {
  type: 'success' | 'error';
  message: string;
  onClose: () => void;
}

function Notification({ type, message, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-close after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed top-4 right-4 z-50 max-w-sm w-full ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    } text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3">
            {type === 'success' ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>
          <p className="text-sm font-medium">{message}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-4 text-white hover:text-gray-200 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default function ReportPage({ params }: PageProps) {
  const [postId, setPostId] = useState<string>('');
  const searchParams = useSearchParams();
  const router = useRouter();
  const isModal = searchParams.get('modal') === 'true';
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Handle the async params
  useEffect(() => {
    params.then((resolvedParams) => {
      setPostId(resolvedParams.id);
    });
  }, [params]);

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
        
        setTimeout(() => {
          if (isModal) {
            router.back();
          } else {
            router.push('/');
          }
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

  const handleClose = () => {
    router.back();
  };

  // If it's a modal, render with modal styling
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Report Content</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {notification && (
            <div className={`mb-4 p-4 rounded-lg ${
              notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            } text-white`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{notification.message}</p>
                <button
                  onClick={closeNotification}
                  className="ml-4 text-white hover:text-gray-200"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reason" className="block text-sm font-medium mb-2">
                Please explain why you&apos;re reporting this content:
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., spam, harassment, inappropriate content..."
                className="w-full h-24 p-3 border border-gray-300 rounded-md resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md border border-gray-300 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // If it's not a modal, render as a full page
  return (
    <div className="max-w-lg mx-auto p-5">
      <h2 className="text-2xl font-bold mb-6">Report Content</h2>
      
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={closeNotification}
        />
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="reason" className="block text-sm font-medium mb-2">
            Please explain why you&apos;re reporting this content:
          </label>
          <textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., spam, harassment, inappropriate content..."
            className="w-full h-24 p-3 border border-gray-300 rounded-md resize-y focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
            disabled={isSubmitting}
          />
        </div>
        
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md transition-colors duration-200 flex items-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
          <Link
            href="/"
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md border border-gray-300 transition-colors duration-200 inline-block"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
} 