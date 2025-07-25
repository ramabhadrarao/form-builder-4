import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft,
  Search, 
  Filter, 
  Download, 
  Eye,
  Edit,
  Trash2,
  Calendar,
  User,
  FileText,
  MoreVertical
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface FormSubmission {
  id: string;
  submissionId: string;
  data: Record<string, any>;
  status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected';
  submittedBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  workflowState?: {
    currentStage: string;
    history: any[];
  };
}

export const FormSubmissionsPage: React.FC = () => {
  const { applicationId, formId } = useParams<{ applicationId: string; formId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery<{ data: { submissions: FormSubmission[]; pagination: any } }>(
    ['form-submissions', formId, currentPage, searchTerm, statusFilter],
    () => api.get(`/forms/${formId}/submissions`, {
      params: {
        page: currentPage,
        limit: 10,
        status: statusFilter || undefined
      }
    }),
    {
      keepPreviousData: true
    }
  );

  const submissions = data?.data?.submissions || [];
  const pagination = data?.data?.pagination;

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      draft: 'badge badge-secondary',
      submitted: 'badge badge-primary',
      in_review: 'badge badge-warning',
      approved: 'badge badge-success',
      rejected: 'badge badge-danger'
    };
    return statusClasses[status as keyof typeof statusClasses] || 'badge badge-secondary';
  };

  const exportData = async (format: 'csv' | 'excel' | 'json') => {
    try {
      const response = await api.get(`/forms/${formId}/export`, {
        params: { format },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `form_submissions.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
    }
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
          <p className="text-red-600">Failed to load submissions. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link 
            to={applicationId ? `/applications/${applicationId}/forms` : '/forms'} 
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Form Submissions</h1>
            <p className="mt-2 text-gray-600">
              View and manage all submissions for this form.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="relative group">
            <button className="btn btn-outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
              <div className="py-1">
                <button
                  onClick={() => exportData('csv')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as CSV
                </button>
                <button
                  onClick={() => exportData('excel')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as Excel
                </button>
                <button
                  onClick={() => exportData('json')}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Export as JSON
                </button>
              </div>
            </div>
          </div>
        </div>
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
                  placeholder="Search submissions..."
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
                <option value="submitted">Submitted</option>
                <option value="in_review">In Review</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <button className="btn btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Submissions Table */}
      {submissions.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">Submission ID</th>
                  <th className="table-cell">Submitted By</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Submitted Date</th>
                  <th className="table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((submission) => (
                  <tr key={submission.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-gray-400" />
                        <span className="font-mono text-sm">{submission.submissionId}</span>
                      </div>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-900">
                          {submission.submittedBy.firstName} {submission.submittedBy.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{submission.submittedBy.email}</p>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={getStatusBadge(submission.status)}>
                        {submission.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(submission.createdAt, 'short')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            <Link
                              to={`/submissions/${submission.submissionId}`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Link>
                            <Link
                              to={`/submissions/${submission.submissionId}/edit`}
                              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No submissions found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || statusFilter
                ? 'No submissions match your current filters.'
                : 'This form hasn\'t received any submissions yet.'}
            </p>
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