import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Mail, ArrowLeft } from 'lucide-react';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface ForgotPasswordFormData {
  email: string;
}

export const ForgotPasswordPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError
  } = useForm<ForgotPasswordFormData>();

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: data.email });
      setIsSubmitted(true);
      toast.success('Password reset link sent to your email');
    } catch (error: any) {
      setError('root', {
        message: error.response?.data?.message || 'Failed to send reset email'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-6 text-center">
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <Mail className="h-8 w-8 text-green-600" />
        </div>
        
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Check your email</h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a password reset link to your email address.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            Didn't receive the email? Check your spam folder or{' '}
            <button
              onClick={() => setIsSubmitted(false)}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              try again
            </button>
          </p>
        </div>

        <Link
          to="/login"
          className="btn btn-outline w-full flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">Forgot your password?</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {errors.root && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.root.message}</p>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
              }
            })}
            type="email"
            className={`input ${errors.email ? 'input-error' : ''}`}
            placeholder="Enter your email"
          />
          {errors.email && (
            <p className="form-error">{errors.email.message}</p>
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
            <Mail className="h-4 w-4 mr-2" />
          )}
          Send reset link
        </button>
      </form>

      <div className="text-center">
        <Link
          to="/login"
          className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
};