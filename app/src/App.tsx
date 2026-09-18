import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import { PublicOnlyRoute } from './components/PublicOnlyRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { ClientsPage } from './pages/ClientsPage';
import { WorkshopsPage } from './pages/WorkshopsPage';
import { WorkshopDetailPage } from './pages/WorkshopDetailPage';
import { InvoicesPage } from './pages/InvoicesPage';
import { InvoiceEditorPage } from './pages/InvoiceEditorPage';
import { OperationsBoardPage } from './pages/OperationsBoardPage';
import { TrelloSettingsPage } from './pages/TrelloSettingsPage';
import { TeamPage } from './pages/TeamPage';
import { WorkspacePage } from './pages/WorkspacePage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/login"
          element={
            <PublicOnlyRoute>
              <LoginPage />
            </PublicOnlyRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicOnlyRoute>
              <RegisterPage />
            </PublicOnlyRoute>
          }
        />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        {/* Reset password is reached via an emailed recovery link; it must
            stay reachable even though a temporary recovery session exists. */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/dashboard"
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/clients"
          element={
            <AdminRoute>
              <ClientsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/workshops"
          element={
            <ProtectedRoute>
              <WorkshopsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/workshops/:id"
          element={
            <ProtectedRoute>
              <WorkshopDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoices"
          element={
            <AdminRoute>
              <InvoicesPage />
            </AdminRoute>
          }
        />
        <Route
          path="/invoices/new"
          element={
            <AdminRoute>
              <InvoiceEditorPage />
            </AdminRoute>
          }
        />
        <Route
          path="/invoices/:id"
          element={
            <AdminRoute>
              <InvoiceEditorPage />
            </AdminRoute>
          }
        />

        <Route
          path="/dashboard/operations"
          element={
            <ProtectedRoute>
              <OperationsBoardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/trello-settings"
          element={
            <AdminRoute>
              <TrelloSettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/dashboard/team"
          element={
            <AdminRoute>
              <TeamPage />
            </AdminRoute>
          }
        />
        <Route
          path="/workspace"
          element={
            <ProtectedRoute>
              <WorkspacePage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}
