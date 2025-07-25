import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Calendar,
  User,
  ArrowLeft
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface Form {
  id: string;
  formId: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'inactive' | 'archived';
  version: string;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export const FormsPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery<{ data: { forms: Form[]; pagination: any } }>(
    ['forms', applicationId, currentPage, searchTerm, statusFilter],
    () => api.get('/forms', {
      params: {
        applicationId,
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        status: statusFilter || undefined
      }
    }),
    {
      keepPreviousData: true
    }
  );

  const forms = data?.data?.forms || [];
  const pagination = data?.data?.pagination;

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'badge badge-secondary',
      active: 'badge badge-success',
      inactive: 'badge badge-warning',
      archived: 'badge badge-secondary'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge badge-secondary';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load forms. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {applicationId && (
            <Link to={`/applications/${applicationId}`} className="text-gray-400 hover:text-gray-600">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Forms</h1>
            <p className="mt-2 text-gray-600">
              Create and manage forms for data collection and user interaction.
            </p>
          </div>
        </div>
        <Link 
          to={applicationId ? `/applications/${applicationId}/forms/builder` : '/forms/builder'} 
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Link>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select w-full"
              >
                <option value="">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <button className="btn btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Forms Grid */}
      {forms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {forms.map((form) => (
            <div key={form.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <FileText className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{form.name}</h3>
                      <p className="text-sm text-gray-500">v{form.version}</p>
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        <Link
                          to={`/forms/${form.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Form
                        </Link>
                        <Link
                          to={`/forms/${form.id}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Form
                        </Link>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </button>
                        <Link
                          to={`/forms/${form.id}/submissions`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Submissions
                        </Link>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {form.description || 'No description provided'}
                </p>

                <div className="flex items-center justify-between mb-4">
                  <span className={getStatusBadge(form.status)}>
                    {form.status.charAt(0).toUpperCase() + form.status.slice(1)}
                  </span>
                </div>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created {formatDate(form.createdAt, 'relative')}
                  </div>
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {form.createdBy.firstName} {form.createdBy.lastName}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                  <Link
                    to={`/forms/${form.id}/edit`}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    Edit Form
                  </Link>
                  <Link
                    to={`/forms/${form.id}/submissions`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    View Data
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No forms found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter
                ? 'No forms match your current filters.'
                : 'Get started by creating your first form.'}
            </p>
            <Link 
              to={applicationId ? `/applications/${applicationId}/forms/builder` : '/forms/builder'} 
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Form
            </Link>
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
            {Math.min(currentPage * pagination.limit, pagination.total)} of{' '}
            {pagination.total} results
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="btn btn-outline btn-sm"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(pagination.pages, currentPage + 1))}
              disabled={currentPage === pagination.pages}
              className="btn btn-outline btn-sm"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};