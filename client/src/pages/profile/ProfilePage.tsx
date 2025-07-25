import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  User, 
  Mail, 
  Lock, 
  Save, 
  Camera,
  Eye,
  EyeOff,
  Shield,
  Calendar,
  MapPin
} from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../stores/authStore';
import { formatDate } from '../../lib/utils';
import toast from 'react-hot-toast';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phone: '',
      location: '',
      bio: ''
    }
  });

  const passwordForm = useForm<PasswordFormData>();

  const onProfileSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    try {
      await updateProfile({
        firstName: data.firstName,
        lastName: data.lastName
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      passwordForm.setError('confirmPassword', {
        message: 'Passwords do not match'
      });
      return;
    }

    setIsLoading(true);
    try {
      // API call to change password
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (error) {
      toast.error('Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="mt-2 text-gray-600">
          Manage your account settings and preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Profile Sidebar */}
        <div className="lg:w-80">
          <div className="card">
            <div className="card-body text-center">
              {/* Profile Picture */}
              <div className="relative inline-block mb-4">
                <div className="h-24 w-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-white text-2xl font-bold">
                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                  </span>
                </div>
                <button className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow-lg border border-gray-200 hover:bg-gray-50">
                  <Camera className="h-4 w-4 text-gray-600" />
                </button>
              </div>

              {/* User Info */}
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-gray-600 mb-3">{user?.email}</p>
              
              <span className={getRoleBadge(user?.role || 'user')}>
                {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </span>

              {/* Account Stats */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Member since</p>
                    <p className="font-medium text-gray-900">
                      {user?.createdAt ? formatDate(user.createdAt, 'short') : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Last login</p>
                    <p className="font-medium text-gray-900">
                      {user?.lastLogin ? formatDate(user.lastLogin, 'relative') : 'Never'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="mt-6 space-y-1">
            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'profile'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <User className="h-5 w-5 mr-3" />
              Profile Information
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'security'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Lock className="h-5 w-5 mr-3" />
              Security
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'permissions'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Shield className="h-5 w-5 mr-3" />
              Permissions
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {activeTab === 'profile' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
                <p className="text-sm text-gray-600">Update your personal information and contact details.</p>
              </div>
              <div className="card-body">
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">First Name</label>
                      <input
                        {...profileForm.register('firstName', { required: 'First name is required' })}
                        type="text"
                        className={`input w-full ${profileForm.formState.errors.firstName ? 'input-error' : ''}`}
                      />
                      {profileForm.formState.errors.firstName && (
                        <p className="form-error">{profileForm.formState.errors.firstName.message}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label className="form-label">Last Name</label>
                      <input
                        {...profileForm.register('lastName', { required: 'Last name is required' })}
                        type="text"
                        className={`input w-full ${profileForm.formState.errors.lastName ? 'input-error' : ''}`}
                      />
                      {profileForm.formState.errors.lastName && (
                        <p className="form-error">{profileForm.formState.errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      {...profileForm.register('email')}
                      type="email"
                      className="input w-full"
                      disabled
                    />
                    <p className="form-help">Email address cannot be changed. Contact an administrator if needed.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input
                        {...profileForm.register('phone')}
                        type="tel"
                        className="input w-full"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Location</label>
                      <input
                        {...profileForm.register('location')}
                        type="text"
                        className="input w-full"
                        placeholder="City, Country"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bio</label>
                    <textarea
                      {...profileForm.register('bio')}
                      className="textarea w-full"
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Security Settings</h3>
                <p className="text-sm text-gray-600">Manage your password and security preferences.</p>
              </div>
              <div className="card-body">
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                  <div className="form-group">
                    <label className="form-label">Current Password</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('currentPassword', { required:  'Current password is required' })}
                        type={showCurrentPassword ? 'text' : 'password'}
                        className={`input w-full pr-10 ${passwordForm.formState.errors.currentPassword ? 'input-error' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="form-error">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('newPassword', {
                          required: 'New password is required',
                          minLength: { value: 8, message: 'Password must be at least 8 characters' }
                        })}
                        type={showNewPassword ? 'text' : 'password'}
                        className={`input w-full pr-10 ${passwordForm.formState.errors.newPassword ? 'input-error' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="form-error">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm New Password</label>
                    <div className="relative">
                      <input
                        {...passwordForm.register('confirmPassword', { required: 'Please confirm your password' })}
                        type={showConfirmPassword ? 'text' : 'password'}
                        className={`input w-full pr-10 ${passwordForm.formState.errors.confirmPassword ? 'input-error' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="form-error">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="btn btn-primary"
                    >
                      {isLoading ? (
                        <LoadingSpinner size="sm" className="mr-2" />
                      ) : (
                        <Lock className="h-4 w-4 mr-2" />
                      )}
                      Change Password
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {activeTab === 'permissions' && (
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Permissions</h3>
                <p className="text-sm text-gray-600">View your current permissions and access levels.</p>
              </div>
              <div className="card-body">
                <div className="space-y-6">
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-3">Role Permissions</h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-gray-900">Current Role</span>
                        <span className={getRoleBadge(user?.role || 'user')}>
                          {user?.role?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Your role determines your access level and available features within the system.
                      </p>
                    </div>
                  </div>

                  {user?.permissions && user.permissions.length > 0 && (
                    <div>
                      <h4 className="text-md font-medium text-gray-900 mb-3">Specific Permissions</h4>
                      <div className="space-y-3">
                        {user.permissions.map((permission, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900 capitalize">
                                {permission.resource.replace('_', ' ')}
                              </span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {permission.actions.map((action, actionIndex) => (
                                <span key={actionIndex} className="badge badge-primary text-xs">
                                  {action.toUpperCase()}
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <Shield className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                      <div>
                        <h5 className="font-medium text-blue-900">Need Additional Access?</h5>
                        <p className="text-sm text-blue-700 mt-1">
                          Contact your system administrator to request additional permissions or role changes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};