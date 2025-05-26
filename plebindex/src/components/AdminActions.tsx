'use client';

export default function AdminActions() {
  const handleLogout = () => {
    localStorage.removeItem('plebbit_admin_auth');
    window.location.reload();
  };

  return (
    <button
      onClick={handleLogout}
      style={{
        padding: '8px 16px',
        background: '#f0f0f0',
        border: '1px solid #ccc',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Logout
    </button>
  );
} 