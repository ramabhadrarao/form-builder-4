import React from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center space-x-2 mb-8">
            <Building2 className="h-12 w-12 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">NoCode System</span>
          </Link>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          {children}
        </div>
        
        <div className="text-center text-sm text-gray-600">
          <p>Enterprise No-Code Application Management System</p>
        </div>
      </div>
    </div>
  );
};