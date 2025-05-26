'use client';

import { ReactNode, useEffect, useState } from 'react';
import AdminAuth from '@/components/AdminAuth';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check localStorage when component mounts
    const token = localStorage.getItem('plebbit_admin_auth');
    setAuthToken(token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading...</div>; // Or a proper loading spinner
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