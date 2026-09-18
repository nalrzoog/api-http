import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { FullPageSpinner } from './FullPageSpinner';

/** Admin-only pages (financial data, team/Trello settings). An employee who
 * reaches one of these routes - including by typing the URL directly - is
 * redirected to their workspace instead of seeing the page; the underlying
 * data is also denied at the RLS level, this is the UX-level guard. */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) return <FullPageSpinner />;
  if (!session) return <Navigate to="/login" replace />;
  if (profile && profile.role !== 'admin') return <Navigate to="/workspace" replace />;
  return <>{children}</>;
}
