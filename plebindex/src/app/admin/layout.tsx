'use client';

import { ReactNode, useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAuth = () => {
    const token = localStorage.getItem('plebbit_admin_auth');
    setAuthToken(token);
    setIsLoading(false);
  };

  useEffect(() => {
    // Check localStorage when component mounts
    checkAuth();

    // Listen for auth state changes
    window.addEventListener('authStateChange', checkAuth);

    return () => {
      window.removeEventListener('authStateChange', checkAuth);
    };
  }, []);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!authToken) {
    return <AdminAuth />;
  }

  return (
    <div className="admin-layout">
      {children}
    </div>
  );
} 