import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  ArrowLeft,
  Building2,
  FileText,
  BarChart3,
  GitBranch,
  Settings,
  Plus,
  TrendingUp,
  Users,
  Calendar,
  Activity
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface ApplicationDetail {
  id: string;
  applicationId: string;
  name: string;
  description: string;
  status: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  settings: {
    theme: string;
    allowGuestAccess: boolean;
    enableWorkflows: boolean;
    enableReports: boolean;
  };
}

interface ApplicationStats {
  formsCount: number;
  submissionsCount: number;
  activeFormsCount: number;
  recentSubmissions: any[];
}

export const ApplicationDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const { data: appData, isLoading: appLoading } = useQuery<{ data: { application: ApplicationDetail } }>(
    ['application', id],
    () => api.get(`/applications/${id}`)
  );

  const { data: statsData, isLoading: statsLoading } = useQuery<{ data: { stats: ApplicationStats } }>(
    ['application-stats', id],
    () => api.get(`/applications/${id}/stats`)
  );

  const application = appData?.data?.application;
  const stats = statsData?.data?.stats;

  if (appLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Application not found.</p>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      active: 'badge badge-success',
      inactive: 'badge badge-warning',
      archived: 'badge badge-secondary'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge badge-secondary';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/applications" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{application.name}</h1>
            <p className="mt-1 text-gray-600">Application ID: {application.applicationId}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <span className={getStatusBadge(application.status)}>
            {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
          </span>
          <Link to={`/applications/${id}/settings`} className="btn btn-outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Link>
        </div>
      </div>

      {/* Application Info */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Details</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{application.description || 'No description provided'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-gray-900">
                    {application.createdBy.firstName} {application.createdBy.lastName}
                  </p>
                  <p className="text-sm text-gray-500">{application.createdBy.email}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-gray-900">{formatDate(application.createdAt, 'long')}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuration</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Theme</span>
                  <span className="text-sm font-medium text-gray-900 capitalize">
                    {application.settings.theme}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Guest Access</span>
                  <span className={`badge ${application.settings.allowGuestAccess ? 'badge-success' : 'badge-secondary'}`}>
                    {application.settings.allowGuestAccess ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Workflows</span>
                  <span className={`badge ${application.settings.enableWorkflows ? 'badge-success' : 'badge-secondary'}`}>
                    {application.settings.enableWorkflows ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Reports</span>
                  <span className={`badge ${application.settings.enableReports ? 'badge-success' : 'badge-secondary'}`}>
                    {application.settings.enableReports ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      ) : stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Forms</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.formsCount}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-gray-500">
                  {stats.activeFormsCount} active
                </span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Submissions</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.submissionsCount}</p>
                </div>
                <div className="p-3 bg-emerald-100 rounded-full">
                  <TrendingUp className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-green-600 font-medium">+12%</span>
                <span className="text-sm text-gray-500 ml-1">from last week</span>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-3xl font-bold text-gray-900">24</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-sm text-purple-600 font-medium">+5%</span>
                <span className="text-sm text-gray-500 ml-1">from last week</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to={`/applications/${id}/forms`}
              className="btn btn-outline flex items-center justify-center p-6 h-auto flex-col space-y-2 hover:bg-blue-50 hover:border-blue-300"
            >
              <FileText className="h-8 w-8 text-blue-600" />
              <span>Manage Forms</span>
            </Link>
            <Link
              to={`/applications/${id}/reports`}
              className="btn btn-outline flex items-center justify-center p-6 h-auto flex-col space-y-2 hover:bg-emerald-50 hover:border-emerald-300"
            >
              <BarChart3 className="h-8 w-8 text-emerald-600" />
              <span>View Reports</span>
            </Link>
            <Link
              to={`/applications/${id}/workflows`}
              className="btn btn-outline flex items-center justify-center p-6 h-auto flex-col space-y-2 hover:bg-purple-50 hover:border-purple-300"
            >
              <GitBranch className="h-8 w-8 text-purple-600" />
              <span>Setup Workflows</span>
            </Link>
            <Link
              to={`/applications/${id}/forms/builder`}
              className="btn btn-primary flex items-center justify-center p-6 h-auto flex-col space-y-2"
            >
              <Plus className="h-8 w-8" />
              <span>Create Form</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {stats?.recentSubmissions && stats.recentSubmissions.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Submissions
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {stats.recentSubmissions.slice(0, 5).map((submission, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 rounded-full">
                      <FileText className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Form Submission</p>
                      <p className="text-sm text-gray-500">
                        Submitted by {submission.submittedBy?.firstName} {submission.submittedBy?.lastName}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {formatDate(submission.createdAt, 'relative')}
                    </p>
                    <span className={`badge ${submission.status === 'submitted' ? 'badge-success' : 'badge-warning'}`}>
                      {submission.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};