import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { useParams, Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Filter, 
  GitBranch, 
  MoreVertical,
  Edit,
  Copy,
  Trash2,
  Eye,
  Calendar,
  User,
  ArrowLeft,
  Play,
  Pause
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface Workflow {
  id: string;
  workflowId: string;
  name: string;
  description: string;
  formId: string;
  stages: Array<{
    id: string;
    name: string;
    role: string;
    users: string[];
    actions: string[];
  }>;
  createdAt: string;
  createdBy: {
    firstName: string;
    lastName: string;
    email: string;
  };
  settings: {
    autoProgress: boolean;
    enableEscalation: boolean;
    escalationTime: number;
  };
}

export const WorkflowsPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery<{ data: { workflows: Workflow[]; pagination: any } }>(
    ['workflows', applicationId, currentPage, searchTerm],
    () => api.get('/workflows', {
      params: {
        applicationId,
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined
      }
    }),
    {
      keepPreviousData: true
    }
  );

  const workflows = data?.data?.workflows || [];
  const pagination = data?.data?.pagination;

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
          <p className="text-red-600">Failed to load workflows. Please try again.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
            <p className="mt-2 text-gray-600">
              Create and manage multi-stage approval workflows for your forms.
            </p>
          </div>
        </div>
        <Link 
          to={applicationId ? `/applications/${applicationId}/workflows/builder` : '/workflows/builder'} 
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Workflow
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
                  placeholder="Search workflows..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <button className="btn btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Workflows Grid */}
      {workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div key={workflow.id} className="card hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <GitBranch className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{workflow.name}</h3>
                      <p className="text-sm text-gray-500">ID: {workflow.workflowId}</p>
                    </div>
                  </div>
                  <div className="relative group">
                    <button className="text-gray-400 hover:text-gray-600">
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <div className="py-1">
                        <Link
                          to={`/workflows/${workflow.id}`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Workflow
                        </Link>
                        <Link
                          to={`/workflows/${workflow.id}/edit`}
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Workflow
                        </Link>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Play className="h-4 w-4 mr-2" />
                          Activate
                        </button>
                        <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {workflow.description || 'No description provided'}
                </p>

                {/* Workflow Stages */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Stages ({workflow.stages.length})</h4>
                  <div className="flex flex-wrap gap-1">
                    {workflow.stages.slice(0, 3).map((stage, index) => (
                      <span key={stage.id} className="badge badge-secondary text-xs">
                        {stage.name}
                      </span>
                    ))}
                    {workflow.stages.length > 3 && (
                      <span className="badge badge-secondary text-xs">
                        +{workflow.stages.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Settings */}
                <div className="mb-4 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Auto Progress</span>
                    <span className={`badge ${workflow.settings.autoProgress ? 'badge-success' : 'badge-secondary'}`}>
                      {workflow.settings.autoProgress ? 'On' : 'Off'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Escalation</span>
                    <span className={`badge ${workflow.settings.enableEscalation ? 'badge-warning' : 'badge-secondary'}`}>
                      {workflow.settings.enableEscalation ? `${workflow.settings.escalationTime}h` : 'Off'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    Created {formatDate(workflow.createdAt, 'relative')}
                  </div>
                  <div className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {workflow.createdBy.firstName} {workflow.createdBy.lastName}
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-2">
                  <Link
                    to={`/workflows/${workflow.id}/edit`}
                    className="btn btn-outline btn-sm flex-1"
                  >
                    Edit
                  </Link>
                  <Link
                    to={`/workflows/${workflow.id}`}
                    className="btn btn-primary btn-sm flex-1"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card">
          <div className="card-body text-center py-12">
            <GitBranch className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'No workflows match your current search.'
                : 'Get started by creating your first workflow.'}
            </p>
            <Link 
              to={applicationId ? `/applications/${applicationId}/workflows/builder` : '/workflows/builder'} 
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Workflow
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