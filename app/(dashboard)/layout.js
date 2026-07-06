'use client';

import { AuthProvider } from '@/lib/authContext';
import DashboardLayout from '@/components/layout/DashboardLayout';

/**
 * Shared layout for all authenticated dashboard pages.
 * AuthProvider and DashboardLayout are mounted ONCE and persist
 * across all child route navigations - no re-fetching auth/me
 * or re-rendering the sidebar on every page change.
 */
export default function DashboardGroupLayout({ children }) {
  return (
    <AuthProvider>
      <DashboardLayout>
        {children}
      </DashboardLayout>
    </AuthProvider>
  );
}
