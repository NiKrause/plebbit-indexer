import { cookies } from 'next/headers';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const cookieStore = cookies();
  const authToken = cookieStore.get('plebbit_admin_auth')?.value || '';

  return <AdminDashboard authToken={authToken} />;
} 