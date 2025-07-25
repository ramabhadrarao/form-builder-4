import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { LoadingSpinner } from './components/ui/LoadingSpinner';

// Layouts
import { AuthLayout } from './layouts/AuthLayout';
import { DashboardLayout } from './layouts/DashboardLayout';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';

// Dashboard Pages
import { DashboardHome } from './pages/dashboard/DashboardHome';
import { ApplicationsPage } from './pages/applications/ApplicationsPage';
import { ApplicationDetailPage } from './pages/applications/ApplicationDetailPage';
import { FormsPage } from './pages/forms/FormsPage';
import { FormBuilderPage } from './pages/forms/FormBuilderPage';
import { FormSubmissionsPage } from './pages/forms/FormSubmissionsPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ReportBuilderPage } from './pages/reports/ReportBuilderPage';
import { WorkflowsPage } from './pages/workflows/WorkflowsPage';
import { WorkflowBuilderPage } from './pages/workflows/WorkflowBuilderPage';
import { UsersPage } from './pages/users/UsersPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ProfilePage } from './pages/profile/ProfilePage';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

// Public Route Component (redirect if authenticated)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return !isAuthenticated ? <>{children}</> : <Navigate to="/dashboard" replace />;
};

function App() {
  const { initializeAuth } = useAuthStore();

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={
        <PublicRoute>
          <AuthLayout>
            <LoginPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/register" element={
        <PublicRoute>
          <AuthLayout>
            <RegisterPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/forgot-password" element={
        <PublicRoute>
          <AuthLayout>
            <ForgotPasswordPage />
          </AuthLayout>
        </PublicRoute>
      } />
      
      <Route path="/reset-password" element={
        <PublicRoute>
          <AuthLayout>
            <ResetPasswordPage />
          </AuthLayout>
        </PublicRoute>
      } />

      {/* Protected Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <DashboardLayout>
            <DashboardHome />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ApplicationsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:id" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ApplicationDetailPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/forms" element={
        <ProtectedRoute>
          <DashboardLayout>
            <FormsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/forms/builder" element={
        <ProtectedRoute>
          <DashboardLayout>
            <FormBuilderPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/forms/builder/:formId" element={
        <ProtectedRoute>
          <DashboardLayout>
            <FormBuilderPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/forms/:formId/submissions" element={
        <ProtectedRoute>
          <DashboardLayout>
            <FormSubmissionsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/reports" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ReportsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/reports/builder" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ReportBuilderPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/workflows" element={
        <ProtectedRoute>
          <DashboardLayout>
            <WorkflowsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/applications/:applicationId/workflows/builder" element={
        <ProtectedRoute>
          <DashboardLayout>
            <WorkflowBuilderPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute>
          <DashboardLayout>
            <UsersPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/settings" element={
        <ProtectedRoute>
          <DashboardLayout>
            <SettingsPage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute>
          <DashboardLayout>
            <ProfilePage />
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      
      {/* 404 fallback */}
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
            <p className="text-gray-600 mb-8">Page not found</p>
            <a href="/dashboard" className="btn-primary">
              Go to Dashboard
            </a>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;