'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminAuth() {
  const [authKey, setAuthKey] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!authKey.trim()) {
      setError('Please enter auth key');
      return;
    }

    localStorage.setItem('plebbit_admin_auth', authKey);
    // Dispatch a custom event when auth state changes
    window.dispatchEvent(new Event('authStateChange'));
    router.push('/admin');
  };

  return (
    <div style={{
      maxWidth: '500px',
      margin: '40px auto',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2>Admin Access</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          value={authKey}
          onChange={(e) => setAuthKey(e.target.value)}
          placeholder="Enter auth key"
          required
          style={{
            padding: '10px',
            margin: '10px 0',
            width: '100%',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        />
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            margin: '10px 0',
            background: '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Access Admin
        </button>
        {error && (
          <div style={{ color: 'red', margin: '10px 0' }}>
            {error}
          </div>
        )}
      </form>
    </div>
  );
} 