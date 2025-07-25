import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

export const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch
  } = useForm<ResetPasswordFormData>();

  const password = watch('newPassword');

  useEffect(() => {
    if (!token) {
      toast.error('Invalid reset token');
      navigate('/login');
    }
  }, [token, navigate]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('confirmPassword', {
        message: 'Passwords do not match'
      });
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword: data.newPassword
      });
      setIsSuccess(true);
      toast.success('Password reset successfully');
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.message || 'Failed to reset password'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Password reset successful</h2>
          <p className="mt-2 text-sm text-gray-600">
            Your password has been successfully reset. You can now sign in with your new password.
          </p>
        </div>

        <Link
          to="/login"
          className="btn btn-primary w-full"
        >
          Sign in to your account
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Reset your password</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="newPassword" className="form-label">
            New password
          </label>
          <div className="relative">
            <input
              {...register('newPassword', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                  message: 'Password must contain uppercase, lowercase, number and special character'
                }
              })}
              type={showPassword ? 'text' : 'password'}
              className={`input pr-10 ${errors.newPassword ? 'input-error' : ''}`}
              placeholder="Enter your new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="form-error">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword" className="form-label">
            Confirm new password
          </label>
          <div className="relative">
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: value => value === password || 'Passwords do not match'
              })}
              type={showConfirmPassword ? 'text' : 'password'}
              className={`input pr-10 ${errors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Confirm your new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="form-error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn btn-primary w-full flex items-center justify-center"
        >
          {isLoading ? (
            <LoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Lock className="h-4 w-4 mr-2" />
          )}
          Reset password
        </button>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="text-sm text-blue-600 hover:text-blue-500"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
};