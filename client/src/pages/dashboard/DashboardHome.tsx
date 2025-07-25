import React from 'react';
import { useQuery } from 'react-query';
import { 
  Building2, 
  FileText, 
  BarChart3, 
  GitBranch, 
  Users, 
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { formatDate } from '../../lib/utils';
import api from '../../lib/api';

interface DashboardStats {
  applications: { total: number; active: number };
  forms: { total: number; active: number };
  reports: { total: number; custom: number; automated: number };
  workflows: { total: number; active: number };
  users: { total: number; active: number };
}

interface Activity {
  type: string;
  action: string;
  item: { id: string; name: string };
  user: { firstName: string; lastName: string };
  timestamp: string;
}

export const DashboardHome: React.FC = () => {
  const { data: statsData, isLoading: statsLoading } = useQuery<{ data: { stats: DashboardStats } }>(
    'dashboard-stats',
    () => api.get('/dashboard/stats')
  );

  const { data: activityData, isLoading: activityLoading } = useQuery<{ data: { activities: Activity[] } }>(
    'dashboard-activity',
    () => api.get('/dashboard/activity')
  );

  const stats = statsData?.data?.stats;
  const activities = activityData?.data?.activities || [];

  const statCards = [
    {
      name: 'Applications',
      value: stats?.applications?.total || 0,
      change: '+12%',
      changeType: 'positive',
      icon: Building2,
      color: 'bg-blue-500'
    },
    {
      name: 'Forms',
      value: stats?.forms?.total || 0,
      change: '+8%',
      changeType: 'positive',
      icon: FileText,
      color: 'bg-emerald-500'
    },
    {
      name: 'Reports',
      value: stats?.reports?.total || 0,
      change: '+23%',
      changeType: 'positive',
      icon: BarChart3,
      color: 'bg-purple-500'
    },
    {
      name: 'Workflows',
      value: stats?.workflows?.total || 0,
      change: '+5%',
      changeType: 'positive',
      icon: GitBranch,
      color: 'bg-orange-500'
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'application':
        return Building2;
      case 'form':
        return FileText;
      case 'report':
        return BarChart3;
      case 'workflow':
        return GitBranch;
      default:
        return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'application':
        return 'text-blue-600 bg-blue-100';
      case 'form':
        return 'text-emerald-600 bg-emerald-100';
      case 'report':
        return 'text-purple-600 bg-purple-100';
      case 'workflow':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening with your applications.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="card">
              <div className="card-body">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                  <span className="text-sm text-gray-500 ml-1">from last month</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recent Activity
            </h3>
          </div>
          <div className="card-body">
            {activityLoading ? (
              <div className="flex items-center justify-center h-32">
                <LoadingSpinner />
              </div>
            ) : activities.length > 0 ? (
              <div className="space-y-4">
                {activities.slice(0, 5).map((activity, index) => {
                  const ActivityIcon = getActivityIcon(activity.type);
                  const colorClass = getActivityColor(activity.type);
                  
                  return (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`p-2 rounded-full ${colorClass}`}>
                        <ActivityIcon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">
                          <span className="font-medium">
                            {activity.user.firstName} {activity.user.lastName}
                          </span>{' '}
                          {activity.action} {activity.type}{' '}
                          <span className="font-medium">{activity.item.name}</span>
                        </p>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {formatDate(activity.timestamp, 'relative')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No recent activity</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Quick Stats
            </h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center">
                  <Building2 className="h-8 w-8 text-blue-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Active Applications</p>
                    <p className="text-sm text-gray-600">Currently running</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {stats?.applications?.active || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-emerald-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Active Forms</p>
                    <p className="text-sm text-gray-600">Accepting submissions</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-emerald-600">
                  {stats?.forms?.active || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-purple-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">Active Users</p>
                    <p className="text-sm text-gray-600">Currently active</p>
                  </div>
                </div>
                <span className="text-2xl font-bold text-purple-600">
                  {stats?.users?.active || 0}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="btn btn-outline flex items-center justify-center p-6 h-auto flex-col space-y-2">
              <Building2 className="h-8 w-8 text-blue-600" />
              <span>Create Application</span>
            </button>
            <button className="btn btn-outline flex items-center justify-center p-6 h-auto flex-col space-y-2">
              <FileText className="h-8 w-8 text-emerald-600" />
              <span>Build Form</span>
            </button>
            <button className="btn btn-outline flex items-center justify-center p-6 h-auto flex-col space-y-2">
              <BarChart3 className="h-8 w-8 text-purple-600" />
              <span>Create Report</span>
            </button>
            <button className="btn btn-outline flex items-center justify-center p-6 h-auto flex-col space-y-2">
              <GitBranch className="h-8 w-8 text-orange-600" />
              <span>Setup Workflow</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};