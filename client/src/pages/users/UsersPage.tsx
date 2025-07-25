import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  Users, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Mail,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff' | 'user';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  permissions?: Array<{
    resource: string;
    actions: string[];
  }>;
}

export const UsersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, error } = useQuery<{ data: { users: User[]; pagination: any } }>(
    ['users', currentPage, searchTerm, roleFilter, statusFilter],
    () => api.get('/users', {
      params: {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        role: roleFilter || undefined,
        isActive: statusFilter ? statusFilter === 'active' : undefined
      }
    }),
    {
      keepPreviousData: true
    }
  );

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination;

  const getRoleBadge = (role: string) => {
    const roleClasses = {
      super_admin: 'badge badge-danger',
      admin: 'badge badge-warning',
      manager: 'badge badge-primary',
      staff: 'badge badge-secondary',
      user: 'badge badge-success'
    };
    return roleClasses[role as keyof typeof roleClasses] || 'badge badge-secondary';
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 'badge badge-success' : 'badge badge-secondary';
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
          <p className="text-red-600">Failed to load users. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">
            Manage user accounts, roles, and permissions across your applications.
          </p>
        </div>
        <button className="btn btn-primary">
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </button>
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
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="select w-full"
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="staff">Staff</option>
                <option value="user">User</option>
              </select>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="select w-full"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className="btn btn-outline">
              <Filter className="h-4 w-4 mr-2" />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {users.length > 0 ? (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-cell">User</th>
                  <th className="table-cell">Role</th>
                  <th className="table-cell">Status</th>
                  <th className="table-cell">Last Login</th>
                  <th className="table-cell">Created</th>
                  <th className="table-cell">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium">
                            {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={getRoleBadge(user.role)}>
                        {user.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={getStatusBadge(user.isActive)}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell">
                      {user.lastLogin ? (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(user.lastLogin, 'relative')}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Never</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(user.createdAt, 'short')}
                      </div>
                    </td>
                    <td className="table-cell">
                      <div className="relative group">
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <div className="py-1">
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Edit className="h-4 w-4 mr-2" />
                              Edit User
                            </button>
                            <button className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <Shield className="h-4 w-4 mr-2" />
                              Manage Permissions
                            </button>
                            {user.isActive ? (
                              <button className="flex items-center w-full px-4 py-2 text-sm text-orange-600 hover:bg-orange-50">
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </button>
                            ) : (
                              <button className="flex items-center w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50">
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </button>
                            )}
                            <button className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete User
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
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm || roleFilter || statusFilter
                ? 'No users match your current filters.'
                : 'Get started by adding your first user.'}
            </p>
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First User
            </button>
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