'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

/**
 * Component to protect routes that only HR CEO and HR Manager can access
 */
export default function HROnlyRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    // Check if user has HR access based on position
    const hasHRAccess = user && (user.position === 'HR CEO' || user.position === 'HR Manager');
    
    if (!user) {
      router.push('/login');
    } else if (!hasHRAccess) {
      // Redirect employees to their dashboard
      router.push('/employee-dashboard');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600 mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-medium">Loading...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we verify your access</p>
        </div>
      </div>
    );
  }

  // Check access based on position
  const hasHRAccess = user && (user.position === 'HR CEO' || user.position === 'HR Manager');
  
  if (!user) {
    return null; // Will redirect
  }

  if (!hasHRAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-orange-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl shadow-lg p-8 max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700 mb-6">
            This page is only accessible to HR CEO and HR Manager.
          </p>
          <button
            onClick={() => router.push('/employee-dashboard')}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Go to My Dashboard
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

